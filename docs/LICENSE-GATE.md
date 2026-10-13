# License Gate — design & implementation (P2.9–P2.12)

**Status:** core landed 2026-09-11 · paid-license activation landed 2026-10-12 (uncommitted).
**Verified:** Phase 1 gate 6/6 PASS (step f = LicenseGate), Python suite 1299 passed,
`swift build -c release` green.

## What exists now

| File | Role |
|---|---|
| `desktop/SwiftNetMax/Sources/netmax-desktop/LicenseGate.swift` | Tiering core: `Tier {Free, Trial, Pro}`, `Feature` list, trial math, activation, persistence |
| `desktop/SwiftNetMax/Sources/netmax-desktop/LicenseGateTests.swift` | Offline harness (repo convention: plain enum, `runAll() -> Int`); trial + license cases, all passing |
| `desktop/SwiftNetMax/Sources/netmax-desktop/TrialRegistryClient.swift` | Trial client + `LicenseClient` (paid tier): injectable transport, `REPLACE-WITH-*` fail-closed placeholders |
| `desktop/scripts/verify_phase1.sh` step **f** | Executable probe: compiles all sources + runs `LicenseGateTests.runAll()`; gate fails if any check fails |

## Rules encoded

1. **FREE** keeps every current feature (on-demand tests, grade). **PRO** adds:
   watch/sentinel alerts, scheduled reports, PDF/ISP report card, exports, deep history.
2. **Trial = 14 days, full-featured**, stamped on first launch, then non-destructive lockout.
   User data is *never* deleted or held hostage (brand rule).
3. **Paid licenses are server-verified** (2026-10-12; replaced the old offline
   5×4 format check). `LicenseGate.activate(key)` calls `POST /v1/license/activate`
   on the registry worker; the worker checks the key against Gumroad, binds a seat
   to this Mac's fingerprint, and returns an Ed25519 token over
   `license-v1|<fingerprint_sha256>|<key_sha256>|<issued_at>`. The app embeds ONLY
   the public key (`REPLACE-WITH-DEPLOYED-LICENSE-PUBLIC-KEY` until MAX sets the
   real one — placeholder fails closed, no unverified Pro). The token verifies
   offline via CryptoKit, so a checked seat keeps working through 503/offline.
   The verified bundle (`licenseKeySHA256`, `licenseToken`, `licenseIssuedAt`,
   `licenseVerifiedAt` under `netmax.prefs.*`) is re-checked with a cheap
   `GET /v1/license/status` on launch and a full re-activate at most every 24h
   while online — this is how refunds/revokes propagate. Revocation drops the
   bundle but keeps the key string: non-destructive, data never touched.
4. **Dev/test override flags** (this is the feature flag the 192-test core runs under):
   - `NETMAX_LICENSE_DISABLED=1` → everything behaves as Pro
   - `NETMAX_LICENSE_MODE=pro|free|trial` → force a tier
5. **Zero date parsing**: trial bounds are stored as two fixed-width UTC ISO strings
   (`yyyy-MM-dd'T'HH:mm:ss'Z'`); "is trial active" is a lexicographic string compare. Testable by
   injecting bounds — no clock dependency in tests.
6. Persistence keys follow the `netmax.prefs.*` contract: `licenseKey`, `trialStartedAt`,
   `trialEndsAt`.

## Remaining work to finish P2.9–P2.12

1. **Wire the gate into call sites** (behind the flag): `ScheduleRunner` (ScheduledReports),
   `Notifications`/sentinel (WatchAlerts), `ReportsView` (PdfReportCard, Exports), history depth.
   Pattern at each site: `guard LicenseGate.shared.canUse(.X) else { show upsell }`.
2. **Settings UI**: "Enter license key" field → `LicenseGate.shared.activate(key)`, show tier,
   link to checkout. Restore/deactivate buttons.
3. **Gumroad integration**: buy button on the site → Gumroad issues the key →
   user pastes it into Settings → `activate` verifies against the worker (which
   checks Gumroad). Fulfillment toggles are MAX's hands in the Gumroad dashboard.
4. **Trial UX**: banner showing days remaining; expired state shows a respectful upsell, never a
   data hostage scene.

## Verification commands

```sh
NETMAX_PYTHON=.venv/bin/python desktop/scripts/verify_phase1.sh   # 6/6 PASS incl. step f
.venv/bin/python -m pytest -q                                      # 1299 passed
cd trial-server-worker && npm test                                 # 64/64 (license contract unchanged)
```