/**
 * Tests for the paid-tier (license) logic. Run: node --test test/license.test.js
 * No network, no D1: Gumroad is a stub, storage is the in-memory shim, and every
 * key below is fake. The signing keypair is generated fresh for each run.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, verify as nodeVerify } from "node:crypto";
import { mkdtempSync, rmSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GUMROAD_VERIFY_URL,
  LICENSE_MAX_SEATS,
  handleLicenseActivate,
  handleLicenseStatus,
  licenseConfig,
  licenseConfigError,
  licenseMessage,
  licenseTokenOk,
  publicKeyHex,
  requireLicense,
  sha256Hex,
  signLicense,
} from "../src/license.js";
import { createMemoryStore } from "../src/store.js";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const SECRET = privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
const KEY = "TEST0000-TEST0000-TEST0000-TEST0000"; // fake
const PRODUCT = "test-product-id"; // fake
const FP = "f".repeat(64);
const FP2 = "e".repeat(64);
const FP3 = "d".repeat(64);
const IP = "203.0.113.7";
const T0 = Date.UTC(2026, 9, 12, 12, 0, 0);
const HOUR = 3600 * 1000;

const cfg = (o = {}) => ({ ...licenseConfig(), activateLimit: 1000, statusLimit: 1000, ...o });
const gum = (status, body) => new Response(JSON.stringify(body), { status });
const GOOD = { success: true, uses: 0, purchase: { refunded: false, chargebacked: false } };

/** A fetch stub that serves queued responses (functions may throw) and records calls. */
function stub(...responses) {
  const calls = [];
  let i = 0;
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const r = responses[Math.min(i++, responses.length - 1)];
    // A Response body can be read once, so hand out clones.
    return typeof r === "function" ? r() : r.clone();
  };
  return { fetchImpl, calls };
}

const activate = (store, fetchImpl, o = {}) =>
  handleLicenseActivate({
    store,
    privateKey: SECRET,
    productId: PRODUCT,
    body: { license_key: KEY, fingerprint_sha256: FP, app_version: "1.0.8" },
    ip: IP,
    fetchImpl,
    nowMs: T0,
    config: cfg(),
    ...o,
  });

const status = (store, o) =>
  handleLicenseStatus({ store, privateKey: SECRET, ip: IP, nowMs: T0, config: cfg(), ...o });

describe("token scheme", () => {
  it("signs the documented message and verifies outside our own code (node:crypto)", async () => {
    const ks = await sha256Hex(KEY);
    const token = await signLicense(SECRET, FP, ks, "2026-10-12T12:00:00Z");
    assert.match(token, /^[0-9a-f]{128}$/);
    const msg = Buffer.from(`license-v1|${FP}|${ks}|2026-10-12T12:00:00Z`);
    assert.equal(licenseMessage(FP, ks, "2026-10-12T12:00:00Z"), msg.toString());
    assert.equal(nodeVerify(null, msg, publicKey, Buffer.from(token, "hex")), true);
  });
  it("rejects a token for another fingerprint, key or time, and malformed tokens", async () => {
    const ks = await sha256Hex(KEY);
    const t = "2026-10-12T12:00:00Z";
    const token = await signLicense(SECRET, FP, ks, t);
    assert.equal(await licenseTokenOk(SECRET, FP, ks, t, token), true);
    assert.equal(await licenseTokenOk(SECRET, FP2, ks, t, token), false);
    assert.equal(await licenseTokenOk(SECRET, FP, "0".repeat(64), t, token), false);
    assert.equal(await licenseTokenOk(SECRET, FP, ks, "2026-10-12T12:00:01Z", token), false);
    assert.equal(await licenseTokenOk(SECRET, FP, ks, t, "zz" + token.slice(2)), false);
    assert.equal(await licenseTokenOk(SECRET, FP, ks, t, token.slice(2)), false);
    assert.equal(await licenseTokenOk(SECRET, FP, ks, t, null), false);
  });
  it("publicKeyHex matches the real public key", async () => {
    const x = publicKey.export({ format: "jwk" }).x;
    assert.equal(await publicKeyHex(SECRET), Buffer.from(x, "base64url").toString("hex"));
  });
});

