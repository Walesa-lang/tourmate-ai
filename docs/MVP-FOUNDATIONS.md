# Traveller MVP foundations

## Product and journeys

The restored TourMate interface remains the design baseline. Assistant and Profile lead traveller navigation; the existing standalone Trip Planner route and data remain intact but hidden. Partner entry points remain in footers and their existing protected routes. Administrator, authentication and PWA systems are retained.

1. Open `/profile`, sign in, and work through account, trip, interests, preferences and optional food stages. Save each step or skip optional stages. Returning restores saved values and opens the first unreviewed stage. Stage buttons review/edit saved values. Unsaved edits are not persisted; use Save before changing stages.
2. Explicitly grant personalisation to use saved trip context. Food has a separate consent. Withdraw either at any time. Food withdrawal deletes the food answers atomically; personalisation withdrawal stops future use but retains editable travel answers. Delete individual optional stages independently.
3. Ask `/ai-guide` for a trip or day plan. The English deterministic demo asks one missing area or duration question, reuses user-message context and permitted profile context, and proposes catalogue activities. Refine area, duration, pace or remove a named activity. Ask for more detail. Limited catalogue coverage is disclosed; spare days remain open.
4. Save selected suggestions or itinerary items. `/dashboard` shows them with their area, suggested day if applicable, generic recommendation reason, revisit link and removal control. Existing hotel/activity favourites share the same records and unique keys.

## Data and ownership

Migration: `supabase/migrations/20260920194931_profile_assistant_foundations.sql`.

The sole addition is `profiles.travel_profile` JSONB, default `{}`. It contains bounded, allowlisted stage objects, reviewed-stage names and purpose-specific consent records. Existing `profiles.full_name` remains the display-name source. Auth supplies the email. There is no duplicate profile table.

The `update_travel_profile(text,jsonb)` RPC derives the owner from `auth.uid()`, rejects missing identity, locks only that owner's row and validates every stored field. It is SECURITY DEFINER solely to write the otherwise ungranted extension column and generate trustworthy consent timestamps in one transaction. Its empty search path, explicit owner predicates and revoked PUBLIC/anon execution are essential. Authenticated clients cannot write `travel_profile` directly, forge consent metadata, or pass a target owner. Existing profile SELECT and full-name UPDATE RLS remains unchanged. Existing profile INSERT/DELETE privileges remain denied to travellers; account lifecycle uses the existing auth trigger and cascade.

No favourites or saved-trip tables are added. Selected itinerary *items* reuse `favourites`, with existing SELECT/INSERT/UPDATE/DELETE ownership policies and `(user_id,item_type,item_id)` uniqueness. The saved API accepts only canonical catalogue identifiers and bounded day numbers. It reconstructs snapshots on the server, ignores supplied ownership and conversation text, and makes duplicate saves/removals idempotent. Whole itinerary persistence and editing remain deferred; existing saved trips remain untouched.

## Consent v2026-09-v1

| Purpose | Current behaviour |
| --- | --- |
| personalisation | Explicit opt-in to saved travel context; withdrawal stops new requests using it |
| food | Separate opt-in to optional allergies/diet/religious food preferences; withdrawal also deletes answers |
| location | Inactive; cannot be granted; no device request or tracking |
| safety | Inactive; cannot be granted; no trusted contacts or escalation |

Each saved consent records status, wording version, granted/withdrawn timestamps, source and updated timestamp. Ownership comes from the enclosing profile primary key. Consent wording is versioned in `utils/profile.ts`; changing the purpose requires a new version and renewed consent. This is a current-consent record, not an immutable historical audit trail. Application consent never implies a device permission. No defaults opt users in. No traits are inferred. Medical conditions and next-of-kin information are not collected.

New requests reload consent server-side. Already displayed replies cannot be recalled by withdrawal; clearing the conversation removes them from the tab. Do not reuse cached profile context across requests.

## Assistant boundary and limitations

`AssistantInput` supports user identity, conversation identifier, messages/locale, permitted profile context, itinerary context and approved records. `AssistantProvider.respond()` returns text, clarification, source category, saveable recommendations, an itinerary proposal, verification notice and optional usage metadata. The only provider is `demoProvider`; no production provider, paid API or provider key is used.

Responses identify demo, illustrative catalogue or unavailable information. Existing translated accommodation samples retain their explicitly illustrative prices/ratings, which are never used as live quotes. Catalogue records are not verified provider listings. Do not infer availability, route safety, travel times, hours, weather, ingredients or bookings from them. Food responses recommend provider questions and cannot guarantee allergy safety or replace a clinician.

Contextual planning currently supports English, known catalogue areas and 1–14 days. The existing five-language prewritten responses remain; new profile/consent copy is English pending reviewed translations. The small catalogue often has one activity per area. Budget, group size and practical preferences are stored for future richer matching; the demo does not claim to verify suitability. No live tourism feed, reservations, emergency dispatch or mobile-store release is included.

