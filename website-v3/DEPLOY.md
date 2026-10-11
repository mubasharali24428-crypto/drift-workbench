# Deploying to Cloudflare Pages

Static export. Nothing runs on a server.

## Project settings

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
Until it is set they use the placeholder `https://drift-workbench.pages.dev`.

## Shipped from `public/`

- `_headers`: security headers on every route, one-year immutable caching for `/_next/static/*`.
- `og.png`: 1200x630 social preview, a screenshot of the hero. Regenerate if the hero changes.

## Before the first deploy

1. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm check:prohibited && pnpm build`
2. `npm view @drift-workbench/mcp-server version` still returns the version in `lib/site.ts`.
3. `git -C /Users/user/netmax-app remote get-url github` still matches `repoUrl` in `lib/site.ts`.
4. Set `NEXT_PUBLIC_SITE_URL`.

## Known gaps

- No Content-Security-Policy. Next's static export uses inline scripts, so a strict policy needs hashes.
- Gumroad listing is still titled "NetMax Desktop Pro". Fix it in the Gumroad dashboard.
- `/drift/docs/` from the v2 site does not exist here; the nav has no Docs link.