describe("activate", () => {
  it("verifies with Gumroad, binds a seat, returns a token that verifies", async () => {
    const store = createMemoryStore();
    const g = stub(gum(200, GOOD));
    const r = await activate(store, g.fetchImpl);
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
    assert.equal(r.body.issued_at, "2026-10-12T12:00:00Z");
    assert.equal(r.body.key_sha256, await sha256Hex(KEY));
    assert.equal(await licenseTokenOk(SECRET, FP, r.body.key_sha256, r.body.issued_at, r.body.token), true);
    assert.equal(g.calls.length, 1);
  });
  it("sends Gumroad a form POST with product_id, license_key and increment_uses_count=false", async () => {
    const g = stub(gum(200, GOOD));
    await activate(createMemoryStore(), g.fetchImpl);
    const { url, init } = g.calls[0];
    assert.equal(url, GUMROAD_VERIFY_URL);
    assert.equal(init.method, "POST");
    assert.equal(init.body.get("product_id"), PRODUCT);
    assert.equal(init.body.get("license_key"), KEY);
    assert.equal(init.body.get("increment_uses_count"), "false");
  });
  it("never stores the raw key", async () => {
    const store = createMemoryStore();
    await activate(store, stub(gum(200, GOOD)).fetchImpl);
    const dump = JSON.stringify([[...store._licenses], [...store._seats], store._hits]);
    assert.equal(dump.includes(KEY), false);
    assert.equal(dump.includes(await sha256Hex(KEY)), true);
  });
  it("trims whitespace around the key (same hash)", async () => {
    const store = createMemoryStore();
    const r = await activate(store, stub(gum(200, GOOD)).fetchImpl, {
      body: { license_key: `  ${KEY}\n`, fingerprint_sha256: FP },
    });
    assert.equal(r.body.key_sha256, await sha256Hex(KEY));
  });
  it("is idempotent for the same machine and skips Gumroad while the check is fresh", async () => {
    const store = createMemoryStore();
    const g = stub(gum(200, GOOD));
    const a = await activate(store, g.fetchImpl);
    const b = await activate(store, g.fetchImpl, { nowMs: T0 + HOUR });
    assert.deepEqual(b.body, a.body);
    assert.equal(g.calls.length, 1);
  });
  it("allows 2 machines and refuses the third, but existing seats keep working", async () => {
    assert.equal(LICENSE_MAX_SEATS, 2);
    const store = createMemoryStore();
    const g = stub(gum(200, GOOD));
    const mk = (fp) => ({ license_key: KEY, fingerprint_sha256: fp });
    assert.equal((await activate(store, g.fetchImpl, { body: mk(FP) })).status, 200);
    assert.equal((await activate(store, g.fetchImpl, { body: mk(FP2) })).status, 200);
    const third = await activate(store, g.fetchImpl, { body: mk(FP3) });
    assert.equal(third.status, 403);
    assert.equal(third.body.error, "seat_limit_reached");
    assert.equal((await activate(store, g.fetchImpl, { body: mk(FP2) })).status, 200);
    assert.equal(store._seats.size, 2);
  });
  it("an unknown key is invalid_license and binds nothing", async () => {
    const store = createMemoryStore();
    const r = await activate(store, stub(gum(404, { success: false, message: "That license does not exist" })).fetchImpl);
    assert.deepEqual([r.status, r.body.error], [403, "invalid_license"]);
    assert.equal(store._seats.size, 0);
  });
  for (const reason of ["refunded", "chargebacked"]) {
    it(`a ${reason} purchase is license_revoked and binds nothing`, async () => {
      const store = createMemoryStore();
      const body = { success: true, purchase: { refunded: false, chargebacked: false, [reason]: true } };
      const r = await activate(store, stub(gum(200, body)).fetchImpl);
      assert.deepEqual([r.status, r.body.error], [403, "license_revoked"]);
      assert.equal(store._seats.size, 0);
      assert.equal((await store.getLicense(await sha256Hex(KEY))).revoked_reason, reason);
    });
  }
  it("fails closed (503) when Gumroad is unreachable, errors, or answers oddly", async () => {
    const cases = [
      () => {
        throw new Error("network down");
      },
      gum(500, { success: false }),
      gum(429, { success: false }),
      new Response("<html>not json</html>", { status: 200 }),
      gum(200, { success: true }), // no purchase object: cannot see refund state
    ];
    for (const c of cases) {
      const store = createMemoryStore();
      const r = await activate(store, stub(c).fetchImpl);
      assert.deepEqual([r.status, r.body.error], [503, "verification_unavailable"]);
      assert.equal(store._seats.size, 0);
    }
  });
  it("re-checks Gumroad after 24 h: a later refund revokes, and status reports it", async () => {
    const store = createMemoryStore();
    const a = await activate(store, stub(gum(200, GOOD)).fetchImpl);
    const refunded = stub(gum(200, { success: true, purchase: { refunded: true } }));
    const r = await activate(store, refunded.fetchImpl, { nowMs: T0 + 25 * HOUR });
    assert.deepEqual([r.status, r.body.error], [403, "license_revoked"]);
    const s = await status(store, { fp: FP, ks: a.body.key_sha256, token: a.body.token });
    assert.deepEqual([s.status, s.body.active, s.body.reason], [200, false, "refunded"]);
  });
  it("a stale seat keeps working through a Gumroad outage", async () => {
    const store = createMemoryStore();
    const a = await activate(store, stub(gum(200, GOOD)).fetchImpl);
    const down = stub(() => {
      throw new Error("network down");
    });
    const b = await activate(store, down.fetchImpl, { nowMs: T0 + 25 * HOUR });
    assert.equal(down.calls.length, 1);
    assert.deepEqual(b.body, a.body);
  });
  it("a reversed refund un-revokes on the next check", async () => {
    const store = createMemoryStore();
    await activate(store, stub(gum(200, { success: true, purchase: { refunded: true } })).fetchImpl);
    const r = await activate(store, stub(gum(200, GOOD)).fetchImpl, { nowMs: T0 + HOUR });
    assert.equal(r.status, 200);
  });
  it("a manual revoke wins without asking Gumroad", async () => {
    const store = createMemoryStore();
    await store.saveLicense(await sha256Hex(KEY), { revoked: true, reason: "manual", nowIso: "2026-10-12T12:00:00Z" });
    const g = stub(gum(200, GOOD));
    const r = await activate(store, g.fetchImpl, { nowMs: T0 + 48 * HOUR });
    assert.deepEqual([r.status, r.body.error], [403, "license_revoked"]);
    assert.equal(g.calls.length, 0);
  });
  it("rejects malformed input before calling Gumroad", async () => {
    const g = stub(gum(200, GOOD));
    const store = createMemoryStore();
    const bad = [
      [{ fingerprint_sha256: FP }, "malformed_license_key"],
      [{ license_key: 12345, fingerprint_sha256: FP }, "malformed_license_key"],
      [{ license_key: "   ", fingerprint_sha256: FP }, "malformed_license_key"],
      [{ license_key: "AB CD", fingerprint_sha256: FP }, "malformed_license_key"],
      [{ license_key: "A".repeat(201), fingerprint_sha256: FP }, "malformed_license_key"],
      [{ license_key: "AB\u0000CD", fingerprint_sha256: FP }, "malformed_license_key"],
      [{ license_key: KEY, fingerprint_sha256: "F".repeat(64) }, "malformed_fingerprint"],
      [{ license_key: KEY }, "malformed_fingerprint"],
      [[], "malformed_request"],
      [null, "malformed_request"],
    ];
    for (const [body, error] of bad) {
      const r = await activate(store, g.fetchImpl, { body });
      assert.deepEqual([r.status, r.body.error], [400, error]);
    }
    assert.equal(g.calls.length, 0);
  });
  it("rate limits activations per IP", async () => {
    const store = createMemoryStore();
    const g = stub(gum(200, GOOD));
    const c = cfg({ activateLimit: 2 });
    assert.equal((await activate(store, g.fetchImpl, { config: c })).status, 200);
    assert.equal((await activate(store, g.fetchImpl, { config: c })).status, 200);
    assert.equal((await activate(store, g.fetchImpl, { config: c })).status, 429);
  });
});

