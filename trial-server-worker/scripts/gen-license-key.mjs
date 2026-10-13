#!/usr/bin/env node
// Generates the license signing keypair (Ed25519).
//   node scripts/gen-license-key.mjs --out /path/outside/the/repo/license.key
// Writes the PRIVATE key (base64 PKCS8, mode 0600) to --out and prints only the PUBLIC key
// (64 hex chars, the value the app embeds) to stdout. The private key never reaches stdout,
// the repo or a chat. Refuses a path inside the repo and refuses to overwrite a file.
import { generateKeyPairSync } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const i = process.argv.indexOf("--out");
const out = i > 0 && process.argv[i + 1] ? resolve(process.argv[i + 1]) : null;
if (!out) {
  console.error("usage: node scripts/gen-license-key.mjs --out <file outside the repo>");
  process.exit(2);
}
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
if (out.startsWith(repoRoot.endsWith(sep) ? repoRoot : repoRoot + sep)) {
  console.error(`refusing to write a private key inside the repo (${repoRoot})`);
  process.exit(2);
}

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
writeFileSync(out, privateKey.export({ type: "pkcs8", format: "der" }).toString("base64") + "\n", {
  mode: 0o600,
  flag: "wx",
});
const x = publicKey.export({ format: "jwk" }).x;
console.log(Buffer.from(x, "base64url").toString("hex"));
console.error(`private key written to ${out} (mode 0600). Upload it with wrangler, then delete the file.`);
