# AGENTS.md

Instructions for AI coding agents (Claude, Copilot, Cursor, Codex, etc.)
working in this repository. This is a personal LittleLink fork for
`me.shadowdewuff.gay` — a single-page link-in-bio site plus a couple of
utility pages, deployed to Vercel from `main`.

## Repo layout

- `index.html` — the main page. All link buttons live in the
  `<nav class="button-stack">` block.
- `privacy.html`, `.debug/index.html` — secondary pages. Any site-wide
  change (analytics, footer, meta tags) needs to be applied to all three.
- `css/style.css` — layout, typography, theming (light/dark/auto),
  shared `.cluster` footer style.
- `css/brands.css` — button color rules for brands LittleLink ships with
  upstream.
- `css/brands-extended.css` — button color rules added in this fork
  (niche/personal brands not in upstream LittleLink). **Add new buttons
  here, not to `brands.css`**, unless you're patching a class that
  already exists in `brands.css`.
- `images/icons/` — square (usually 24×24) SVG icons for buttons.
  Sorted into category subfolders by platform type: `social`, `gaming`,
  `music`, `video`, `creative`, `writing`, `dev`, `shopping`, `finance`,
  `productivity`, `professional`, `generic` (the non-brand
  `generic-*.svg` fallback icons), and `other` (anything that didn't
  cleanly fit). A button's `<img src>` therefore looks like
  `images/icons/gaming/steam.svg`, not `images/icons/steam.svg`.
- `images/icons-extended/` — icons for brands added in this fork,
  mirroring `brands-extended.css`. Sorted into the same category
  subfolders, independently of `images/icons/` — the two trees are kept
  separate (not merged into one categorized tree) specifically because
  several brands have same-named icon files in both directories
  (`vrchat.svg`, `behance.svg`, etc.); merging them would collide.
  Which of the two top-level directories a new icon goes in should
  match wherever its button's CSS rule lives (`brands.css` →
  `images/icons/`, `brands-extended.css` → `images/icons-extended/`),
  then sort into a category subfolder within that.
