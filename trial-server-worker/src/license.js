/**
 * license.js — paid-tier (Founding License) logic for the trial-registry Worker.
 *
 * Pure like trial.js: no Workers / D1 imports, runs in plain node >= 20 and in
 * Cloudflare Workers (WebCrypto Ed25519). Storage is the adapter in store.js.
 *
 * FLOW
 *   Gumroad issues one license key per sale. The app POSTs the key and its
 *   machine fingerprint to /v1/license/activate. The Worker verifies the key
 *   with Gumroad, binds it to the fingerprint (at most 2 machines per key) and
 *   returns an Ed25519-signed token. The raw key is never stored, only its
 *   SHA-256. The app verifies the token offline with the PUBLIC key, so no
 *   secret ships in the client.
 *
 * TOKEN SCHEME (the compatibility contract for the app — keep in sync with README):
 *   message   = "license-v1|<fingerprint_sha256>|<key_sha256>|<issued_at>"   (UTF-8)
 *   token     = Ed25519 signature of message, 64 bytes, lowercase hex (128 chars)
 *   issued_at = the seat's activated_at, UTC "YYYY-MM-DDTHH:MM:SSZ"
 *   key_sha256 = SHA-256 hex of the license key after trimming whitespace
 *
 * ENFORCEMENT: at activation (and at requireLicense for future paid endpoints).
 * Nothing here meters local probes.
 */

import { utcNowIso, validFingerprint } from "./trial.js";

export const LICENSE_MAX_SEATS = 2;
export const LICENSE_REVALIDATE_SECONDS = 86400; // re-ask Gumroad at most once a day per key
export const GUMROAD_VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";
export const GUMROAD_TIMEOUT_MS = 8000;

const HEX64 = /^[0-9a-f]{64}$/;
const HEX128 = /^[0-9a-f]{128}$/;
const KEY_RE = /^[\x21-\x7e]{1,200}$/; // printable ASCII, no whitespace, after trim
const BEARER_RE = /^Bearer ([0-9a-f]{64})\.([0-9a-f]{64})\.([0-9a-f]{128})$/;
const PLACEHOLDER = "REPLACE_WITH";

export function licenseConfig() {
  return {
    maxSeats: LICENSE_MAX_SEATS,
    revalidateSec: LICENSE_REVALIDATE_SECONDS,
    rateWindowSec: 3600,
    activateLimit: 20,
    statusLimit: 120,
    maxBodyBytes: 64 * 1024,
  };
}

/** Why the license routes cannot run, or null. Trial routes never depend on this. */
export function licenseConfigError(env) {
  if (!env.LICENSE_ED25519_PRIVATE_KEY) return "missing LICENSE_ED25519_PRIVATE_KEY";
  if (!env.GUMROAD_PRODUCT_ID || String(env.GUMROAD_PRODUCT_ID).includes(PLACEHOLDER)) {
    return "missing GUMROAD_PRODUCT_ID";
  }
  return null;
}

// ── crypto ──────────────────────────────────────────────────────────────

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

function unhex(s) {
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function sha256Hex(text) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))));
}

let keyCache = { secret: null, pair: null };

/** Secret = base64 of the PKCS8 DER private key. The public key is derived from it. */
async function keyPair(secret) {
  if (keyCache.secret === secret) return keyCache.pair;
  const der = Uint8Array.from(atob(secret.trim()), (c) => c.charCodeAt(0));
  const priv = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
  const { x } = await crypto.subtle.exportKey("jwk", priv);
  const pub = await crypto.subtle.importKey(
    "jwk",
    { kty: "OKP", crv: "Ed25519", x },
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  keyCache = { secret, pair: { priv, pub, x } };
  return keyCache.pair;
}

/** The 32-byte public key as 64 hex chars — what the app embeds. */
export async function publicKeyHex(secret) {
  const { x } = await keyPair(secret);
  const b64 = x.replace(/-/g, "+").replace(/_/g, "/");
  return hex(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
}

export function licenseMessage(fp, keyHash, issuedAt) {
  return `license-v1|${fp}|${keyHash}|${issuedAt}`;
}

export async function signLicense(secret, fp, keyHash, issuedAt) {
  const { priv } = await keyPair(secret);
  const msg = new TextEncoder().encode(licenseMessage(fp, keyHash, issuedAt));
  return hex(new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, priv, msg)));
}

export async function licenseTokenOk(secret, fp, keyHash, issuedAt, token) {
  if (typeof token !== "string" || !HEX128.test(token)) return false;
  const { pub } = await keyPair(secret);
  const msg = new TextEncoder().encode(licenseMessage(fp, keyHash, issuedAt));
  return crypto.subtle.verify({ name: "Ed25519" }, pub, unhex(token), msg);
}

// ── Gumroad ─────────────────────────────────────────────────────────────

/** Refund / chargeback reason, or null. One place to adjust if Gumroad's fields differ. */
export function revokedReason(purchase) {
  if (purchase.refunded) return "refunded";
  if (purchase.chargebacked) return "chargebacked";
  return null;
}

/**
 * Ask Gumroad about a key. increment_uses_count is false because the D1 seat
 * table, not Gumroad's counter, is the source of truth for machines.
 * Returns {state: "valid" | "invalid" | "revoked" | "unavailable", reason?}.
 */
