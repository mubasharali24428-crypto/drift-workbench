// Version single source: the MCP server must report the version from
// desktop/package.json everywhere it prints or advertises one. A version bump
// touches package.json only; these tests fail if the server hardcodes a
// version that diverges from package.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, "netmax-mcp-server.mjs");
const PKG_VERSION = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8")).version;

assert.match(PKG_VERSION, /^\d+\.\d+\.\d+$/, "package.json version must be semver");

function spawnServer() {
  const env = { ...process.env };
  delete env.NETMAX_NO_START; // never inherit a no-start flag into the child
  return spawn(process.execPath, [SERVER], { env, stdio: ["pipe", "pipe", "pipe"] });
}

// Sends MCP initialize; resolves with { serverInfo, banner } once the
// initialize result arrives. The banner is captured from stderr.
function initializeRoundTrip(child) {
  return new Promise((resolve, reject) => {
    let out = "";
    let banner = "";
    const timer = setTimeout(() => reject(new Error("initialize timed out after 15 s")), 15000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (d) => { banner += d; });
    child.stdout.on("data", (d) => {
      out += d;
      for (const line of out.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("{")) continue;
        let msg;
        try { msg = JSON.parse(t); } catch { continue; }
        if (msg.id === 1 && msg.result && msg.result.serverInfo) {
          clearTimeout(timer);
          resolve({ serverInfo: msg.result.serverInfo, banner });
          return;
        }
      }
    });
    child.on("error", reject);
    child.stdin.write(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "version-test", version: "0.0.0" },
      },
    }) + "\n");
  });
}

test("MCP serverInfo.version matches desktop/package.json", async () => {
  const child = spawnServer();
  try {
    const { serverInfo } = await initializeRoundTrip(child);
    assert.equal(serverInfo.version, PKG_VERSION,
      `serverInfo.version=${serverInfo.version} diverges from package.json=${PKG_VERSION}`);
  } finally {
    child.kill();
  }
});

test("stdio banner prints the package.json version", async () => {
  const child = spawnServer();
  try {
    const { banner } = await initializeRoundTrip(child);
    assert.ok(banner.includes(`Drift Workbench MCP server v${PKG_VERSION} (stdio)`),
      `banner missing v${PKG_VERSION}; first 200 chars: ${banner.slice(0, 200)}`);
  } finally {
    child.kill();
  }
});

test("no hardcoded copy of the package version in the server source", () => {
  const src = readFileSync(SERVER, "utf8");
  assert.ok(!src.includes(`"${PKG_VERSION}"`) && !src.includes(`v${PKG_VERSION}`),
    `server source hardcodes version ${PKG_VERSION}; it must come from package.json`);
});
