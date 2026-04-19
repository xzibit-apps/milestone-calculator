# Pre-retrofit audit (PR 2, Pass 1 — TEMPORARY — delete before opening PR)

Snapshot of the app before applying the Xzibit App Standard v1.0 retrofit. This file will be deleted in Pass 5.

---

## Tech stack (confirmed)

- Next.js 15.5.9 (App Router), React 19.1.0, TypeScript ~5.
- **Tailwind CSS 4** via `@tailwindcss/postcss` (PostCSS plugin, no legacy `tailwind.config.ts` directives needed; the `@theme inline` block in `globals.css` carries the only token mapping).
- `lucide-react` for icons, `react-hook-form` + `zod` + `@hookform/resolvers` for forms. No other UI libs.
- Build baseline confirmed clean on commit `1152585` (pre-retrofit) — 332 packages installed, `next build` produced a clean output with routes `/`, `/admin`, `/api/admin/save-config`, `/api/user/role`, `/icon.svg`.

## Deployed URLs (probed 2026-04-19)

| URL | Status |
|---|---|
| `https://production-milestone-calculator.vercel.app` | `200` (legacy canonical, still live) |
| `https://milestone-calculator.vercel.app` | `404` (never existed — confirms Wave 2.1 went directly to the `xzibit-` prefix) |
| `https://xzibit-milestone-calculator.vercel.app` | `200` (Wave 2.1 canonical) |

Both live URLs serve HTML. Either is usable as a visual reference for the "before" state.

## CSS approach today

Single global stylesheet at `src/app/globals.css` (66 lines):

- Imports Tailwind (`@import "tailwindcss";`).
- Defines a bespoke CSS-variable palette on `:root`: `--background`, `--foreground`, `--border`, `--muted`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--destructive`, `--success`, `--warning` (each with a `-foreground` companion).
- `@theme inline` maps only `--color-background` and `--color-foreground` into Tailwind 4's theme.
- `@media (prefers-color-scheme: dark)` redefines those variables (the bespoke dark mode). **None of the components actually honour this** — they hard-code `#0b1220` / `#0f172a` / etc. regardless of the `prefers-color-scheme`, so the `:root` tokens are effectively dead code.
- `body` forced to `font-family: Arial, Helvetica, sans-serif` — overrides the Inter font loaded via `next/font/google` in `layout.tsx`.
- One custom `@keyframes fade-in` + `.animate-fade-in` animation.

`layout.tsx` loads Inter via `next/font/google` but it's masked by the `body` font-family override in `globals.css`.

## Visual inventory

### Layout shell (`src/app/page.tsx` + `src/app/admin/page.tsx`)

- Dark SaaS / glassmorphism aesthetic:
  - Hard-coded `min-h-screen bg-[#0b1220] text-[#e2e8f0]`.
  - Decorative animated background: three `absolute` blurred pastel circles (blue / indigo / purple) with `animate-pulse`, plus a grid-pattern overlay.
  - `linear-gradient` from `#0b1220 → #1e1b4b → #0b1220` as the base layer.
- No shell / sidebar structure — single scrolling page with `max-w-7xl mx-auto`. The Xzibit App Standard's `.shell / .side / .main` split is not applicable here (app is single-page); Pass 3b will be skipped. The `.page` wrapper on `.main` is appropriate.

### Topbar / header (`src/components/home/Header.tsx`)

- 129 lines. Renders a dark-navy card (`bg-[#0f172a]/95`), hairline gradient top border, rounded `2xl/3xl`.
- Icon block: gradient blue rounded square with `CalendarCheck` lucide icon.
- Title: `Production Milestone Calculator` — **Title Case**, white text, bold, 2xl→4xl responsive.
- Tag row of four "feature pills" (Working Days / Complexity Scoring / Quality Assurance / Information Gates) with blue glow on hover — these are decorative chrome with no state, not standard `.pill`s.
- Two buttons in the top-right cluster: "Apps Home" (outbound link to `https://xzibit-apps.vercel.app`) and "Admin Dashboard" (internal link, only rendered for admin users after role fetch).
- `fetch('/api/user/role')` on mount to toggle admin visibility.

### Typography (site-wide)

