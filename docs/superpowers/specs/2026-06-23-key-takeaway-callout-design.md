# Key Takeaway Callout — Design

## Purpose

Research detail pages currently show rating and price target buried in a
4-column metadata grid under the title. Add a visually distinct "Key
Takeaway" callout, right after the header, that surfaces rating, price
target, and a new punchy one-line summary so a skimming reader catches the
thesis without reading the full piece.

## Schema change

`src/content.config.ts`, `research` collection: add

```ts
takeaway: z.string().optional(),
```

Optional, so existing/future entries without one don't break the build.

## Header grid change

`src/pages/research/[slug].astro`: the metadata `<dl>` currently shows
Sector, Rating, Price Target, Date. Rating and Price Target move out of this
grid entirely — the callout becomes their single source of truth, avoiding
duplication. The `<dl>` keeps only **Sector** and **Date**.

## New component: `src/components/KeyTakeaway.astro`

Props: `rating?: string`, `priceTarget?: string`, `takeaway?: string`.

Renders nothing if all three props are absent (so an entry with no takeaway
data produces no empty box). Otherwise renders:

- A compact inline row showing `rating` and `priceTarget` (whichever are
  present), monospace, uppercase, accent-colored — same visual language as
  the existing header metadata labels (`font-mono text-xs uppercase
  tracking-wide`).
- The `takeaway` sentence below, in body text size, only rendered if present.

Styling: `border-l-2 border-accent` left border + `bg-accent/5` background
tint, using the existing `--color-accent` token — no new color tokens.
Padding: `px-5 py-4`, matching the spacing scale already used elsewhere on
the page.

## Page wiring

`src/pages/research/[slug].astro`: destructure `takeaway` from `entry.data`
alongside the existing fields. Render
`<KeyTakeaway rating={rating} priceTarget={priceTarget} takeaway={takeaway} />`
immediately after the closing `</header>` tag, before the `prose` content
div.

## Content update

`src/content/research/marvell.mdx` frontmatter: add

```yaml
takeaway: 'A macro discount masked a real AI infrastructure inflection. The thesis played out faster than modeled.'
```

## Files touched

- `src/content.config.ts` — schema field.
- `src/components/KeyTakeaway.astro` — new component.
- `src/pages/research/[slug].astro` — drop rating/priceTarget from `<dl>`,
  wire in `KeyTakeaway`.
- `src/content/research/marvell.mdx` — add `takeaway` frontmatter.

## Out of scope

- No changes to the `writing` collection schema.
- No changes to the research index/listing page.
- Rating/priceTarget remain plain optional strings (no enum/validation on
  rating values).

## Verification plan

- `npm run build` succeeds (validates the new schema field against
  marvell.mdx frontmatter).
- Visit `/research/marvell` on the preview server, confirm the callout
  renders with rating, price target, and takeaway, and the header `<dl>`
  shows only Sector and Date.
- Playwright check: no console errors on the research detail page.
