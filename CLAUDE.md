# Portfolio Site

## Purpose

This site demonstrates finance + semiconductor technical expertise for equity
research / investment banking recruiting. It is a **credibility artifact**,
not a traffic play — optimize for "would a PM or MD reading this be
impressed," not pageviews, SEO, or growth mechanics.

## Three Pillars

1. **Research** — written equity theses. Flagship piece: Marvell (MRVL)
   writeup.
2. **Yield/Chiplet Economics Calculator** — interactive tool with a visual
   wafer map, modeling die yield and chiplet economics.
3. **Writing** — explainers that translate semiconductor technology into
   investment relevance (process nodes, packaging, yield curves, etc.).

## Tech Stack

- **Astro** + **Tailwind CSS** for the site shell and content pages.
- **React island** (via Astro's island architecture) scoped to the yield
  calculator only — don't reach for React elsewhere; static Astro components
  are the default.

## Design Direction

"Bloomberg meets personal site": clean, confident, technical. Dense
information presented calmly — tables, monospace figures, restrained color,
sharp typography. Avoid flashy-startup visual language (gradients-as-hero,
big animated landing sections, SaaS-marketing tone). When in doubt, use the
`frontend-design` skill for aesthetic decisions and lean toward
under-designed and credible over over-designed and trendy.

## Build Phases

- **Phase 0** — Scaffold + deploy pipeline. Get Astro project building and
  auto-deploying (e.g. Vercel/Netlify/Cloudflare Pages) from a live URL.
- **Phase 1** — Home / About / Marvell writeup. This is the resume-ready
  milestone — the site must be link-worthy on a resume at the end of this
  phase.
- **Phase 2** — Yield/Chiplet Economics Calculator (React island + wafer
  map).
- **Phase 3** — Additional research pieces + a research/coverage tracker.
- **Phase 4** — Polish (performance, accessibility, design refinement).

## Hard Rules

1. **Finance-forward, always.** Every piece of technical/semiconductor
   content must serve an investment insight. Technical depth is in service
   of the thesis, not a substitute for one. If a section reads as "cool tech
   explainer" with no clear line back to an investment takeaway, it's
   incomplete — rewrite or cut it.
2. **No real content before the deploy pipeline is live.** Do not write
   actual home/about/research copy until Phase 0's deploy pipeline has been
   confirmed live at a real URL. Scaffolding, placeholder content, and config
   work are fine before then; finished prose is not.