- **All body text Arial** (override in `globals.css`).
- **All headings Title Case** ("Production Milestone Calculator", "Inputs", "Calculated Specs", "Milestones", "Project Timeline", "Information Completeness", "Admin Dashboard").
- Section labels use `uppercase tracking-wide` / `tracking-wider` on `text-xs` / `text-[10px]` labels — dozens of these ("START DATE", "END DATE", "DAYS", "COMPLEXITY INDEX", "COMPLEXITY BUCKET", etc.). These are exactly the ALL-CAPS labels the Xzibit standard retires (only `.step` eyebrow keeps upper-case).

### Colour palette in use (hexes grep'd from the three page-level files)

All bespoke, none of them token-derived. Split into groups:

- **Navy surface family:** `#0b1220`, `#0f172a`, `#0b1a2e`, `#0b2545`, `#1e293b`, `#1e1b4b`, `#031022`.
- **Hairline / border:** `#203049`.
- **Blue brand / accent:** `#60a5fa`, `#3b82f6`, `#2563eb`, `#1d4ed8`.
- **Purple accent (background only):** `#8b5cf6`.
- **Slate text:** `#e2e8f0`, `#cbd5e1`, `#94a3b8`, `#64748b`, `#475569`, `#334155`.
- **Semantic (through Tailwind names, not hex):** `text-green-400/500`, `text-red-400/500`, `text-yellow-400/500`, `text-blue-400`, `bg-green-500/20`, `bg-red-500/20`, `bg-yellow-400/20`.

### Buttons

- **Primary "Calculate Milestones"** (`ProjectForm.tsx:386-403`): large gradient pill (`from-[#60a5fa] via-[#3b82f6] to-[#2563eb]`), multiple layered shadows, sheen overlay animation, hover translate-y.
- **Export JSON / CSV / PDF** (`ExportButtons.tsx`): three bespoke gradient cards, each ~35 lines of Tailwind utilities. Functionally identical → obvious `.btn .btn--secondary` candidate.
- **Admin Dashboard** / **Apps Home** (`Header.tsx`): two variants of the same soft-blue pill button.
- **Admin page "Save"** (`admin/page.tsx`): solid blue button, distinct bespoke styling.
- **"Go back home"** inside the admin-denied screen (`admin/page.tsx:176`): yet another variant.

### Inputs and forms (`ProjectForm.tsx`, `admin/page.tsx`)

- Inline `FormInput`, `FormSelect`, `FormCheckbox` helpers in `ProjectForm.tsx`.
- Every input: dark `bg-[#0b1a2e]/90 backdrop-blur-md border border-[#203049]/80 rounded-lg sm:rounded-xl`, blue focus ring + glow shadow.
- Labels: `text-xs text-[#94a3b8] uppercase tracking-wide`.
- Date input: custom click handler that calls `.showPicker()`.
- Checkboxes: native styled, `h-4 w-4 text-[#60a5fa] bg-[#0b1a2e]`.
- Admin form uses raw `<input>` / `<select>` with almost-identical bespoke classes — no shared helper.

### Status indicators

- **Bucket pill** in `ResultsPanel.getBucketColor` — switch on `low / medium / high / fast_track / standard / custom` returning Tailwind `bg-green-500/20 text-green-400 border-green-500/30` etc. Three different green/blue/red variants and a legacy branch for older bucket names.
- **Information Completeness bar** (`ResultsPanel.tsx:338-349`): manual bg `#031022` with a `h-2` bar coloured `bg-green-500 / bg-yellow-500 / bg-red-500` by threshold.
- **Feature pills** in `Header.tsx`: chrome-only, no state.

### Cards / panels

- **Form card** (left column): `bg-[#0f172a]/90 backdrop-blur-2xl border border-[#203049]/60 rounded-2xl sm:rounded-3xl`, layered shadows, gradient header strip, blue glow on hover.
- **Results card** (right column): same shell as the form card (visually; structurally duplicated).
- **CI/Bucket stat tiles** inside ResultsPanel: mini cards with gradient from `#0b2545` to `#0f172a`, blur accent, lift on hover.
- **Milestone row**: gradient row from `#0b2545` to `#0f172a` with conditional "truck leave" emphasis (extra blue shadow + border-2).
- **Project Timeline strip**: three sub-tiles (start / end / duration) inside a navy card.
- **Admin page tabs**: horizontal underlined nav (CI / Thresholds / Tasks / Labels), bespoke styling.

### Empty / info states

