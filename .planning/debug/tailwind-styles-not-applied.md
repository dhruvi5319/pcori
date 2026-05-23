---
status: diagnosed
trigger: "Tailwind CSS Styling Not Applied — UAT Phase 1 Tests 3 & 4 failing"
created: 2026-05-21T00:00:00Z
updated: 2026-05-21T00:10:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED — Unlayered `* { margin: 0; padding: 0 }` in globals.css overrides ALL Tailwind @layer utility spacing classes
test: Inspected compiled CSS at /_next/static/chunks/_02d02n3._.css, confirmed unlayered rules appear after @layer utilities and override spacing utilities
expecting: Fix requires removing the manual reset block from globals.css (Tailwind v4 already provides this in @layer base)
next_action: ROOT CAUSE FOUND — return diagnosis

## Symptoms

expected: "Landing page renders with dark gradient hero, CTA buttons, feature cards, and styled navigation. Login page shows styled auth card with username field, password field with show/hide toggle"
actual: "The page is unstyled, nothing renders styled. Can see all the elements but it is not styled."
errors: (none reported — visual regression only)
reproduction: Tests 3 & 4 in Phase 1 UAT
started: UAT discovery

## Eliminated

- hypothesis: postcss.config.mjs missing or misconfigured
  evidence: File exists with correct Tailwind v4 config: `'@tailwindcss/postcss': {}`
  timestamp: 2026-05-21T00:03:00Z

- hypothesis: Wrong Tailwind version installed (v3 vs v4)
  evidence: node_modules shows tailwindcss@4.3.0 and @tailwindcss/postcss@4.3.0 — correct v4 packages
  timestamp: 2026-05-21T00:03:00Z

- hypothesis: globals.css missing @import "tailwindcss"
  evidence: Line 1 of globals.css is exactly `@import "tailwindcss"` — correct v4 import
  timestamp: 2026-05-21T00:03:00Z

- hypothesis: layout.tsx not importing globals.css
  evidence: Line 7 of layout.tsx: `import './globals.css'` — present and correct
  timestamp: 2026-05-21T00:03:00Z

- hypothesis: CSS not being generated at all
  evidence: /_next/static/chunks/_02d02n3._.css (34KB) is generated, linked in HTML, and contains @layer utilities with .flex, .grid, .rounded, .text-white etc.
  timestamp: 2026-05-21T00:05:00Z

- hypothesis: CSS not being served to browser
  evidence: curl http://localhost:3000/_next/static/chunks/_02d02n3._.css returns 200 with 34697 bytes
  timestamp: 2026-05-21T00:05:00Z

- hypothesis: tailwind.config.ts (v3-style) conflicting with postcss-only v4 setup
  evidence: No tailwind.config.ts or tailwind.config.js exists — pure v4 postcss setup, correct
  timestamp: 2026-05-21T00:03:00Z

## Evidence

- timestamp: 2026-05-21T00:03:00Z
  checked: frontend/postcss.config.mjs
  found: Uses `@tailwindcss/postcss` plugin — correct Tailwind v4 postcss configuration
  implication: PostCSS pipeline is correctly set up

- timestamp: 2026-05-21T00:03:00Z
  checked: frontend/package.json
  found: tailwindcss@^4.0.0, @tailwindcss/postcss@^4.0.0 in devDependencies; actual installed: 4.3.0
  implication: Correct Tailwind v4 installed

- timestamp: 2026-05-21T00:03:00Z
  checked: frontend/src/app/globals.css line 1
  found: `@import "tailwindcss"` — correct v4 CSS-first import
  implication: Tailwind v4 import is correct

- timestamp: 2026-05-21T00:03:00Z
  checked: frontend/src/app/globals.css lines 63–68
  found: Manual CSS reset block OUTSIDE any @layer:
    ```css
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    ```
  implication: THIS IS THE BUG — see root cause below

- timestamp: 2026-05-21T00:03:00Z
  checked: frontend/src/app/layout.tsx
  found: `import './globals.css'` on line 7 — globals.css is imported into root layout
  implication: CSS is correctly loaded

- timestamp: 2026-05-21T00:05:00Z
  checked: .next/dev/static/chunks/src_app_globals_css_0w3-wzy._.single.css
  found: 1626 lines, 144 matches for utility class patterns (.flex, .grid, .rounded, .bg-*, .text-*)
  implication: Tailwind IS generating utility classes in dev mode