describe("status", () => {
  async function setup() {
    const store = createMemoryStore();
    const a = await activate(store, stub(gum(200, GOOD)).fetchImpl);
    return { store, ks: a.body.key_sha256, token: a.body.token };
  }
  it("reports active for a valid seat and token", async () => {
    const { store, ks, token } = await setup();
    const r = await status(store, { fp: FP, ks, token });
    assert.deepEqual([r.status, r.body.ok, r.body.active], [200, true, true]);
  });
  it("rejects a wrong or tampered token, another machine's token, and unknown seats", async () => {
    const { store, ks, token } = await setup();
    const flipped = (token[0] === "a" ? "b" : "a") + token.slice(1);
    assert.equal((await status(store, { fp: FP, ks, token: flipped })).body.error, "bad_token");
    assert.equal((await status(store, { fp: FP, ks, token: "0".repeat(128) })).status, 403);
    assert.equal((await status(store, { fp: FP2, ks, token })).body.error, "unknown_license");
    assert.equal((await status(store, { fp: FP, ks: "0".repeat(64), token })).status, 404);
  });
  it("rejects malformed parameters", async () => {
    const { store, ks, token } = await setup();
    assert.equal((await status(store, { fp: "x", ks, token })).status, 400);
    assert.equal((await status(store, { fp: FP, ks: "x", token })).status, 400);
    assert.equal((await status(store, { fp: FP, ks: null, token })).status, 400);
  });
  it("rate limits per IP", async () => {
    const { store, ks, token } = await setup();
    const c = cfg({ statusLimit: 1 });
    assert.equal((await status(store, { fp: FP, ks, token, config: c })).status, 200);
    assert.equal((await status(store, { fp: FP, ks, token, config: c })).status, 429);
  });
});