export async function verifyWithGumroad({ fetchImpl = fetch, productId, licenseKey }) {
  let res;
  let data;
  try {
    res = await fetchImpl(GUMROAD_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_id: productId,
        license_key: licenseKey,
        increment_uses_count: "false",
      }),
      signal: AbortSignal.timeout(GUMROAD_TIMEOUT_MS),
    });
    data = await res.json();
  } catch {
    return { state: "unavailable" };
  }
  if (res.status >= 500 || res.status === 429 || !data || typeof data !== "object") {
    return { state: "unavailable" };
  }
  if (data.success === false) return { state: "invalid" };
  if (data.success !== true || !data.purchase || typeof data.purchase !== "object") {
    return { state: "unavailable" }; // cannot see refund state: fail closed
  }
  const reason = revokedReason(data.purchase);
  return reason ? { state: "revoked", reason } : { state: "valid" };
}

// ── endpoints ───────────────────────────────────────────────────────────

const fail = (status, error) => ({ status, body: { ok: false, error } });
const stale = (iso, nowMs, sec) => nowMs - Date.parse(iso) >= sec * 1000;

/** POST /v1/license/activate — body {license_key, fingerprint_sha256, app_version}. */
export async function handleLicenseActivate({
  store,
  privateKey,
  productId,
  body,
  ip,
  fetchImpl,
  nowMs = Date.now(),
  config = licenseConfig(),
}) {
  if (await store.rateHit("license_activate", ip, nowMs, config.rateWindowSec * 1000, config.activateLimit)) {
    return fail(429, "rate_limited");
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return fail(400, "malformed_request");
  }
  if (!validFingerprint(body.fingerprint_sha256)) return fail(400, "malformed_fingerprint");
  const key = typeof body.license_key === "string" ? body.license_key.trim() : "";
  if (!KEY_RE.test(key)) return fail(400, "malformed_license_key");

  const fp = body.fingerprint_sha256;
  const nowIso = utcNowIso(nowMs);
  const keyHash = await sha256Hex(key);
  let seat = await store.getSeat(keyHash, fp);
  const lic = await store.getLicense(keyHash);

  if (lic && lic.revoked && lic.revoked_reason === "manual") return fail(403, "license_revoked");

  const fresh = lic && !stale(lic.last_verified, nowMs, config.revalidateSec);
  if (!(seat && fresh)) {
    const v = await verifyWithGumroad({ fetchImpl, productId, licenseKey: key });
    if (v.state === "unavailable") {
      // A seat that was valid when last checked keeps working through a Gumroad outage.
      if (!(seat && lic && !lic.revoked)) return fail(503, "verification_unavailable");
    } else if (v.state === "invalid") {
      return fail(403, "invalid_license");
    } else if (v.state === "revoked") {
      await store.saveLicense(keyHash, { revoked: true, reason: v.reason, nowIso });
      return fail(403, "license_revoked");
    } else {
      await store.saveLicense(keyHash, { revoked: false, reason: null, nowIso });
    }
  } else if (lic.revoked) {
    return fail(403, "license_revoked");
  }

  if (!seat) {
    if ((await store.bindSeat(keyHash, fp, nowIso, config.maxSeats)) === "limit") {
      return fail(403, "seat_limit_reached");
    }
    seat = await store.getSeat(keyHash, fp);
  }
  const token = await signLicense(privateKey, fp, keyHash, seat.activated_at);
  return { status: 200, body: { ok: true, issued_at: seat.activated_at, key_sha256: keyHash, token } };
}

/** GET /v1/license/status — reads D1 only; refunds reach it through activate's daily re-check. */
export async function handleLicenseStatus({
  store,
  privateKey,
  fp,
  ks,
  token,
  ip,
  nowMs = Date.now(),
  config = licenseConfig(),
}) {
  if (await store.rateHit("license_status", ip, nowMs, config.rateWindowSec * 1000, config.statusLimit)) {
    return fail(429, "rate_limited");
  }
  if (!validFingerprint(fp) || !HEX64.test(ks ?? "")) return fail(400, "malformed_request");
  const seat = await store.getSeat(ks, fp);
  if (!seat) return fail(404, "unknown_license");
  if (!(await licenseTokenOk(privateKey, fp, ks, seat.activated_at, token))) return fail(403, "bad_token");
  const lic = await store.getLicense(ks);
  const active = !(lic && lic.revoked);
  return {
    status: 200,
    body: { ok: true, active, issued_at: seat.activated_at, ...(active ? {} : { reason: lic.revoked_reason }) },
  };
}

/**
 * Gate for a future remote/paid endpoint. No route uses it yet.
 * Credential: `Authorization: Bearer <fingerprint>.<key_sha256>.<token>` (hex segments).
 * Returns {ok:true, fingerprint, key_sha256} or {ok:false, status, body}.
 */
export async function requireLicense({ store, privateKey, authorization }) {
  const m = BEARER_RE.exec(authorization ?? "");
  if (!m) return { ok: false, ...fail(401, "license_required") };
  const [, fp, ks, token] = m;
  const seat = await store.getSeat(ks, fp);
  if (!seat) return { ok: false, ...fail(403, "invalid_license") };
  if (!(await licenseTokenOk(privateKey, fp, ks, seat.activated_at, token))) {
    return { ok: false, ...fail(403, "bad_token") };
  }
  const lic = await store.getLicense(ks);
  if (lic && lic.revoked) return { ok: false, ...fail(403, "license_revoked") };
  return { ok: true, fingerprint: fp, key_sha256: ks };
}