- timestamp: 2026-05-21T00:06:00Z
  checked: /_next/static/chunks/_02d02n3._.css (live HTTP, served to browser)
  found: 34697 bytes; contains @layer properties (line 43), @layer theme (87), @layer base (153), @layer utilities (401); utility classes present inside @layer utilities
  implication: CSS is being served correctly with utilities generated

- timestamp: 2026-05-21T00:08:00Z
  checked: /_next/static/chunks/_02d02n3._.css lines 1413–1430
  found: After @layer utilities closes, UNLAYERED rules appear:
    ```css
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html { -webkit-font-smoothing: antialiased; font-size: 16px; }
    body { background-color: var(--color-background); ... }
    ```
  implication: These are the globals.css manual reset rules compiled as unlayered CSS

- timestamp: 2026-05-21T00:09:00Z
  checked: CSS Cascade Layer spec behavior (W3C CSS Cascade Level 5)
  found: "Unlayered styles implicitly form a final (highest-priority) author layer" — this means unlayered `* { padding: 0; margin: 0 }` has HIGHER cascade priority than ALL @layer utility classes regardless of specificity
  implication: Every Tailwind spacing utility (p-*, m-*, px-*, py-*, pt-*, pb-*, mx-*, my-*) applied to any element is overridden to 0 by the unlayered * reset. Layout utilities (flex, grid) and color utilities work fine.

- timestamp: 2026-05-21T00:10:00Z
  checked: .next/static/chunks/0xawh--x2-~0a.css (production build CSS)
  found: Only 2839 bytes — contains ONLY font faces, CSS custom properties, and the manual globals.css rules. ZERO Tailwind utility classes present.
  implication: The production build (next build) also has a CSS generation issue — Tailwind v4 failed to include any utilities in the production build. The dev server (next dev) does generate utilities but they are defeated by the cascade issue above. Both modes are broken, through different mechanisms.

## Resolution

root_cause: |
  **Primary cause (affects dev AND prod):** `frontend/src/app/globals.css` lines 63–68 contains a manual CSS reset (`* { box-sizing: border-box; margin: 0; padding: 0; }`) that is OUTSIDE any CSS `@layer`. In Tailwind v4's CSS-layer-based architecture, unlayered author CSS has higher cascade priority than all `@layer` rules, including `@layer utilities`. This means every Tailwind spacing utility class (`p-*`, `m-*`, `px-*`, `py-*`, `pt-*`, `pb-*`, etc.) applied to any HTML element is overridden by the unlayered `* { margin: 0; padding: 0 }` rule. The page renders with zero padding and margin everywhere, making it appear completely unstyled despite Tailwind classes being present in the HTML and CSS file.

  **Secondary cause (affects prod build only):** The production `next build` output (`.next/static/chunks/0xawh--x2-~0a.css`, 2839 bytes) contains ZERO Tailwind utility classes whatsoever — only font declarations and CSS custom properties. This means in production mode (`next start`), no layout utilities (flex, grid, rounded) work either. The Tailwind v4 `@tailwindcss/postcss` plugin did not scan and emit utility classes during the production build. This may be caused by the PostCSS config not being picked up correctly during `next build`, or a different issue.

fix: |
  **For the primary cause (globals.css):**
  Remove the manual `* { }` reset block from `frontend/src/app/globals.css` (lines 63–68). Tailwind v4 already includes an equivalent reset in its own `@layer base` block (`@layer base { *, :after, :before, ::backdrop { box-sizing: border-box; border: 0 solid; margin: 0; padding: 0; } }`). The manual reset is redundant AND harmful because it sits outside @layer.

  **For the secondary cause (production build):**
  Run `cd frontend && npm run build` and inspect whether `@tailwindcss/postcss` emits utilities in the production CSS. If not, investigate whether `next build` picks up `postcss.config.mjs` (note the `.mjs` extension — verify Next.js 16 supports `.mjs` postcss config). May need to rename to `postcss.config.js` using `module.exports = { plugins: { '@tailwindcss/postcss': {} } }`.

verification:
files_changed:
  - frontend/src/app/globals.css
