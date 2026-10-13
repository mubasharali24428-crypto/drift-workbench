// The six path/reachability tools: registered with schemas, and every unsafe
// host or URL is rejected at the schema layer before an engine process spawns.
// No test here touches the network: network_context only reads local interfaces.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, "netmax-mcp-server.mjs");
const NEW_TOOLS = ["path_trace", "http_timing", "captive_portal_check", "ipv6_check", "mtu_probe", "network_context"];

function startServer() {
  const env = { ...process.env };
  delete env.NETMAX_NO_START;
  const child = spawn(process.execPath, [SERVER], { env, stdio: ["pipe", "pipe", "pipe"] });
  let buf = "";
  const waiting = new Map();
  let nextId = 0;
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      try {
        const msg = JSON.parse(line);
        if (msg.id != null && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
      } catch { /* banner or partial line */ }
    }
  });
  const rpc = (method, params) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 20000);
    waiting.set(id, (m) => { clearTimeout(timer); resolve(m); });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
  return { child, rpc };
}

async function withServer(fn) {
  const { child, rpc } = startServer();
  try {
    await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "probe-test", version: "0" } });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    await fn(rpc);
  } finally {
    child.kill();
  }
}

const call = (rpc, name, args) => rpc("tools/call", { name, arguments: args });

// The SDK reports schema violations either as a JSON-RPC error or as an
// isError result carrying "MCP error -32602"; both mean the engine never ran.
const rejected = (res) =>
  res.error?.code === -32602 ||
  (res.result?.isError === true && /-32602|Input validation/.test(res.result.content?.[0]?.text ?? ""));

test("the six probe tools are registered with descriptions and schemas", async () => {
  await withServer(async (rpc) => {
    const { result } = await rpc("tools/list", {});
    const byName = new Map(result.tools.map((t) => [t.name, t]));
    for (const name of NEW_TOOLS) {
      const tool = byName.get(name);
      assert.ok(tool, `${name} missing from tools/list`);
      assert.ok(tool.description && tool.inputSchema, `${name} lacks a description or schema`);
    }
  });
});

test("hosts that could be read as flags or carry shell characters are rejected by the schema", async () => {
  await withServer(async (rpc) => {
    for (const [name, args] of [
      ["path_trace", { host: "-oProxyCommand=x" }],
      ["path_trace", { host: "bad host" }],
      ["path_trace", { host: "a;b" }],
      ["path_trace", { host: "1.1.1.1", max_hops: 31 }],
      ["mtu_probe", { host: "-c" }],
      ["mtu_probe", { host: "x".repeat(300) }],
    ]) {
      const res = await call(rpc, name, args);
      assert.ok(rejected(res), `${name} ${JSON.stringify(args).slice(0, 60)} was not rejected`);
    }
  });
});

test("only plain http(s) URLs and 1-5 samples reach http_timing", async () => {
  await withServer(async (rpc) => {
    for (const args of [
      { url: "file:///etc/passwd" },
      { url: "ftp://example.com/" },
      { url: "https://exa mple.com/" },
      { url: "https://example.com/", count: 6 },
      { url: "https://example.com/", count: 0 },
      { url: "https://example.com/" + "x".repeat(2100) },
    ]) {
      const res = await call(rpc, "http_timing", args);
      assert.ok(rejected(res), `${JSON.stringify(args).slice(0, 60)} was not rejected`);
    }
  });
});

test("network_context answers from local state with a STATUS: OK result", async () => {
  await withServer(async (rpc) => {
    const res = await call(rpc, "network_context", {});
    assert.ok(!res.error && !res.result.isError, JSON.stringify(res).slice(0, 200));
    const text = res.result.content[0].text;
    assert.match(text, /^STATUS: OK\nonline: (True|False)\nvpn: (True|False)$/);
  });
});