Conversation text remains in tab memory, is submitted to the local server demo per request, and is not persisted or sent to a production AI. Reload/clear removes it. History sent to the server is bounded. Profile lookup failure fails closed on personalisation while allowing generic demo use.

## Telemetry and rate control

Server-only structured `assistant_request` logs contain timestamp, random request ID, temporary salted network pseudonym, demo provider/model, status, latency, lookup category and safe error category. They contain no raw network address, authenticated ID, profile/food fields, messages, secrets, token estimates or monetary costs. Pseudonyms reset when the process restarts. No new analytics account or service is used.

The process-local limiter allows 60 requests/minute per pseudonym, bounds its map to 5,000 entries and returns 429/Retry-After. It is a foundation, not a distributed quota or spending system. Trust proxy headers only behind a controlled ingress; replicas/restarts reset limits. Before a public pilot, configure ingress/distributed limits and approve log access and retention. Recommended operational log retention: at most 14 days. Hosting log retention is an operator setting, not changed by this code. Never add sensitive request bodies to error logs.

Optional profile data persists until deleted, consent withdrawn for food, or account deletion cascades. Saved snapshots contain only catalogue context, no sensitive conversation. Deleted values can remain in backups until the operator's backup retention expires. Approve backup retention and account-deletion operations before collecting pilot personal data. No automatic retention job or account-deletion UI is added.

## Configuration and migration review

The local framework was updated from Next.js 16.2.12 to 16.3.5 after the dependency audit identified critical advisories in the baseline. This is a local dependency security update, not a deployment. The new pinned development-only PGlite dependency makes the SQL/RLS tests reproducible without Docker and is not bundled into traveller pages.

Existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are required. No additional environment variables are introduced. Existing provider environment variables, if present, are unused. No service-role credential is used by the new APIs or exposed to client code.

No remote migration, push or deployment is performed in this milestone. Review the diff and test against a separate preview database first. Confirm the intended project reference before later remote work:

```powershell
npm ci
npm test
npx vitest run tests/database.test.ts
npx supabase migration list --project-ref squxtadjqxmurlslapjd
npx supabase db push --project-ref squxtadjqxmurlslapjd --dry-run --skip-vault
# Only after reviewing the dry run and separately approving the target:
npx supabase db push --project-ref squxtadjqxmurlslapjd --skip-vault
```

For preview, substitute its project reference; do not apply to the named production project as a test. These commands are instructions for later review, not actions run by the agent. If older migrations also appear pending, reconcile history before proceeding. The UI reports an unavailable/retry state until the profile migration is installed; it does not silently save to browser storage.

Rollback is operationally reversible without destructive SQL: revert application release and revoke RPC execution in a new forward migration. Keep the additive column so data is preserved. Any later removal of stored optional data requires a separately reviewed forward migration and retention decision; never rewrite historical migrations.

## Verification and manual acceptance

`npm test` includes PGlite PostgreSQL tests that execute all application migrations unchanged against simulated Supabase auth roles/`auth.uid()`. They exercise grants, RPCs, consent, validation, ownership and idempotency. This does not replace a preview Supabase smoke test of PostgREST/auth/session integration. Docker-based `supabase test db --local` cannot run in this workstation environment; the isolated PostgreSQL suite is the executable local alternative.

Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test:responsive` and `git diff --check`. After recovery from the interrupted session, the standard Next.js 16.3.5 Turbopack production build passed with the installed native compiler; no fallback or build-script change was required. Browser fixtures simulate authenticated profile/saved APIs; public routes, navigation, demo Assistant and error handling run in the production build. Browser tests cover 320, 390, 768, 1024 and 1440px plus short landscape viewports. Artifacts are in ignored `test-results/`.

Before a controlled pilot on an approved preview environment:

- Sign in with two test accounts; save/restore all profile stages and confirm isolation through the real API.
- Grant/withdraw both active purposes, reload and check subsequent Assistant requests; confirm food deletion and retained non-sensitive travel answers.
- Validate dates, travellers and error/retry states while offline; skip stages and delete optional answers.
- Ask for a two-day Windhoek plan, refine pace/area, remove an activity, save selected items and remove them from the dashboard.
- Confirm duplicate saves, sign-out/re-sign-in and catalogue favourites stay coherent.
- Use keyboard and screen reader for navigation, stage focus, error associations, live status and save controls.
- Test a physical mobile keyboard and safe-area behaviour on Android/iOS; browser viewport simulation is not physical-device certification.
- Recheck partner applications, administrator review, PWA install/offline and auth return paths.
- Approve consent wording, backup/log retention, catalogue verification ownership and distributed rate controls.

Next phase: preview migration/acceptance with real test accounts, reviewed translations and verified catalogue coverage, then provider benchmarking behind the existing boundary after explicit budget/provider approval. Voice, live maps, continuous location, safety escalation, messaging integrations, subscriptions and other excluded capabilities remain deferred.
