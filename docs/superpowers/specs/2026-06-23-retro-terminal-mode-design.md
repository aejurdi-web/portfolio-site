# Retro Terminal Mode — Design

## Purpose

A toggle, accessible from the site header, that switches the whole site into
a "retro terminal" visual mode: phosphor-green accent, monospace everywhere,
scanline overlay, glowing headings/accent text, square card/table corners,
and a blinking cursor after the name in the homepage hero.

## Why not React context

The site is a multi-page Astro app — full page loads on navigation. React is
scoped to the yield calculator islands only. A React context can't span page
loads, so it can't satisfy "persists across page navigation." Instead, retro
mode is implemented as a single `data-theme="terminal"` attribute on
`<html>`, driven by vanilla JS and CSS. CSS variable overrides scoped to
`html[data-theme="terminal"]` cascade into both static Astro markup and React
islands without needing every component to know about the toggle.

## Persistence

`sessionStorage` under key `terminal-mode` (`"1"` or absent). Cleared when
the browser tab/window closes; persists across in-session navigation since
every full page load re-applies it.

## Mechanism

1. **Layout.astro `<head>`**: a small inline, blocking `<script>` (runs
   before first paint) that reads `sessionStorage.getItem('terminal-mode')`
   and sets `document.documentElement.dataset.theme = 'terminal'` if present.
   This avoids a flash of the default theme on navigation when retro mode is
   active.
2. **SiteHeader.astro**: a small button (`[ ]_ TERMINAL`, monospace,
   `aria-pressed` reflecting state) that on click toggles
   `document.documentElement.dataset.theme`, writes/removes the
   `sessionStorage` key, and updates its own `aria-pressed`.

No shared module/context object is needed — the attribute on `<html>` *is*
the state, and CSS does the rest.

## CSS overrides (all scoped under `html[data-theme="terminal"]` in `global.css`)

- `--color-accent: #33ff66` — cascades into all existing `text-accent`,
  `bg-accent`, `border-accent` utility usages (header active nav, eyebrow
  labels, hero tag, links, wafer-map "Good" swatch, etc.) with no markup
  changes.
- `--font-display` and `--font-body` redefined to the existing
  `--font-mono` stack — cascades into `font-display`/`font-body` utility
  classes the same way, making all text effectively monospace.
- Scanline overlay: a fixed, full-viewport `body::after` pseudo-element with
  a `repeating-linear-gradient` (thin horizontal lines, ~4–6% opacity),
  `pointer-events: none`, high `z-index` so it sits above content without
  blocking clicks.
- Glow: `text-shadow: 0 0 6px currentColor` applied to `h1, h2, h3` and
  `.text-accent` elements.
- Square corners: `border-radius: 0` applied specifically to `.rounded-lg`
  (the homepage pillar-grid card) and `table` elements — *not* to
  `rounded-full` (pill badges, the circular wafer-map disc), since those are
  intentionally round shapes and squaring them would look broken rather than
  "retro."
- Blinking cursor: a `<span class="hero-cursor">_</span>` added after "Adam
  Jurdi" in `index.astro`'s hero `h1`. Hidden (`display: none`) by default;
  shown and blinking (`@keyframes` + `steps(1) infinite`) only under
  `[data-theme="terminal"]`. Under `prefers-reduced-motion: reduce`, the
  cursor is shown solid (no animation) instead of blinking — handled as an
  explicit override so it's correct independent of the site's existing
  blanket reduced-motion rule.

## Files touched

- `src/styles/global.css` — all override rules above.
- `src/layouts/Layout.astro` — blocking head script for flash-free state
  restore.
- `src/components/SiteHeader.astro` — toggle button + click handler script.
- `src/pages/index.astro` — add the hero cursor span.

## Out of scope

- No changes to React island internals (`YieldCalculator.tsx`,
  `WaferMap.tsx`, `YieldCurveChart.tsx`) — they inherit the theme purely via
  CSS variable cascade.
- No persistence beyond the current browser session (explicitly chosen over
  `localStorage`).
- No settings/preferences page; the only control surface is the header
  button.

## Verification plan

- `npm run build` succeeds.
- Playwright check on the preview server: toggle the button, confirm
  `data-theme` attribute flips, confirm no console errors in either state.
- Screenshot homepage in both normal and terminal mode.
