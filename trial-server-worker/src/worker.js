/**
 * worker.js — Cloudflare Worker entry point for the NetMax trial registry.
 *
 * Wiring only: request parsing, env bindings, and response shaping.
 * All policy lives in trial.js (pure, unit-tested); all storage behind the
 * store adapter in store.js.
 *
 * Bindings (wrangler.toml):
 *   TRIAL_DB                 D1 database (schema.sql)
 *   NETMAX_TRIAL_HMAC_SECRET secret — set via `wrangler secret put`
 *                                    (SAME value as the Swift client's
 *                                    embeddedHMACSecret; never in the repo)
 */

import { defaultConfig, handleActivate, handleStatus } from "./trial.js";
import { createD1Store } from "./store.js";
import {
  handleLicenseActivate,
  handleLicenseStatus,
  licenseConfig,
  licenseConfigError,
} from "./license.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Paid-tier routes. Extra bindings (wrangler.toml / `wrangler secret put`):
 *   LICENSE_ED25519_PRIVATE_KEY  secret — base64 PKCS8 (scripts/gen-license-key.mjs)
 *   GUMROAD_PRODUCT_ID           var — not secret
 * Missing either one fails these routes closed; trial routes are unaffected.
 */
async function licenseRoute(request, env, url) {
  if (licenseConfigError(env) || !env.TRIAL_DB) {
    return json(500, { ok: false, error: "server_misconfigured" });
  }
  const store = createD1Store(env.TRIAL_DB);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const config = licenseConfig();
  const privateKey = env.LICENSE_ED25519_PRIVATE_KEY;
  try {
    if (request.method === "POST" && url.pathname === "/v1/license/activate") {
      const text = await request.text();
      if (new TextEncoder().encode(text).length > config.maxBodyBytes) {
        return json(400, { ok: false, error: "malformed_request" });
      }
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        return json(400, { ok: false, error: "malformed_request" });
      }
      const r = await handleLicenseActivate({
        store,
        privateKey,
        productId: env.GUMROAD_PRODUCT_ID,
        body,
        ip,
        config,
      });
      return json(r.status, r.body);
    }
    if (request.method === "GET" && url.pathname === "/v1/license/status") {
      const r = await handleLicenseStatus({
        store,
        privateKey,
        fp: url.searchParams.get("fp"),
        ks: url.searchParams.get("ks"),
        token: url.searchParams.get("token"),
        ip,
        config,
      });
      return json(r.status, r.body);
    }
  } catch (e) {
    // Most likely a malformed LICENSE_ED25519_PRIVATE_KEY. Never log request bodies or keys.
    console.error("license_route_error", e && e.name);
    return json(500, { ok: false, error: "server_error" });
  }
  return json(404, { ok: false, error: "not_found" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/healthz") {
      return json(200, { ok: true });
    }

    if (url.pathname.startsWith("/v1/license/")) {
      return licenseRoute(request, env, url);
    }

    const secret = env.NETMAX_TRIAL_HMAC_SECRET;
    if (!secret) {
      // Fail closed, like the Python server refusing to start without one.
      return json(500, { ok: false, error: "server_misconfigured" });
    }
    if (!env.TRIAL_DB) {
      return json(500, { ok: false, error: "server_misconfigured" });
    }

    const store = createD1Store(env.TRIAL_DB);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const config = defaultConfig();

    if (request.method === "POST" && url.pathname === "/v1/trial/activate") {
      const text = await request.text();
      if (new TextEncoder().encode(text).length > config.maxBodyBytes) {
        return json(400, { ok: false, error: "malformed_request" });
      }
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        return json(400, { ok: false, error: "malformed_request" });
      }
      const r = await handleActivate({ store, secret, body, ip, config });
      return json(r.status, r.body);
    }

    if (request.method === "GET" && url.pathname === "/v1/trial/status") {
      const r = await handleStatus({
        store,
        secret,
        fp: url.searchParams.get("fp"),
        token: url.searchParams.get("token"),
        ip,
        config,
      });
      return json(r.status, r.body);
    }

    return json(404, { ok: false, error: "not_found" });
  },
};