- `ResultsPanel` no-result screen (`ResultsPanel.tsx:87-95`): centred info icon inside a navy pill, muted grey text — "Enter inputs and calculate" message.
- Alert banners for "Truck leave date required" and "Durations calculated": flat navy card with coloured icon badge (yellow-400 / blue-400). Functionally toast-like, visually card-like.
- Error banner on the home page (`page.tsx:154-169`): red-tinted strip with close button.
- Admin "you do not have permission" screen (`admin/page.tsx:164-183`): full-screen centred card.
- Admin "loading configuration" screen (`admin/page.tsx:189-196`): spinner inside navy shell.

### Bespoke CSS files / classes

- Only `src/app/globals.css` — no component CSS files, no CSS modules. All styling is via Tailwind utility classes inline.
- One custom keyframe (`fade-in`) used by the error banner.
- No separate `_local.css` exists yet (will be created in Pass 3 if a pattern from the standard is missing).

## Known offenders (re-confirmed from prior audit)

1. ✅ Bespoke tokens in `globals.css` — will be stripped in Pass 2.
2. ✅ Hard-coded hexes in `Header.tsx` and every other component — targeted per Pass 3 commit.
3. ✅ Arial overriding Inter in `globals.css` body — removed in Pass 2.
4. ✅ Title Case and ALL-CAPS labels throughout — sentence-cased in each Pass-3 commit.
5. ✅ No sidebar / `.shell` structure — Pass 3b will be skipped (app is single-page).
6. ⚠️ **Missing from the Xzibit App Standard:** dedicated input / select / checkbox / textarea component classes. The standard's CSS only defines `.search-input`. Form styling will need `src/app/_local.css` composing from `--xz-*` tokens — flagged as a v1.1 candidate in `NIGHT_RUN_QUESTIONS.md`.

## Pause-condition assessment (brief §Pass 1)

The brief asks whether the design is "deliberately polished and distinct" (LED Screen Calculator case) or "legacy unbranded". Reading the code and the deployed HTML:

- **Not distinct brand language.** No League Spartan (in fact, Inter is loaded but defeated by an Arial override, which argues for "not intentional"), no bespoke wordmark, no repeated motif — just a generic dark-SaaS palette that drifts further from the Xzibit Standard the more you look.
- **Title Case on the app title**, ALL-CAPS on every section label, decorative animated blur blobs in the background — hallmarks of "AI-generated dark dashboard", not "considered product design".
- No consistent typographic scale: mixes `text-xs`, `text-[10px]`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl` ad hoc.

**Verdict: pause condition does NOT apply.** Proceeding with passes 2–5.

## Plan for Pass 3 commits

1. **3a topbar and header** — rewrite `Header.tsx` to use `.topbar`, `.h1`, `.subtle`, `.btn`, `.btn--primary`, `.btn--ghost`. Drop the feature-tag row or restyle with `.pill--*` pastels. Also strip the decorative background in `page.tsx` and `admin/page.tsx` and switch the top-level shell to `.main > .page`.
2. **3b shell and sidebar** — **skipped** (app has no sidebar).
3. **3c forms and inputs** — add `src/app/_local.css` with input/select/checkbox rules composed from `--xz-*` tokens, loaded AFTER the standard import. Update `ProjectForm.tsx` helpers and the admin page's raw inputs.
4. **3d buttons and pills** — standardise all buttons (`.btn .btn--primary/--secondary/--ghost`, `.icon-btn`). Replace bucket/status badges with `.pill .pill--mint/--amber/--coral/--sky`.
5. **3e cards and status indicators** — convert form/results shells to `.card`, CI/bucket tiles to `.stat.mint / .stat.sky / .stat.amber`. Swap the Info Completeness progress bar to a `.pill`-coloured bar and sentence-case the label.
6. **3f empty states and misc** — no-result screen to `.empty`, error banner to a small `.card` with `.pill`, retire the `fade-in` keyframe if it's only used by the banner.

Sentence-case pass runs through every Pass-3 section: H1 "Production Milestone Calculator" → "Milestone calculator", H2 "INPUTS" / "CALCULATED SPECS" → "Inputs" / "Calculated specs", ALL-CAPS labels ("START DATE", "END DATE", "DAYS", "COMPLEXITY INDEX", "COMPLEXITY BUCKET", "MILESTONES", "INFORMATION COMPLETENESS", "PROJECT TIMELINE") → sentence case. `.step` eyebrows are not present; none to preserve.

Every commit runs `npm run build`. On failure: one trivial retry, else revert and log.
