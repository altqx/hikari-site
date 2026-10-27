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
bun run test                    # unit tests
bun run test:e2e                # Playwright smoke, against the build
```

The download links come from hikari's newest releases and their `hikarisub-update.json`, read at build time into `src/generated/downloads.json` (`bun run downloads`; `bun run dev` works offline).

Guides are MDX in `content/docs/`. A page with `draft: true` in its frontmatter appears only in PR previews.

`<AssPreview line="..." />` renders an ASS line live with AkariSub over a *Sprite Fright* frame. With reduced motion or without WebAssembly it shows a static image from `public/previews/still/` instead. After adding or changing a preview, run `bun run stills` (it builds with drafts, renders each preview in headless Chromium and writes the images) and commit them. `check-links` fails while a still is missing.

## Deploys

- Each PR gets a preview at `pr-<number>-hikari-site.<subdomain>.workers.dev`, built with drafts.
- `main` deploys to https://hikarisub.altqx.com only while the repo variable `PRODUCTION_DEPLOY` is `true`. It also rebuilds on a hikari release (`repository_dispatch` event `hikari-release`) and daily.
- Secret: `CLOUDFLARE_API_TOKEN`. Variables: `CLOUDFLARE_ACCOUNT_ID` (a secret of that name works too), `PRODUCTION_DEPLOY`, `CF_WEB_ANALYTICS_TOKEN` (Cloudflare Web Analytics beacon, production only).