describe("requireLicense (gate for future paid endpoints)", () => {
  async function setup() {
    const store = createMemoryStore();
    const a = await activate(store, stub(gum(200, GOOD)).fetchImpl);
    const bearer = `Bearer ${FP}.${a.body.key_sha256}.${a.body.token}`;
    return { store, bearer, ks: a.body.key_sha256 };
  }
  const gate = (store, authorization) => requireLicense({ store, privateKey: SECRET, authorization });
  it("admits a valid license", async () => {
    const { store, bearer, ks } = await setup();
    assert.deepEqual(await gate(store, bearer), { ok: true, fingerprint: FP, key_sha256: ks });
  });
  it("401 without a well-formed credential", async () => {
    const { store, bearer } = await setup();
    for (const h of [undefined, "", "Bearer x", bearer.replace("Bearer ", "Basic "), bearer + "0"]) {
      const r = await gate(store, h);
      assert.deepEqual([r.ok, r.status, r.body.error], [false, 401, "license_required"]);
    }
  });
  it("403 for an unknown seat, a bad token, and a revoked license", async () => {
    const { store, bearer, ks } = await setup();
    const other = bearer.replace(FP, FP2);
    assert.equal((await gate(store, other)).body.error, "invalid_license");
    const badTok = bearer.slice(0, -1) + (bearer.endsWith("0") ? "1" : "0");
    assert.equal((await gate(store, badTok)).body.error, "bad_token");
    await store.saveLicense(ks, { revoked: true, reason: "manual", nowIso: "2026-10-12T12:00:00Z" });
    assert.equal((await gate(store, bearer)).body.error, "license_revoked");
  });
});

describe("configuration and key tooling", () => {
  it("licenseConfigError names a missing secret or an unset product id", () => {
    assert.equal(licenseConfigError({ LICENSE_ED25519_PRIVATE_KEY: SECRET, GUMROAD_PRODUCT_ID: "abc" }), null);
    assert.match(licenseConfigError({ GUMROAD_PRODUCT_ID: "abc" }), /PRIVATE_KEY/);
    assert.match(licenseConfigError({ LICENSE_ED25519_PRIVATE_KEY: SECRET }), /PRODUCT_ID/);
    assert.match(
      licenseConfigError({ LICENSE_ED25519_PRIVATE_KEY: SECRET, GUMROAD_PRODUCT_ID: "REPLACE_WITH_GUMROAD_PRODUCT_ID" }),
      /PRODUCT_ID/,
    );
  });
  it("gen-license-key.mjs writes a 0600 private key outside the repo and prints only the public key", async () => {
    const dir = mkdtempSync(join(tmpdir(), "licgen-"));
    try {
      const out = join(dir, "license.key");
      const script = new URL("../scripts/gen-license-key.mjs", import.meta.url).pathname;
      const run = spawnSync(process.execPath, [script, "--out", out], { encoding: "utf8" });
      assert.equal(run.status, 0, run.stderr);
      assert.match(run.stdout.trim(), /^[0-9a-f]{64}$/);
      assert.equal(run.stdout.includes(readFileSync(out, "utf8").trim()), false);
      assert.equal(statSync(out).mode & 0o777, 0o600);
      // The file is a usable worker secret and the printed key is its public half.
      assert.equal(await publicKeyHex(readFileSync(out, "utf8")), run.stdout.trim());
      const again = spawnSync(process.execPath, [script, "--out", out], { encoding: "utf8" });
      assert.notEqual(again.status, 0, "must not overwrite an existing key file");
      const inRepo = spawnSync(process.execPath, [script, "--out", new URL("../x.key", import.meta.url).pathname], {
        encoding: "utf8",
      });
      assert.equal(inRepo.status, 2);
      assert.match(inRepo.stderr, /inside the repo/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
