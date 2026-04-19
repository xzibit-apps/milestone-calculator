# Night-run questions for Joel

Deviations from the overnight brief, surprises, and open questions for morning review. Each entry lists what happened, why I deviated, and what I'd suggest.

---

## 1. `kb_systems.status` enum mismatch — brief said `development`, used `dev`

**Where:** Task 1.3 (`kb_systems` update for Milestone Calculator).

**What happened:** The brief asked for `status → 'development'`. The `kb_system_status` enum in the DB only accepts `live`, `dev`, `archived`, `unknown`. I used `'dev'` — that's what other in-flight apps (TV Bracket Labels, Whiplash, Xzibit Dashboards) use, so it's consistent.

**Question:** Confirm `'dev'` is what you meant, or do you want the enum extended to include `'development'` as a separate state (e.g. "dev" = pre-production sandbox, "development" = actively being worked on)? I didn't run DDL to extend the enum.

---

## 2. `kb_deployments` notes update — skipped to avoid regressing the record

**Where:** Task 1.3 (`kb_deployments` row for Milestone Calculator, id `79856f50-c7a9-4426-87b9-a26e191ec013`).

**What happened:** The brief asked me to overwrite `notes` to:

> "Hosted on Vercel. Wave 2 rename from production-milestone-calculator to milestone-calculator in progress as of 2026-04-18. provider_project_id to refresh once Wave 2 lands."

The **current** value (almost certainly written by the Wave 2.1 session) is more accurate:

> "Sprint D Wave 2.1 (2026-04-18). Vercel project renamed milestone-calculator → xzibit-milestone-calculator + xzibit-milestone-calculator.vercel.app registered as project domain. Serves 307 → launcher login. Legacy canonical production-milestone-calculator.vercel.app preserved."

The brief's text treats Wave 2 as still in-flight; the current KB reflects that Wave 2.1 (the `xzibit-` prefix rename) is already done. Applying the brief verbatim would regress the record. Per autonomy rule "pause, don't halt", I skipped this sub-task and logged it here.

**Follow-up finding:** the row still has `provider_project_id = 'production-milestone-calculator'`, but per the current notes the Vercel project was renamed to `xzibit-milestone-calculator`. Either the rename hasn't fully propagated, or `provider_project_id` itself needs updating. I didn't touch it — flagging for you to verify.

**Question:** Do you want me to (a) update `provider_project_id` to `xzibit-milestone-calculator` in a follow-up, (b) leave it for Sprint D cleanup, or (c) is there a deliberate reason it stays as the old value?

---

## 3. Production Vercel URL still live as `production-milestone-calculator.vercel.app`

**Where:** Pass 1 audit (Task PR 2 Pass 1), and `kb_systems.url`.

**What happened:** Prior audit found the `kb_systems.url` is still `https://production-milestone-calculator.vercel.app`. The deployment notes also mention it's preserved as a "legacy canonical" URL. Headers and components in the codebase also link to `https://xzibit-apps.vercel.app` for the launcher.

**Question:** Should `kb_systems.url` flip to `https://xzibit-milestone-calculator.vercel.app` (the new canonical subdomain), or is the legacy URL intentionally the listed one? I've left it unchanged this run.

---

## 4. `kb_decisions` has no `tags` column — brief asked for tags per row

**Where:** Task 1.4 (inserting 4 `kb_decisions` rows).

**What happened:** The brief asked me to "pick sensible tags per row", but `kb_decisions` has no tags column and there is no adjacent join table (checked `kb_*` — only `kb_accounts`, `kb_credential_pointers`, `kb_decisions`, `kb_deployments`, `kb_documents`, `kb_domains`, `kb_naming`, `kb_open_questions`, `kb_repositories`, `kb_systems`). I inserted the rows without tags.

