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

<!-- Further questions will be appended as they arise during passes 2-5. -->
