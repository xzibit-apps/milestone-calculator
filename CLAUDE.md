# Milestone Calculator — context for Claude Code

Milestone Calculator computes project milestone dates for exhibition / AV builds, working backwards from the truck leave date. It is part of the Xzibit Apps internal tool platform, operated by Xzibit Experiential Design Studio. The sole developer is Joel Nebauer (joel@xzibit.com.au); Joel is not a software engineer and drives every change through Claude Code sessions coordinated from a higher-level Cowork session.

---

## Platform context — read these first

The Xzibit App Standard v1.0 is the visual and code standard every app in the platform must follow. Read the AI ruleset before any UI change.

- Standards site (component preview): https://xzibit-standards.vercel.app/
- Stylesheet (single import — Inter + all tokens + all component classes): https://xzibit-standards.vercel.app/xzibit-design.css
- Tokens JSON: https://xzibit-standards.vercel.app/tokens.json
- AI ruleset (mandatory reading before any UI change): https://xzibit-standards.vercel.app/CLAUDE.md

The stylesheet is imported at the top of `src/app/globals.css`. Do not edit `xzibit-design.css` directly — it's hosted. If this app genuinely needs a pattern the standard doesn't have, compose it locally in `src/app/_local.css` loaded AFTER the standard import, and flag the pattern as a v1.1 standards candidate in the PR description.

---

## Data sources

- Supabase project: `rklzgzyqbajhpjvixlkr`, region `ap-southeast-1`. Read-only access via the Supabase MCP for development.
- **Canonical projects table:** `public.projects`, operationally owned by Whiplash (the project-management hub). Do not read from `cp_projects` / `cp_sheet_projects` — those are Capacity Planner-internal. `project_dates` exists but is currently dormant; treat `projects.*_date` as the source of truth for bump-in / show-open / bump-out.
- **Client name resolution:** `projects.client_id → users.company_name` (fallback `users.full_name`). The `users` table doubles as a clients store — documented platform-wide oddity, see `kb_decisions`.
- **This app's own tables (pending sign-off):** `milestone_calculations` and `milestone_config`. Schema design requires Joel's explicit approval before any DDL runs.
- **Knowledge tab tables:** `kb_systems`, `kb_repositories`, `kb_deployments`, `kb_decisions`, `kb_naming`, `kb_accounts`. Full rationale for platform-level decisions lives in `kb_decisions`.

---

## What's off-limits

- **JWT / SSO code.** `iss`, `aud`, JWT secrets, any auth middleware. Current values are decode-only and will migrate in Sprint C and Auth Correctness Sprint Phase 2. Visual changes only — do not touch any auth file.
- **Schema changes (DDL) without Joel's sign-off.** `CREATE`, `ALTER`, `DROP` on any table are off-limits until Joel approves. Row `UPDATE` / `INSERT` on `kb_*` tables is fine.
- **Supabase RLS policies.** Do not alter.
- **Cross-repo changes.** Stay in this repo. If a change is needed in `xzibit-apps/launcher` or anywhere else, flag it and stop.
- **Custom domains / DNS.** Stay on Vercel defaults (`*.vercel.app`).
- **Editing the Xzibit App Standard stylesheet directly.** Import only — hosted.
- **Password-based auth, new account creation, deleting any data.** Defer to Joel.

---

## Workflow rules

- **Audit before acting.** Before any non-trivial code change, inspect the relevant files and report what you plan to change. Stop for Joel's direction on anything non-obvious.
- **One concern per commit.** Keep diffs small and reviewable.
- **Stop-and-report on surprises.** If the repo state contradicts expectations, stop and ask — do not guess.
- **Every UI change conforms to the Xzibit App Standard.** Tokens (`--xz-*`) and component classes only. No bespoke hexes. No Arial or system-font body overrides. Sentence case everywhere except the `.step` eyebrow label.
- **Test before merging.** Run `npm run build` (and the test suite if one exists) and verify the app still boots before opening a PR.

---

## Sprint D coordination

- **Wave 1 (GitHub transfer + rename):** complete. Repo lives at `xzibit-apps/milestone-calculator`.
- **Wave 2 (Vercel reconnect + rename):** in progress as of 2026-04-18. Do NOT push commits to `main` until Joel confirms Wave 2 is done for this repo — any push triggers a redeploy and muddies Wave 2 verification. Feature branches and held PRs are fine.
- **Wave 3 (hosting migrations):** not applicable — this app is already on Vercel.
