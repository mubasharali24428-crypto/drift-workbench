# Deploying to Cloudflare Pages

Static export. Nothing runs on a server.

## Project settings

These apply only to a Pages project connected to Git. The Phase 7 plan uses Direct Upload instead (see "Direct Upload previews" below).

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `pnpm build` |
| Build output directory | `out` |
| Root directory | `website-v3` (if the repo root is `netmax-app`) |

## Environment variables

| Name | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_SITE_URL` | the final origin, no trailing slash, e.g. `https://drift.example` |

`NEXT_PUBLIC_SITE_URL` feeds the canonical link, Open Graph URLs, sitemap, robots and JSON-LD.
Until it is set they use the placeholder `https://drift-workbench.pages.dev`, which is not a project anyone has claimed.
It is read at BUILD time, so it must be set before `pnpm build`. Dashboard variables are used by Git builds; with Direct
Upload the build runs on your machine, so pass it in the build command: `NEXT_PUBLIC_SITE_URL=https://<origin> pnpm build`.
Do not set it to an empty string (the build throws) or add a trailing slash.

## Shipped from `public/`

- `_headers`: security headers on every route, one-year immutable caching for `/_next/static/*`.
- `og.png`: 1200x630 social preview, a screenshot of the hero. Regenerate if the hero changes.

## Before the first deploy

1. `npm view @drift-workbench/mcp-server version` still returns the version in `lib/site.ts`.
2. `git -C /Users/user/netmax-app remote get-url github` still matches `repoUrl` in `lib/site.ts` (the remote ends in `.git`, the constant does not).
3. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm check:prohibited`. Needs ripgrep installed: without it `check:prohibited` passes silently.
4. Build with the origin set: `NEXT_PUBLIC_SITE_URL=https://<origin> pnpm build`. Then `grep -rF drift-workbench.pages.dev out/` must print nothing.

## Direct Upload previews (Phase 7)

`mubasharbuilds.pages.dev` serves the old site and is production. Do not deploy this build to it.

- Deploy only to a separate preview project, always with an explicit `--project-name` and `--branch`. Never rely on git branch inference: on the production branch, or outside a git repo, an omitted `--branch` is a production deploy.
- Run wrangler from an empty directory that is not a git checkout, with no `functions/`, `_routes.json`, `.env*` or `wrangler.*` in it or above it.
- Build first, then log in. The preview build, the scans and every `pnpm` command run with no Cloudflare credentials present.
- Preview copy only: add `X-Robots-Tag: noindex, nofollow` to `_headers`, use a `Disallow: /` robots.txt, drop `sitemap.xml`, add a noindex meta to `index.html`. Never promote that copy to production.
- Before and after every Cloudflare write, snapshot production over HTTP and compare status, body hash and cache headers. Any difference stops the work.
- Never `git push` for this purpose: it is unknown whether the production project is linked to the GitHub repo.
- The full procedure is in `HANDOFF.md`, section 10.

## Known gaps

- No Content-Security-Policy. Next's static export uses inline scripts, so a strict policy needs hashes.
- Gumroad listing is still titled "NetMax Desktop Pro". Fix it in the Gumroad dashboard.
- `/drift/docs/` from the v2 site does not exist here; the nav has no Docs link. A production deploy of this build over `mubasharbuilds.pages.dev` would also remove `/drift/`, `/assets/site.js` and `/assets/style.css`, and would replace the old single-page-app fallback (any unknown URL returns the old homepage with 200) with real 404s. The source of the live site exists only inside Cloudflare, so keep production untouched until the docs decision is made and a copy is archived.
