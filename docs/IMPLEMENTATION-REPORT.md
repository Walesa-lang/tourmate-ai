# TourMate AI MVP implementation report

## Executive summary

Implemented the progressive traveller profile, purpose-specific consent, contextual demo Assistant, conversational itinerary suggestions, selected-item saving/removal, private operational telemetry and mobile-menu accessibility repair. The restored interface remains the baseline. No production AI, paid integration, remote migration, push or deployment was activated.

## Plan followed and completed journeys

| Phase | Result |
| --- | --- |
| Inventory and baseline | Clean starting tree at `5fc5a7e`; existing routes, profile/favourites/saved-trip schema, auth, partner/admin, PWA and tests inspected. Baseline: 56 unit tests and 26 browser tests passed. No separate client decision record found locally. |
| Mobile accessibility | Trigger label is React-managed and translated by state, protected from the translation observer's stale label cache. Opening focuses the first link; Escape returns focus; closed links are inert. |
| Progressive profile | Five stages, saved progress restoration, optional skips, review/edit and stage deletion. Auth email remains read-only. Server/database validators bound dates, numbers, strings, interests and enums. |
| Consent | Separate personalisation and food opt-ins; timestamped/versioned records. Withdrawal stops future use; food withdrawal also deletes food answers. Location and safety remain inactive. |
| Assistant | Provider-independent demo boundary, one focused area/duration clarification, permitted profile and conversation context, honest catalogue/unavailable labels, bounded requests and retry UI. Ordinary planning help is not treated as an emergency. |
| Itinerary and saves | English catalogue-based 1–14 day suggestions; refine area, duration, pace, interests or remove a named activity. Save selected items to existing favourites, view/revisit/remove on the dashboard. No duplicate itinerary table. |
| Operations | Server-only redacted usage events, temporary pseudonyms, error/latency categories, bounded process-local rate control and documented retention. No invented tokens or costs. |
| Security maintenance | Next.js updated to 16.3.5 and compatible dependency fixes applied after baseline advisories were found. Final npm audit: zero vulnerabilities. PGlite added only as a pinned development test dependency. |

## Verification

| Check | Result |
| --- | --- |
| Full Vitest suite | 122 passed across 11 files; includes all original tests and 16 executed PostgreSQL migration/RLS tests |
| TypeScript | `npx tsc --noEmit` passed |
| ESLint | `npm run lint` passed |
| Dependency audit | `npm audit --json`: 0 vulnerabilities |
| Diff whitespace | `git diff --check` passed |
| Production build | `npm run build` passed with Next.js 16.3.5 / Turbopack; 24 generated pages |
| Full Playwright suite | 35 passed, 0 failed, 0 skipped across 7 files (3.3 minutes); focused recovery run also passed 9/9 |

The local Docker-based command `npx supabase test db --local` could not connect to port 54322 because the workstation has no running local Supabase/PostgreSQL. The alternative PGlite suite executed all application migrations unchanged with a simulated platform auth shell, then tested actual PostgreSQL grants, RLS and RPC behaviour. This is runtime SQL testing, not only string inspection; it does not test Supabase PostgREST/session integration.

Recovery preserved all interrupted changes at `5fc5a7e` and compared them against the original six-phase prompt. The native compiler was usable after restart and the standard build passed. The first recovery browser run passed 33/35 checks: one initial profile assertion raced the loading response, and a consent checkbox check assumed an immediate optimistic toggle although the UI intentionally waits for server acknowledgement. The tests now synchronise on the profile response and explicitly assert acknowledged grant/withdrawal state, retaining all layout, focus and persistence assertions. The focused 9/9 rerun and final complete 35/35 rerun passed without retries or skipped tests.

## Responsive and accessibility evidence

Automated profile checks passed at 320, 390, 768, 1024 and 1440px, including all five stages, focus movement and no horizontal overflow. Each also tested a short landscape viewport and reachable form actions. Existing Assistant/navigation checks cover those five widths; chat keyboard-height simulation and translated messages cover the compact viewport. The itinerary/save interaction was exercised at 390px.

| Width | Profile stages / focus / overflow | Assistant and navigation | Short landscape form actions |
| --- | --- | --- | --- |
| 320px | Passed | Passed | Passed at 640 x 390 |
| 390px | Passed | Passed; chat keyboard-height simulation at 390 x 500 | Passed at 640 x 390 |
| 768px | Passed | Passed | Passed at 768 x 390 |
| 1024px | Passed | Passed | Passed at 1024 x 390 |
| 1440px | Passed | Passed | Passed at 1440 x 390 |

Manual screenshot inspection covered 320px and 1440px profile layouts. Browser screenshots are saved under ignored `test-results/profile-*.png`. Inputs have labels, date/number types, relevant autocomplete, error associations and validation state; statuses are announced. Buttons and clickable labels have suitable minimum heights. Existing reduced-motion chat behaviour is retained. A physical mobile keyboard, screen-reader audit and device-level safe areas still require manual pilot acceptance; browser emulation is not a substitute for those checks.

## Database and security review

One additive migration: `20260920194931_profile_assistant_foundations.sql` adds `profiles.travel_profile` and the narrow `update_travel_profile` RPC. Existing profile ownership and favourites CRUD RLS is reused. No historical migration is rewritten and no remote migration was applied.

