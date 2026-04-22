# Public endpoints — Milestone Calculator

**Status: none.**

As of Auth Correctness Sprint Fix #4 (branch `auth/api-route-jwt-verification`), every `/api/*` route in this app is gated at the handler level via `verifyAuth` or `verifyAdmin` from `src/lib/auth.ts`.

## Route classification (2026-04-22 audit)

| Route | Method | Gate | Reason |
|---|---|---|---|
| `src/app/api/milestone/calculate/route.ts` | POST | `verifyAuth` | Runs a calculation; no shared-state write. |
| `src/app/api/milestone/save/route.ts` | POST | `verifyAuth` | Persists a user's calculation to their own records. |
| `src/app/api/admin/save-config/route.ts` | POST | `verifyAdmin` | Changes admin-panel config — shared state. |
| `src/app/api/user/role/route.ts` | GET | `verifyAuth` | Reads current user's role from the verified token. |

## Adding a new `/api/*` route

1. Import from `@/lib/auth`.
2. Call `verifyAuth(request)` (reads + user-owned writes) or `verifyAdmin(request)` (shared-state / destructive writes) at the top of every exported method.
3. Return early on `!auth.ok` with the helper's `status` and `error`.
4. Append the classification to the table above in the same PR.

## Related

- `kb_decisions` `1b776834-14c7-4cb6-a210-91c9c97bee5e` — Auth Correctness Sprint plan.
- `kb_decisions` `83fcbbd9-cf34-4094-807f-3b1f07499a1c` — CP Fix #3 (canonical pattern).
- PR `auth: JWT verification on all /api/* route handlers (Fix #4)` — this fix.
