/**
 * End-to-end tests of worker.js + the REAL D1 SQL in store.js, run against SQLite
 * (node:sqlite) behind a minimal D1 shim. Covers what the in-memory shim cannot:
 * the actual statements, the atomic seat bind, schema.sql, and route isolation.
 * Skipped when node:sqlite is unavailable (needs node >= 22.5). Gumroad is stubbed
 * on globalThis.fetch; all keys are fake.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";

let DatabaseSync = null;
try {
  ({ DatabaseSync } = await import("node:sqlite"));
} catch {
  /* skipped below */
}

const SECRET = generateKeyPairSync("ed25519").privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
const KEY = "TEST0000-TEST0000-TEST0000-TEST0000"; // fake
const FP = (c) => c.repeat(64);

/** Just enough of the D1 API for store.js: prepare().bind().first()/run(), batch(). */
function fakeD1(sqlite) {
  const stmt = (sql) => ({
    bind: (...args) => ({
      sql,
      args,
      first: async () => sqlite.prepare(sql).get(...args) ?? null,
      run: async () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...args).changes) } }),
    }),
  });
  return {
    prepare: stmt,
    batch: async (list) => list.map((s) => ({ results: sqlite.prepare(s.sql).all(...s.args) })),
  };
}

const realFetch = globalThis.fetch;
let gumroad;
const setGumroad = (status, body) => {
  gumroad = { status, body, calls: 0 };
};