- When adding a new category is a genuine judgment call (an icon
  doesn't obviously fit an existing one), it's fine to add one — just
  keep the same lowercase, one-word style as the existing folders.
- `api/` — Vercel Functions. Currently just `api/debug.js`, which backs
  `.debug/index.html` and the `cluster:` footer label. See "Vercel
  Functions" below before touching this.
- `vercel.json` — rewrites and (formerly) region pinning. Keep `api/`
  listed in `.assetsignore` and `.dockerignore` if you add more
  functions — those files exist so non-Vercel deploys don't serve
  function source as static files.

## Adding a link button

This is the most common task in this repo. Steps, in order:

1. **Get the brand's color and icon.** If a Brandfetch MCP connector is
   available, use `get_brand` (or `brand_search` first if you don't
   know the domain) — it returns `colors` (primary/dark/light/accent)
   and `logos` (typed `logo`/`symbol`/`icon`/`other`). Prefer `icon` or
   `symbol` for the square button slot; a wordmark `logo` gets
   squeezed illegibly into a 24×24 square (see "Wordmark logos" below).
   If Brandfetch has no claimed listing or no logo assets (check
   `qualityScore` and whether `logos`/`images` are empty — an
   unclaimed brand can return fallback placeholder colors that are
   **not real brand colors**, don't trust colors from an empty listing),
   say so plainly rather than presenting a guess as fact, and either
   ask the user for the asset or pick a neutral scheme and say you did.
2. **Get the icon into the repo as a 24×24 (or square) SVG,** matching
   the style of existing icons (`fill="#fff"` or similar single-color
   fill, `viewBox="0 0 24 24"`). If Brandfetch only has a raster
   (PNG/JPEG) or a non-square asset:
   - Vector-trace a raster with `potrace` (crop/pad to a square first
     with Pillow, invert if the source is white-on-transparent, trace,
     then wrap the resulting path in a `viewBox="0 0 24 24"` `<svg>`
     with a scale/translate transform — see git history for
     `tracker-network.svg` and `medal-tv.svg` for worked examples).
   - For an already-square SVG (a `symbol`), use it directly.
   - Render a PNG preview (`cairosvg` or similar) and actually look at
     it before committing — don't assume the trace/crop came out right.
3. **Add the CSS rule** to `css/brands-extended.css`, alphabetically by
   brand name, following the existing pattern:
   ```css
   /* Brand Name */
   .button-brand-name {
   	--button-text:#ffffff;
   	--button-background:#000000;
   	--button-border:1px solid #ffffff;
   }
   ```
   A near-black or near-white background usually needs the accent
   border to stay visible against this site's dark theme
   (`#121212` background) — check both themes, not just one.
4. **Add the button** to `index.html`'s `<nav class="button-stack">`,
   with an HTML comment naming the brand above it:
   ```html
   <!-- Brand Name -->
   <a class="button button-brand-name" href="..." target="_blank" rel="noopener"><img class="icon" aria-hidden="true" src="images/icons/<category>/brand-name.svg" alt="Brand Name Logo">Brand Name</a>
   ```
   If asked to add a button with no real profile URL yet, use an
   obviously-placeholder link (e.g. `https://service.com/profile/example`)
   and say plainly that it's a placeholder needing a swap — don't
   invent a URL that looks real.
5. **Verify before calling it done.** Render `index.html` in a headless
   browser (Playwright/Chromium is usually available) under both
   `prefers-color-scheme: light` and `dark`, screenshot the button
   stack, and actually look at the image — check the new button's
   height/contrast against its neighbors. Don't just eyeball the SVG
   markup and assume it's fine.

### Wordmark logos in the icon slot

The button's icon slot is a small square (`.icon { width:1.25rem;
height:1.25rem; ... }` in `css/style.css`). A wide wordmark logo
(anything much wider than tall) will be squeezed to a few pixels tall
and become illegible there. Two options, both fine — pick based on
what the logo actually looks like once tried, not by rule:
- Use it anyway at reduced size, and say plainly that it reads small.
- Use the full logo at a larger size and drop the button's text label
  (the logo already names the brand), with a `.button-<name> .icon`
  override in `brands-extended.css` sizing it by height, e.g.:
  ```css
  .button-tiktok .icon {
  	width:auto;
  	height:1.5rem;
  	margin-right:0;
  }
  ```
  Check the resulting button height against its neighbors — it should
  stay close (a few px off is fine; more than that looks broken).

## Vercel Functions — hard-won lessons

This project deploys to Vercel from `main` (a plain "Other"/no-framework
project, Node 24.x, git-connected — merging to `main` **is** the
production deploy, immediately, no separate deploy step). If you're
adding or changing anything under `api/`:

- **Don't assume `export const config = { runtime: 'edge' }` on a bare
  `export default function handler(request) {...}` gets you the Edge
  Runtime.** In this project it silently did not — Vercel's build log
  showed `Compiling "debug.js" from ESM to CommonJS...`, which is the
  **Node.js Function** builder's message, and the function ran in one
  fixed region exactly as if the config export weren't there at all.
  No error, no warning that edge was skipped — it just quietly wasn't
  edge. **Always check the actual build log after deploying** (or ask
  the user to) rather than trusting the exported config was honored.
- The framework-agnostic pattern Vercel's own docs currently show for a
  no-framework project is `export default { fetch(request) { ... } }`
  — not a bare default-exported function. This is plausibly why the
  above didn't take effect, though it wasn't independently confirmed
  before this note was written — verify against the build log.
- Detect which runtime you're actually in with `typeof EdgeRuntime ===
  'string'` (a documented Vercel global) rather than assuming. Make any
  user-facing "what runtime is this" text report the detected reality,
  not the intended config.
- For region reporting, use `process.env.VERCEL_REGION` directly — it's
  documented plainly as "the region where the application is currently
  running," no Node/Edge caveat. Don't parse `x-vercel-id` to guess the
  region; its format isn't a stable documented contract, and a naive
  guess at its structure produced literal garbage (`"iad1:iad1"`) in
  production. If you need per-request infra visibility beyond the
  region, display `x-vercel-id` verbatim rather than parsing it.
- A Node.js Function or an Edge Function *not explicitly deployed to
  multiple regions* runs in **one fixed region for every visitor**,
  regardless of where they are. Vercel's edge network (CDN) still
  terminates the connection near the visitor and proxies to that fixed
  region — so static assets are always served near the visitor, but a
  single-region function is not, whatever runtime family it's in. Only
  a function actually confirmed to run at the edge (build log evidence,
  not just the source file's intent) answers from the visitor's nearest
  location.
- Test the actual handler logic locally before deploying: Node 18+ has
  the same global `Request`/`Response`/`Headers` the Vercel runtimes
  use, so you can `import()` the module directly and call it with a
  real `Request` — no framework or emulator needed. Cover the on-Vercel
  and off-Vercel cases, and don't forget `process.env.KEY = undefined`
  sets the **string** `"undefined"` in Node, not an absent key — use
  `delete process.env.KEY` in test setup/teardown.
- Treat "the build succeeded" and "the deployment is READY" as
  necessary, not sufficient. Fetch the actual live endpoint (or ask the
  user to) and read the actual response before declaring a change done.

## Session-environment limits worth knowing up front

- A path like `C:\Users\...\GitHub\littlelink\...` given by the user is
  on **their** machine, not reachable from an isolated agent session.
  Ask them to attach/upload the file rather than trying to read it, and
  say plainly that the path isn't accessible rather than guessing at
  its contents.
- Outbound HTTPS to some hosts (e.g. `*.vercel.app`, custom domains
  fronted by Vercel, various CDNs) may be blocked by an agent
  environment's egress policy even when an MCP tool for that service is
  connected. Prefer the MCP tool's own fetch/proxy capability
  (e.g. a `web_fetch_vercel_url`-style tool) over raw `curl` when a
  direct request fails with a proxy/tunnel error.

## Git / PR conventions this fork has been using

- Work happens on a feature branch, not directly on `main`.
- If a branch's PR has already merged and there's new work for the same
  logical feature, restart the branch from current `main`
  (`git fetch origin main && git checkout -B <branch> origin/main`,
  cherry-pick or redo the new commits) rather than stacking new commits
  on merged history — a merged PR is finished and can't be reopened
  usefully.
- Because merging to `main` deploys to production immediately, treat
  "merge this PR" and "deploy this" as the same action, and treat a
  runtime/behavioral change (not a copy or color tweak) as worth
  confirming with the user before merging, especially after a prior
  change in the same area turned out to be wrong.
