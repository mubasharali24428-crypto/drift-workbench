# NetMax Trial Registry — Cloudflare Worker + D1

Edge port of `trial_server/server.py` (the stdlib-Python reference server).
Same API, same policy, same tokens — so the shipped Swift
`TrialRegistryClient` works against this Worker **unchanged**.

**Status:** the trial routes are deployed as `drift-trial-registry` (verified live
2026-10-10). The **license routes (paid tier) are built and tested but NOT
deployed**. Deploying is the founder's call; the exact steps are under "Deploy".

## Layout

```
trial-server-worker/
  src/worker.js   Worker entry point (fetch handler — wiring only)
  src/trial.js    Pure policy logic: validation, HMAC tokens, endpoint logic.
                  No Workers/D1 imports; runs in plain node >= 18.
  src/license.js  Paid tier: Gumroad verification, seat binding, Ed25519 tokens,
                  requireLicense. Pure, like trial.js.
  src/store.js    Storage adapters: createD1Store (production) and
                  createMemoryStore (in-memory shim for tests/dev).
  schema.sql      D1 schema (trials, rate_hits, licenses, license_seats).
  scripts/gen-license-key.mjs  Generates the Ed25519 signing keypair.
  wrangler.toml   Worker name, D1 binding, GUMROAD_PRODUCT_ID var, compat date.
  test/trial.test.js    28 trial tests (unchanged).
  test/license.test.js  License logic, token interop, key script (stubbed Gumroad).
  test/worker.test.js   worker.js + the real D1 SQL on SQLite (node:sqlite, node >= 22.5).
```

## API (identical to the Python server)

`POST /v1/trial/activate` with JSON `{fingerprint_sha256, app_version, vm_suspected}` →
- `200` `{ok:true, trial_start, trial_end, token}`
- `403` `{ok:false, error:"trial_already_consumed", trial_start, trial_end}`
- `403` `{ok:false, error:"vm_not_allowed"}` (when `DENY_VM_TRIALS` and the client reports a suspected VM)
- `400` malformed fingerprint / malformed request · `429` rate-limited

`GET /v1/trial/status?fp=<hex>&token=<hex>` →
- `200` `{ok:true, active:bool, trial_start, trial_end}`
- `403` `{ok:false, error:"bad_token"}` · `404` `{ok:false, error:"unknown_fingerprint"}` · `429` rate-limited

`GET /healthz` → `200` `{ok:true}`

Policy constants mirror the Python server: `TRIAL_DAYS = 14`,
`DENY_VM_TRIALS = true` (toggleable), 20 activations / 120 status checks per
IP per rolling hour, 64 KiB max body. The raw hardware UUID is never
accepted, logged, or stored — only its 64-hex digest.

## License API (paid tier — Founding License, $29)

Gumroad issues one license key per sale. The app sends the key and its machine
fingerprint here; the Worker verifies the key with Gumroad, binds it to the
fingerprint (**2 machines per key**) and returns an Ed25519-signed token. The
Worker stores only `SHA-256(key)` and the fingerprint, never the key or the buyer's
email. Enforcement is at activation (and `requireLicense` for future paid
endpoints); nothing meters local probes. The Swift app still uses its local format
check until it is wired to these routes.

`POST /v1/license/activate` with JSON `{license_key, fingerprint_sha256, app_version}` →
- `200` `{ok:true, issued_at, key_sha256, token}` (idempotent for a bound machine)
- `403` `invalid_license` · `license_revoked` (refunded / chargebacked / manual) · `seat_limit_reached`
- `400` `malformed_request` / `malformed_fingerprint` / `malformed_license_key` · `429` `rate_limited`
- `503` `verification_unavailable` (Gumroad unreachable: fails closed for a new seat; a seat that was
  valid at its last check keeps working)
- `500` `server_misconfigured` (secret or product id missing) · `server_error`