**Question:** Want me to (a) add a `tags text[]` column to `kb_decisions` in a follow-up DDL (Joel's sign-off), (b) create a `kb_decision_tags` join table, or (c) leave as-is and drop the "tags" requirement from future briefs?

## 5. `kb_open_questions` exists — should night-run questions live there instead of a repo file?

**Where:** Meta — general platform observation.

**What happened:** While listing `kb_*` tables I noticed `kb_open_questions` exists. This file (`NIGHT_RUN_QUESTIONS.md`) is where the brief told me to log questions, but the questions are platform-level, not repo-specific, and would probably be better tracked centrally.

**Question:** On your next night-run brief, should I instead write these into `kb_open_questions` rows (one per question) so they aggregate across all repos? Either pattern is fine; flagging for your preference.

## 6. v1.1 candidates added to `src/app/_local.css`

**Where:** PR 2, Passes 2–3f.

**What happened:** The Xzibit App Standard v1.0 stylesheet doesn't define a number of patterns this app needs. Per the brief, I composed them locally in `src/app/_local.css` (imported AFTER `xzibit-design.css`, consumes `--xz-*` tokens only, no bespoke hexes, no new fonts). Every one of these is a candidate to fold into the standard at v1.1:

- **Form controls.** `.field`, `.field-label`, `.field-help`, `.field-error`, `.input`, `.select`, `.textarea`, `.input-wrap`, `.input-icon`, `.input--with-icon`, `.input--error`, `.checkbox`, `.fieldset`, `.fieldset-title`, `.fieldset-list`. The standard only ships `.search-input`, but every Xzibit app has forms. This is the largest gap.
- **Progress bar.** `.progress` + `.bar.is-good/.is-warn/.is-bad`. Used for Information Completeness in the results panel.
- **Milestone row.** `.milestone-row`, `.milestone-row--anchor`, with sub-elements `.index`, `.body`, `.name`, `.note`, `.schedule`, `.days`. This is very specific to this app and probably shouldn't go into the standard — flagging for your call.
- **Stacked tab bar.** `.tabs-block` + `.tab` + `.tab.is-active`. The standard has inline tabs (`.tabs`); the admin page needed a full-width block tab bar with an underline on the active tab. A companion to `.tabs` at the standard level would be reasonable.
- **Alerts.** `.alert`, `.alert-icon`, `.alert-body`, `.alert-title`, `.alert-text`, `.alert--info`, `.alert--warn`, `.alert--error`, `.alert .dismiss`. Used for error banners and "project dates required" notices. Maps semantically to the six-pastel family (sky / amber / coral).
- **Spinner.** `.spinner` — small inline loading glyph that inherits `currentColor` so it works inside any `.btn` variant.

**Question:** Which of these should fold into the next standards update? The form controls and alerts feel universal; the milestone-row is app-specific; the tabs-block and progress bar are in between.

## 7. `src/lib/export.ts` PDF template retains bespoke hexes

**Where:** PR 2 retrofit scope decision.

**What happened:** `src/lib/export.ts` contains an inline HTML template used to generate print/PDF exports. It has its own colour palette (`#333`, `#2563eb`, `#1e40af`, `#f1f5f9`, `#f8fafc`, `#e2e8f0`). I left it untouched — it's a self-contained document intended for print, rendered outside the app DOM, and retrofitting it is a separate task from the UI retrofit.

**Question:** Do you want a follow-up task to port the PDF template to standard colours (teal / ink / hairline tokens inlined as hex literals), or is the current template's visual style deliberately distinct from the app UI?

## 8. `src/app/icon.svg` favicon

**Where:** PR 2, misc.

**What happened:** The favicon source `src/app/icon.svg` uses two hex colours. Not touched — tiny, unrelated to UI retrofit.

**Question:** Out of scope; only noting for completeness.

## 9. Admin page retrofitted in place, not rewritten

**Where:** PR 2 Pass 3f.

**What happened:** The admin page (`src/app/admin/page.tsx`, 665 lines) was retrofitted with targeted `replace-all` edits and structural rewrites of the three pre-main states, topbar, save banner, and tab bar — rather than a full ground-up rewrite. The config-editor body sections still use a manual state-setter pattern (every `<input onChange>` rebuilds the whole `ciConfig`). No functional refactor was attempted; this was scope-limited to visual retrofit only.

**Question:** Happy with that, or would you like a follow-up task to collapse the repeated `onChange → setCiConfig({...spread})` logic into a small helper?

## 10. `provider_project_id` drift (re-flag)

**Where:** Also flagged in item 2 above.

**What happened:** During Pass 1 probing I confirmed that the Wave 2.1 Vercel rename is live: `https://xzibit-milestone-calculator.vercel.app` returns 200. The legacy `https://production-milestone-calculator.vercel.app` also still returns 200. `kb_deployments.provider_project_id` still reads `production-milestone-calculator`. Might be deliberate (legacy URL is still the advertised one); worth a conscious decision.