The profile RPC derives identity from `auth.uid()`, rejects missing identity, uses an empty search path, locks the owner's row and never accepts an owner identifier. PUBLIC/anon execution is revoked. Direct client writes to the extension column are not granted. Tests prove cross-user profile SELECT/UPDATE denial, cross-user favourite SELECT/INSERT/UPDATE/DELETE denial, direct consent-write denial, anonymous/missing-identity RPC denial, food consent enforcement/withdrawal, validation and duplicate-save behaviour. Existing denied profile INSERT/DELETE privileges remain unchanged.

New HTTP mutations validate bounded JSON and origin, authenticate server-side and use canonical allowlisted identifiers. Saved snapshots are reconstructed server-side and omit conversation/profile/food content. Browser code contains no new privileged credential or provider secret. Operational logs omit raw network addresses, user IDs and sensitive text. Personalisation reloads consent per request and fails closed if the profile cannot be read.

The security review used the installed Supabase/Postgres skills and the official [database-function](https://supabase.com/docs/guides/database/functions) and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) documentation. All four application migrations execute in the isolated test database. No existing RLS policy or grant was weakened. A scan of all 35 changed/new files found no private-key, provider-secret or JWT patterns; this complements the manual client/server boundary review.

## Coverage added

Five new unit-test files add 66 cases to the original 56: profile validation/consent, API ownership and safe errors, contextual Assistant and telemetry, server profile-context filtering, and 16 executable migration/RLS cases. One new browser-test file adds nine tests covering five responsive profile widths, persistence/edit/skip/delete/consent, validation and retry states, unauthenticated access, and conversational itinerary saving/removal. Existing navigation tests additionally check stateful accessible names, focus, Escape and the primary-navigation boundary.

## Files added

- `app/api/profile/route.ts`, `app/api/saved/route.ts`
- `app/profile/page.tsx`, `app/profile/profile-builder.tsx`
- `app/components/saved-recommendations.tsx`, `app/attractions/catalogue.ts`
- `utils/profile.ts`, `utils/http.ts`
- `utils/ai-guide/catalogue.ts`, `conversation.ts`, `gateway.ts`, `operations.ts`
- `supabase/migrations/20260920194931_profile_assistant_foundations.sql`
- `tests/profile-foundations.test.ts`, `traveller-api.test.ts`, `assistant-foundations.test.ts`, `assistant-gateway.test.ts`, `database.test.ts`, `profile-assistant.pw.ts`
- `docs/MVP-FOUNDATIONS.md`, `docs/IMPLEMENTATION-REPORT.md`

## Files changed

- `README.md`, `package.json`, `package-lock.json`
- `app/components/site-navigation.tsx`, `app/globals.css`
- `app/dashboard/dashboard-content.tsx`, `app/ai-guide/ai-guide-chat.tsx`, `app/api/ai-guide/route.ts`
- `app/attractions/page.tsx` (catalogue extracted for shared use)
- `utils/ai-guide/contracts.ts`, `utils/ai-guide/service.ts`, `utils/supabase/database.types.ts`
- `tests/mvp-navigation.pw.ts`, `tests/navigation-hydration.pw.ts`

## Preserved systems and review boundaries

No code changes to authentication forms/session middleware, partner applications, administrator review, standalone Trip Planner or the service worker. Their original unit/browser coverage remains in the suites. The dashboard keeps its Welcome back direction; root landing page and catalogue presentation are preserved. Trip Planner stays hidden in traveller navigation, and partner/admin operations are outside primary navigation. No Adventure OS styling, game mechanics or points were added. No live account application/review mutation was performed against remote Supabase.

## Limitations, decisions and next phase

- Apply the reviewed migration to an approved preview project before demonstrating real authenticated profile persistence. The current remote database was deliberately not changed. Browser profile/saved flows use fixtures; real two-account preview acceptance remains required.
- New contextual itinerary planning and profile copy are English. Existing translated prewritten responses remain; reviewed translations are deferred.
- Catalogue records remain illustrative. The small catalogue may leave days open. Whole-itinerary persistence, verified venues, live prices/availability/weather/routes, production AI, voice and all other excluded integrations remain deferred.
- Rate control is process-local, not distributed. Approve production ingress controls, operational log/backup retention, consent wording and catalogue verification ownership before a public pilot.
- Medical conditions, next-of-kin, continuous location and automatic safety escalation are not collected or activated.
- Provider/model choice, budget, data-sharing terms and benchmark approval remain future decisions. No required product decision was silently made by integrating a paid provider.

The recommended next phase is a preview migration and real-account acceptance, reviewed localisation/catalogue coverage, then separately approved provider benchmarking. Detailed retention/deletion implications and the manual acceptance checklist are in [MVP foundations](MVP-FOUNDATIONS.md).

## Later migration commands — not executed remotely

```powershell
npx supabase migration list --project-ref squxtadjqxmurlslapjd
npx supabase db push --project-ref squxtadjqxmurlslapjd --dry-run --skip-vault
# Only after target/history review and separate approval:
npx supabase db push --project-ref squxtadjqxmurlslapjd --skip-vault
```

Use the approved preview project reference first. Review every migration listed as pending; do not use production as a test database. Local verification is `npm test` or `npx vitest run tests/database.test.ts` and needs no remote database.

All applicable local verification passed. The local commit uses `Build TourMate AI profile and assistant MVP foundations`; its hash and post-commit Git status are supplied in the final handoff. No remote migration, push, deployment, paid-service activation or production-environment change was performed.