`GET /v1/license/status?fp=<hex>&ks=<key_sha256>&token=<hex>` →
- `200` `{ok:true, active, issued_at}` plus `reason` when `active` is false
- `403` `bad_token` · `404` `unknown_license` · `400` malformed · `429`

Status reads D1 only. Refunds reach it through activate: each key is re-checked
with Gumroad at most once per 24 h, when an already-bound machine activates again
(the app should do this periodically). Manual revokes are permanent until undone.

**Token (the license contract — keep the app in sync):**

```
message    = "license-v1|<fingerprint_sha256>|<key_sha256>|<issued_at>"   (UTF-8)
token      = Ed25519 signature of message, 64 bytes, lowercase hex (128 chars)
issued_at  = the seat's activated_at, UTC "YYYY-MM-DDTHH:MM:SSZ"
key_sha256 = SHA-256 hex of the license key after trimming whitespace
```

The app embeds only the PUBLIC key (64 hex chars, printed by `gen-license-key.mjs`) and
verifies offline: Swift `Curve25519.Signing.PublicKey(rawRepresentation:)` +
`isValidSignature`. Checked against CryptoKit and `node:crypto`. Nothing secret ships
in the app, unlike the trial's HMAC scheme (which is unchanged).

`requireLicense({store, privateKey, authorization})` in `license.js` gates a future
remote/paid endpoint: `Authorization: Bearer <fingerprint>.<key_sha256>.<token>`
(hex segments). No route uses it yet.

Gumroad call: `POST https://api.gumroad.com/v2/licenses/verify` with `product_id`,
`license_key`, `increment_uses_count=false` (D1 is the seat authority). A purchase with
`refunded` or `chargebacked` is revoked (`revokedReason()` in `license.js` is the one place to
change that). Confirm the field names against your live product before relying on them.

### Operations (run with `npx wrangler d1 execute TRIAL_DB --remote --command "<SQL>"`)

```sql
-- hash a key first (never paste a key into SQL):  printf %s "$KEY" | shasum -a 256
-- revoke by hand (the key must have activated once):
UPDATE licenses SET revoked = 1, revoked_reason = 'manual' WHERE key_sha256 = '<hash>';
-- undo a manual revoke (the next activate re-checks Gumroad):
UPDATE licenses SET revoked = 0, revoked_reason = NULL, last_verified = '2000-01-01T00:00:00Z' WHERE key_sha256 = '<hash>';
-- free a seat (customer changed machine):
DELETE FROM license_seats WHERE key_sha256 = '<hash>' AND fingerprint_sha256 = '<fingerprint>';
-- see seats used per key:
SELECT key_sha256, COUNT(*) AS seats FROM license_seats GROUP BY key_sha256;
```

## Token scheme (the trial compatibility contract)

**Do not change this without also changing `trial_server/server.py` and the
Swift client — all three must agree byte-for-byte.**

```
fingerprint = SHA-256 hex digest (64 lowercase chars) of the hardware UUID string
message     = "<fingerprint>|<trial_start>|<trial_end>"      (UTF-8 bytes, "|" = 0x7C)
token       = HMAC-SHA256(key = HMAC-secret UTF-8 bytes, message), lowercase hex
timestamps  = UTC "YYYY-MM-DDTHH:MM:SSZ" (second precision, no fractional part)
trial_end   = trial_start + 14 days (exact 14×86400 s addition)
verify      = constant-time compare of recomputed token vs presented token
```

Implementation notes:
- Python uses `hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()`;
  this Worker uses WebCrypto `crypto.subtle` HMAC-SHA256 with the same key
  and message bytes — the algorithms are deterministic, so outputs match
  exactly. Verified by test: a token vector generated by the Python server
  (`2dbb66b7…5cb27c`) verifies byte-for-byte in the Worker code.
- Python compares with `hmac.compare_digest`; the Worker uses a manual
  constant-time char-code XOR loop (`tokensEqual`), since `node:crypto` is
  deliberately avoided to keep `trial.js` runnable in Workers.
