# Windows test-suite plan — NOT RUN (plan only)

**Status: the suite has not been run on Windows. Nothing below is a result.**
This is the exact procedure for MAX to run on the Windows 11 Pro VM
(VMware Fusion, build 26100). The agent cannot operate inside the Windows
guest; every step below is MAX's hands.

## What it covers

- Full Python suite: `python -m pytest -q` from the repo root
  (includes `test_engine_mirror_parity.py` and the new
  `export-evidence` one-line-error tests).
- Node MCP suites: `test_mcp_version_source.mjs`,
  `test_mcp_performance_limits.mjs`, `test_mcp_fleet_policy.mjs`,
  `test_mcp_resource_limits.mjs`.
- `python netmax.py audit --strict`.

## Step 0 — Mac: pack the working tree (5 min)

The Windows copy must match the Mac working tree, which is uncommitted and
10 commits ahead of `github/main` — do NOT `git clone` (that gets stale code).

```bash
cd /Users/user/netmax-app
zip -r /tmp/netmax-app-win.zip . \
  -x ".git/*" ".venv/*" "desktop/node_modules/*" \
  "**/__pycache__/*" "website-v3/node_modules/*" "website-v3/.next/*"
```

Get `/tmp/netmax-app-win.zip` into the VM: VMware shared folder
(VM → Settings → Sharing → add `/tmp`), or drag-and-drop
(VMware Tools is installed, so drag-and-drop works).

## Step 1 — Windows: tools (one time)

PowerShell:

```powershell
py --version      # need Python 3.10 or newer; if missing: winget install Python.Python.3.12
node --version   # need Node 18 or newer; if missing: winget install OpenJS.NodeJS.LTS
```

## Step 2 — Windows: unpack + venv + deps

PowerShell (venv active for everything after):

```powershell
Expand-Archive Z:\netmax-app-win.zip C:\netmax-app   # Z: = the shared folder
cd C:\netmax-app
py -m venv .venv-win
.venv-win\Scripts\Activate.ps1
pip install -r requirements-ci.txt
```

## Step 3 — Windows: run and capture (about 15 min)

PowerShell, venv active, from `C:\netmax-app`:

```powershell
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" | Tee-Object C:\netmax-app\win-env.log
py --version | Tee-Object -Append C:\netmax-app\win-env.log
node --version | Tee-Object -Append C:\netmax-app\win-env.log
python -m pytest -q 2>&1 | Tee-Object C:\netmax-app\pytest-win.log
cd desktop
npm ci 2>&1 | Tee-Object C:\netmax-app\npm-ci-win.log
node --test test_mcp_version_source.mjs test_mcp_performance_limits.mjs test_mcp_fleet_policy.mjs test_mcp_resource_limits.mjs 2>&1 | Tee-Object C:\netmax-app\node-win.log
cd ..
python netmax.py audit --strict 2>&1 | Tee-Object C:\netmax-app\audit-win.log
```

## Step 4 — bring the logs back

Copy these five files back to the Mac via the shared folder:

- `win-env.log`, `pytest-win.log`, `npm-ci-win.log`, `node-win.log`, `audit-win.log`

Drop them in `/Users/user/netmax-app/docs/reviews/` (or paste the tail of
each). The agent records the result in HANDOFF and flips the Windows wording
only if the full suite actually passes.

## Notes

- Some tests are POSIX-only and should skip on Windows; a skip is not a failure.
- The suite makes real loopback/local calls only; the only network use is the
  perf test's diagnostics (same as Mac).
- If `pytest` fails to collect with an import error, the zip likely missed a
  file — re-zip from Step 0 and compare file counts.
