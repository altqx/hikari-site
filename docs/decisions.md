# Site decisions

The owner (altqx) settled these in a grilling session on 2026-10-27. Change them only with the owner's say-so.

## Stack and hosting

- TanStack Start + Fumadocs (fumadocs-mdx, fumadocs-ui) + bun. MDX is compiled at build time and pages are pre-rendered.
- Cloudflare Workers with static assets, at **hikarisub.altqx.com** (custom domain on the altqx.com zone).
- GitHub Actions deploys on every push to `main`, and each PR gets a preview URL. The deploy uses the repo secrets `CLOUDFLARE_API_TOKEN` (Workers edit plus this zone's routes and DNS) and `CLOUDFLARE_ACCOUNT_ID`. The coordinator asks the owner for them through a secret prompt; they are never pasted in chat or committed.

## Examples in MDX

- Interactive TSX components inside MDX demonstrate features.
- Live ASS previews render with **AkariSub** (libass in WASM, the same engine family as the app), pinned to a published version.
  - They load when scrolled into view, run single-threaded (no cross-origin isolation needed), and pause off screen.
  - With reduced motion, or when WASM fails, a static image shows instead.
  - Each preview shows the editable ASS line beside the result, with a "Copy line" button.
- Live previews use only OFL fonts (e.g. K2D) over frames from *Sprite Fright* (Blender Studio, 2021, CC BY 4.0), credited under each preview and on a Credits page, with a gradient while the frame loads.
- Automation guides use Lua and MoonScript code blocks; those are the app's scripting languages.

## Content

- Covers HikariSub 0.1.x only. HikariSub legacy (0.0.x) gets one page, "Moving from legacy" (opt-in offer, settings import, going back).
- English only at launch, with Fumadocs i18n in place from the start (`/en/...`, language switcher hidden until a second language exists). Thai comes next.
- One set of guides for the newest release. Features added after 0.1.0 get a "Since 0.1.x" badge; beta-only features get a Beta badge. No per-version docs until 1.0.
- Sidebar:
  1. Get started: install (Windows, Linux formats, AUR), the Getting started window, moving from legacy, a tour of the window.
  2. Basics: files and formats, Grid, Line editor, styles and the Style manager, video, audio, timing.
  3. Typesetting: each visual tool, the shapes and tags editors, perspective, fonts and font catalogs.
  4. Karaoke: split and join, tap to time, Kanji timer, furigana, onset snap, karaoke check, templater and the template editor, presets.
  5. Translation: translation mode and line matching.
  6. Checking: spelling, grammar, fix minor errors, subtitle comparison.
  7. Automation: running scripts, the Automation panel, DependencyControl, the user folder, writing scripts (Lua/MoonScript API).
  8. Customize: layouts and presets, themes, hotkeys, settings.
  9. Reference: ASS override tags (each with a live preview), hotkeys, settings, command line.
  10. Help: troubleshooting, FAQ, reporting bugs.
- Hotkeys and settings reference pages are generated from the app's `--export-docs` JSON (altqx/hikari#367, DX1), attached to each release as `hikarisub-docs-<version>.zip`. Until it exists those pages say "coming with 0.1.0-beta.1".
- Write the stable pages first (install, first run, moving from legacy, automation and the user folder). Feature guides are written as each wave-6 card merges into hikari's `main` branch (named `qt` until 2026-10-29); the coordinator says when.

## Homepage

- An app screenshot (light or dark to match the site theme), a Download button that detects the visitor's OS with links for every format (setup.exe, portable zip, AppImage, deb, rpm, tar.gz, AUR), 6–8 feature tiles linking to guides (with a small live preview where it fits), and a "Moving from legacy" strip.
- Understated copy, no sales-pitch tone. HikariSub's accent green (#145C4C light, #9CDBC9 dark); follows the system theme.
- Download links come from the app's update manifest `hikarisub-update.json` at build time (assets, checksums, stable vs beta). A hikari release triggers a rebuild through `repository_dispatch` (event `hikari-release`); a daily cron is the backup.

## Media

- **Example subtitle:** "[Jibrill] Chou Kaguya-hime! - ray MV v2" (owner's local file). It appears **only in app screenshots and muted clips**, credited "Subtitles: Jibrill". The MKV, the full `.ass` and its fonts are never published. Of its fonts only K2D is OFL; Commie Sans (Linotype Finnegan), MN Chaeo Hon, the FC fonts, Arial and Leelawadee are not redistributable.
- **Screenshots:** reuse the non-mockup `evidence/*` branches of altqx/hikari (since wave 6 closed, tags of the same name, with the files in `archive/wave6`) and the shots in card evidence comments. Mockup branches are never used. Check each against current hikari `main`; recapture changed surfaces from a `main` build under the private X server (`/home/altq/Work/hikari-wt/bin/vx11`), never on the owner's desktop. Stored as WebP beside the guide, light and dark pairs, with `screenshots.json` recording each image's source branch and commit or "recaptured at main <sha>" (entries before the rename say "at qt <sha>"; the SHAs are the same).
- **Clips:** loops of 10 s or less, muted, AV1 MP4 with an H.264 fallback, each under 5 MB, served from static assets; autoplay in view, paused with reduced motion; captured under vx11.

## Site features

- Fumadocs static search (Orama), built at build time.
- Cloudflare Web Analytics (no cookies, no banner). No comments. Each page has "Edit this page on GitHub" and "Report a problem" (altqx/hikari issues).
- **Link check:** a build fails when an internal link or a User guide (F1) target names a page that doesn't exist. An F1 target whose page is still a draft is only listed, since drafts are left out of production builds; it doesn't fail the build.

## Process

- Work is tracked as issues in this repo. PRs need CI (build, typecheck, link check, Playwright smoke) and a clean Codex review (`@codex review`), with an inline reply to every Codex inline comment. The coordinator merges.
- **Design gate:** the homepage and the Visual tools guide page start as HTML mockups in light and dark, posted on their issue. Nothing goes to the production domain before the owner approves them; PR previews may go up earlier.
- Never add Claude or Co-Authored-By attribution lines to commits or PRs.
