# hikari-site

The HikariSub homepage and user guides, at https://hikarisub.altqx.com.

HikariSub is a subtitle editor for ASS/SSA and other formats: https://github.com/altqx/hikari.

## Licences

- Site code: MIT (`LICENSE`).
- Guide text and site-made images: CC BY 4.0 (`LICENSE-content.txt`).
- Third-party media keeps its own licence and is credited where it appears (see `docs/decisions.md`, Media).

## Development

Needs [bun](https://bun.sh) 1.4.

```sh
bun install
bun run dev                     # http://localhost:3000
bun run build                   # static site in .output/public; drafts left out
VITE_SHOW_DRAFTS=1 bun run build  # with drafts, as PR previews are built
bun run preview                 # serve the build the way Cloudflare does
bun run check-links
bun run test:e2e                # Playwright smoke, against the build
```

Guides are MDX in `content/docs/`. A page with `draft: true` in its frontmatter appears only in PR previews.

## Deploys

- Each PR gets a preview at `pr-<number>-hikari-site.<subdomain>.workers.dev`, built with drafts.
- `main` deploys to https://hikarisub.altqx.com only while the repo variable `PRODUCTION_DEPLOY` is `true`.
- Secret: `CLOUDFLARE_API_TOKEN`. Variables: `CLOUDFLARE_ACCOUNT_ID` (a secret of that name works too), `PRODUCTION_DEPLOY`, `CF_WEB_ANALYTICS_TOKEN` (Cloudflare Web Analytics beacon, production only).