describe("worker.js on SQLite", { skip: !DatabaseSync && "node:sqlite not available" }, async () => {
  const { default: worker } = await import("../src/worker.js");
  let sqlite;
  let env;
  const call = (method, path, body) =>
    worker.fetch(
      new Request(`https://w.test${path}`, {
        method,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
        headers: { "CF-Connecting-IP": "203.0.113.9" },
      }),
      env,
    );
  const json = async (p) => {
    const r = await p;
    return [r.status, await r.json()];
  };
  const activate = (fp, key = KEY) => json(call("POST", "/v1/license/activate", { license_key: key, fingerprint_sha256: fp }));

  before(() => {
    globalThis.fetch = async () => {
      gumroad.calls++;
      return new Response(JSON.stringify(gumroad.body), { status: gumroad.status });
    };
  });
  after(() => {
    globalThis.fetch = realFetch;
  });
  const fresh = () => {
    sqlite = new DatabaseSync(":memory:");
    sqlite.exec(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
    env = {
      TRIAL_DB: fakeD1(sqlite),
      NETMAX_TRIAL_HMAC_SECRET: "test-trial-secret",
      LICENSE_ED25519_PRIVATE_KEY: SECRET,
      GUMROAD_PRODUCT_ID: "test-product-id",
    };
    setGumroad(200, { success: true, purchase: { refunded: false, chargebacked: false } });
  };

  it("schema.sql applies twice (idempotent against the deployed database)", () => {
    fresh();
    sqlite.exec(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  });

  it("license: activate, second machine, third machine refused, status, key never stored", async () => {
    fresh();
    const [s1, b1] = await activate(FP("a"));
    assert.deepEqual([s1, b1.ok], [200, true]);
    assert.equal((await activate(FP("b")))[0], 200);
    const [s3, b3] = await activate(FP("c"));
    assert.deepEqual([s3, b3.error], [403, "seat_limit_reached"]);
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM license_seats").get().n, 2);

    const q = `fp=${FP("a")}&ks=${b1.key_sha256}&token=${b1.token}`;
    const [ss, sb] = await json(call("GET", `/v1/license/status?${q}`));
    assert.deepEqual([ss, sb.active, sb.issued_at], [200, true, b1.issued_at]);

    const stored = JSON.stringify([
      sqlite.prepare("SELECT * FROM licenses").all(),
      sqlite.prepare("SELECT * FROM license_seats").all(),
      sqlite.prepare("SELECT * FROM rate_hits").all(),
    ]);
    assert.equal(stored.includes(KEY), false);
  });

  it("license: parallel activations of one key never exceed 2 seats", async () => {
    fresh();
    const results = await Promise.all("abcdef01".split("").map((c) => activate(FP(c))));
    assert.equal(results.filter(([s]) => s === 200).length, 2);
    assert.equal(results.filter(([s, b]) => s === 403 && b.error === "seat_limit_reached").length, 6, JSON.stringify(results));
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM license_seats").get().n, 2);
  });

  it("license: refund on the daily re-check revokes; first_seen survives the upsert", async () => {
    fresh();
    const [, a] = await activate(FP("a"));
    const first = sqlite.prepare("SELECT first_seen FROM licenses").get().first_seen;
    // Age the check by 25 h, then Gumroad reports a refund.
    sqlite.prepare("UPDATE licenses SET last_verified = ?").run("2000-01-01T00:00:00Z");
    setGumroad(200, { success: true, purchase: { refunded: true } });
    const [s, b] = await activate(FP("a"));
    assert.deepEqual([s, b.error], [403, "license_revoked"]);
    const row = sqlite.prepare("SELECT * FROM licenses").get();
    assert.deepEqual([row.revoked, row.revoked_reason, row.first_seen], [1, "refunded", first]);
    const [, sb] = await json(call("GET", `/v1/license/status?fp=${FP("a")}&ks=${a.key_sha256}&token=${a.token}`));
    assert.deepEqual([sb.active, sb.reason], [false, "refunded"]);
  });

  it("license: a Gumroad outage fails closed with 503", async () => {
    fresh();
    setGumroad(500, { success: false });
    const [s, b] = await activate(FP("a"));
    assert.deepEqual([s, b.error], [503, "verification_unavailable"]);
  });

  it("license routes fail closed when unconfigured; trial routes keep working", async () => {
    fresh();
    const trial = () => json(call("POST", "/v1/trial/activate", { fingerprint_sha256: FP("1") }));
    env.GUMROAD_PRODUCT_ID = "REPLACE_WITH_GUMROAD_PRODUCT_ID";
    assert.deepEqual((await activate(FP("a")))[0], 500);
    assert.equal((await trial())[0], 200);

    fresh();
    delete env.LICENSE_ED25519_PRIVATE_KEY;
    assert.deepEqual(await activate(FP("a")), [500, { ok: false, error: "server_misconfigured" }]);

    fresh();
    env.LICENSE_ED25519_PRIVATE_KEY = "not-a-key";
    assert.deepEqual(await activate(FP("a")), [500, { ok: false, error: "server_error" }]);
    assert.equal((await trial())[0], 200);
  });

  it("trial routes are unchanged on real SQL: activate, repeat is consumed, status", async () => {
    fresh();
    const [s, b] = await json(call("POST", "/v1/trial/activate", { fingerprint_sha256: FP("2") }));
    assert.deepEqual([s, b.ok], [200, true]);
    const [s2, b2] = await json(call("POST", "/v1/trial/activate", { fingerprint_sha256: FP("2") }));
    assert.deepEqual([s2, b2.error], [403, "trial_already_consumed"]);
    const [s3, b3] = await json(call("GET", `/v1/trial/status?fp=${FP("2")}&token=${b.token}`));
    assert.deepEqual([s3, b3.active], [200, true]);
    assert.equal((await json(call("GET", "/healthz")))[0], 200);
  });

  it("license route shape: wrong method 404, bad JSON 400, oversized body 400, rate limit 429", async () => {
    fresh();
    assert.equal((await json(call("GET", "/v1/license/activate")))[0], 404);
    assert.equal((await json(call("POST", "/v1/license/other", {})))[0], 404);
    assert.deepEqual(await json(call("POST", "/v1/license/activate", "{nope")), [400, { ok: false, error: "malformed_request" }]);
    assert.equal((await json(call("POST", "/v1/license/activate", "x".repeat(70 * 1024))))[0], 400);
    fresh();
    const statuses = [];
    for (let i = 0; i < 21; i++) statuses.push((await activate(FP("a")))[0]);
    assert.equal(statuses.at(-1), 429);
  });
});