- `Date.toISOString()` emits milliseconds (`…T15:27:30.123Z`); they are
  stripped to match Python's `strftime("%Y-%m-%dT%H:%M:%SZ")` exactly.

## Why rate limiting lives in D1 (not Workers KV)

The Python server keeps per-IP rolling windows in process memory. Workers
have no shared process memory across isolates, so the window must live
somewhere durable. D1 was chosen over KV because: (a) one binding instead
of two, (b) strong consistency — KV's eventual consistency would let
bursts slip through the limit, and (c) the rolling-window query
(`COUNT(*) … WHERE ts >= cutoff`) maps 1:1 onto the Python semantics.
Rows are tiny and pruned on every check (`rate_hits` table in `schema.sql`).

## Deploy (run these yourself)

The trial routes are already deployed as `drift-trial-registry`. These steps add the
license routes to that worker. Prerequisites: `npx wrangler login` (your hands), Node 22+.

```bash
cd trial-server-worker

# 1. Tests (no network, no D1)
npm test

# 2. Find the DEPLOYED database; put its name in `database_name` and its id in `database_id`
#    in wrangler.toml, and your Gumroad product ID in `GUMROAD_PRODUCT_ID` ([vars]).
npx wrangler d1 list

# 3. Add the license tables (idempotent: only adds tables, trials are untouched)
npx wrangler d1 execute TRIAL_DB --remote --file schema.sql

# 4. Generate the signing key. The PRIVATE key goes to a file outside the repo (mode 0600);
#    only the PUBLIC key (64 hex) is printed. Keep the public key: the app embeds it.
node scripts/gen-license-key.mjs --out ~/drift-license.key

# 5. Upload the private key as a secret, back it up in your password manager, then delete the file
npx wrangler secret put LICENSE_ED25519_PRIVATE_KEY < ~/drift-license.key
rm ~/drift-license.key

# 6. Ship it (sets the worker's vars from wrangler.toml)
npx wrangler deploy
```

Smoke test after deploy (uses one of your key's 2 seats; free it with the SQL above):

```bash
BASE=https://drift-trial-registry.mubasharali24428.workers.dev
curl -s $BASE/healthz                       # {"ok":true}
read -rs KEY                                # paste your own Gumroad license key; it is not echoed
curl -s -X POST $BASE/v1/license/activate -H 'content-type: application/json' \
  -d "{\"license_key\":\"$KEY\",\"fingerprint_sha256\":\"$(printf %s smoke-test | shasum -a 256 | cut -d' ' -f1)\"}"
```

A `200` with a 128-hex `token` means Gumroad, D1 and the signing key all work. A wrong
key must return `403 invalid_license`.

Rotating `LICENSE_ED25519_PRIVATE_KEY` invalidates every issued license token: apps would
need the new public key, and customers re-activate. Rotating `NETMAX_TRIAL_HMAC_SECRET` is
independent (see Security notes).

## Point the app at it

In the macOS app, set:

```swift
TrialRegistryClient.defaultBaseURLString = "https://drift-trial-registry.mubasharali24428.workers.dev"
```

(and `embeddedHMACSecret` to the same value as `NETMAX_TRIAL_HMAC_SECRET`). Until the Worker
is live, Start Trial fail-closes with "couldn't reach the trial server" —
that is intentional.

## Security notes

- License signing key: only in `wrangler secret` storage (and your backup). The script
  writes it outside the repo, refuses to overwrite, and never prints it. License keys
  are stored only as SHA-256, never logged; the worker logs error names only.

- The HMAC secret is the whole trust root: anyone holding it can mint valid
  trial tokens for any fingerprint. It lives only in `wrangler secret`
  storage and the Swift client's embedded secret — never in this repo,
  never in logs.
- Rotating the secret invalidates every issued token. Trial rows keep their
  `trial_start`/`trial_end`, but clients holding old tokens will fail
  `bad_token` until they re-activate (which will then correctly report
  `trial_already_consumed`).
