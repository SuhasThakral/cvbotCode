# Portfolio site (branch `portfolio`)

Suhas Thakral's personal portfolio. Live: https://suhas-portfolio-pi.vercel.app
This branch holds only the portfolio. The AI CV bot itself lives on the default branch.

## Where things are
- `portfolio/` is the whole site (static, no build step). Vercel project `suhas-portfolio` serves this folder.
- `portfolio/index.html`: all views in one page: `intro`, `projects`, `approach` (How I work), `content`, `ai-cv`. Views switch by hash (`#approach`), only one `.view.on` at a time.
- `portfolio/js/app.js`: own scroll engine (`tick`, `track()`, `data-rise` reveals), view switching (`show()`), menu, calculator (`setupCalc`), opening reel (`playReel`, once per visit plus the Replay intro button), AI CV chat.
- `portfolio/js/stage.js` + `vendor/three`: the 3D particle "journey" on the intro.
- `portfolio/js/motion.js` (on `portfolio-motion` until shipped): Lenis smooth scroll only, loaded with a dynamic import so a failure can't break the page.
- `portfolio/css/site.css`: one stylesheet. Palette: bg #f2e2da, ink #383519, accent `--gold` #e0428e. Display font Anton (self-hosted).
- `portfolio/vercel.json`: strict CSP. No inline `<style>`/`style=""`/`<script>`, no CDNs: everything self-hosted. Setting styles through JS (`el.style.x`) is fine.

## Deploys
- Push to `portfolio` = production. Any other branch gets a Vercel preview (SSO-protected).
- Rollback: Vercel → suhas-portfolio → Deployments → Instant Rollback.

## Decisions (Nov 2026)
- Tried GSAP scenes + liquid-glass cards on How I work: rolled back, not worth it.
- Scroll feel: native felt too fast, Lenis lerp 0.11 too slow. Settled on Lenis `lerp: 0.2, wheelMultiplier: 1.1`.
- Replay intro button in the hero (`#reelReplay`).
- Status: replay button + tuned scroll are on `portfolio-motion` (preview), not live until the user says "ship it".
- liquid-glass-js injects a `<style>` tag, which breaks under this CSP. React Bits needs React (this site is vanilla).

## Working here
- Check locally with the CSP header on: serve `portfolio/` with a tiny server that adds the CSP from `vercel.json`, then screenshot with Playwright.
- Keep changes small and reversible. Ask before pushing to `portfolio`.
- The owner prefers Claude's own design judgement over outside "design" skills, and doesn't care about animation libraries for their own sake.
