# Assistant gateway and controlled pilot

This document supersedes the Assistant/rate-control portions of MVP-FOUNDATIONS.md.
No live provider, remote migration, deployment, paid integration or production
configuration is activated by this change. The starting repository was clean on
`main` at `5ff29b37d191c7ad5a4931b6686df677fa92f5ff`. The named final client decision
record was not present in the repository; the supplied milestone request governs
this implementation.

## Architecture and request inventory

There is one browser Assistant path: `AiGuideChat` → `POST /api/ai-guide` →
`respondWithContext` → provider boundary. No hidden provider calls or secondary
chat routes were found. The standalone Trip Planner remains intact and hidden
from primary navigation. Profile and saves use their existing authenticated APIs.

Default mode remains a public deterministic demonstration. Its server log records
every request, including malformed, oversized and rate-rejected requests. The
bounded process-local limiter is an early guard, not distributed pilot accounting.

With `ASSISTANT_PILOT_ENABLED=true`, the route verifies a non-anonymous Auth user,
reserves quota before parsing/generation, then completes a durable event. Invalid
authenticated bodies consume quota. The server reloads profile consent for each
response. Profile failures remove personalisation; quota-store failures stop pilot
processing. Anonymous requests and early ingress rejections produce redacted logs
only, because they have no authenticated account to reference in the usage table.

All operations have bounded input/output and explicit deadlines. Body timeout
cancels its stream; provider timeout/cancellation aborts the adapter signal. No
automatic provider retries are performed: zero retries avoids duplicate billing
when completion is uncertain. A future adapter may add a bounded retry only for
an explicitly safe pre-acceptance failure. A timed-out database reservation can
remain `reserved`: never infer zero attempts or refund it automatically.

## Provider boundary and truthful capability labels

`AssistantProvider.respond(AssistantInput, AbortSignal)` returns a structured
`AiGuideServiceResponse`. The server validates text length, known grounding and
clarification states, canonical recommendation IDs/names/locations, itinerary
days, pace and item limits. Unknown adapter fields are discarded. Identity is
excluded from provider input; food, health, accessibility free text, origin,
contact and consent records are excluded from saved-profile context.

The registry recognizes demo, OpenAI and Gemini configuration. **Only the demo
adapter is installed.** An unregistered or disabled live provider returns an
explicitly labelled deterministic demonstration. Flags or credentials alone cannot
start external processing. Provider transports/model-specific serialization are
blocked pending model/data-sharing approval; implement those behind this registry
without changing the UI contract. This is not a claim that live benchmarking or
credential-only activation is finished.

Current labels are demonstration, illustrative catalogue, database-backed approved
records, and unavailable/unverified information. Live-provider mode exists in the
contract but is never emitted by the installed adapter. Voice, vision, maps,
payments, reminders and safety capability flags are locked false. No bookings,
tracking, emergency dispatch or external messages occur.

## Grounding

`tourism_content` is a minimal approved-content boundary, not a CMS or partner
marketplace. It stores Namibia-only hotel/attraction identifiers, name, area,
category, source label/HTTPS URL and verification timestamp. Approved records are
read through the traveller's normal RLS client, not the service-role client.
Partner applications and their private contact fields are never retrieval data.
There are no seed records claiming verification. Publication requires separately
reviewed source material and an authorized operator.

Retrieval matches known catalogue areas and returns at most eight records, with
source IDs and provenance in the response. Empty/unavailable approved retrieval
explicitly falls back to illustrative records. Source links are shown for approved
suggestions. Static names/areas are separated from wording. Prices, ratings,
availability, hours, routes, closures, ingredients and safety claims are not
retrieved. Sample hotel prices/ratings were removed from chat in every supported
language. Confirm changeable details with the relevant provider.

English contextual planning supports area/duration clarification, 1–14 days,
latest duration changes, pace, interests, exclusions and optional details. Sparse
catalogue days remain open. Budget and party suitability cannot be verified with
this dataset; no low-cost or accessibility guarantee is inferred. Food/transport/
entertainment coverage and cross-border recommendations remain unavailable until
approved records and matching rules exist. Multilingual prewritten demo responses
remain; expanded contextual matching needs reviewed localisation.

## Database, quotas and telemetry

Forward-only migration: `20260921153121_assistant_gateway_pilot.sql`.

- `tourism_content`: RLS; authenticated SELECT for approved Namibia rows only;
  browser writes and partner self-publication denied.
- `assistant_usage`: RLS; administrator-only SELECT, trusted-server writes;
  ordinary travellers cannot read any usage rows or forge costs/counters.
- `admit_assistant_request`: SECURITY INVOKER, execution granted only to
  service_role. Serialized account/network locks, rolling minute/day limits,
  unique request UUID and duplicate rejection. Network hashes are HMACs; no raw IP.
- `assistant_usage_summary`: SECURITY INVOKER, explicit administrator check and
  RLS, aggregated last-14-day counts, latency and estimated USD provider cost.
  Protected page: `/admin/assistant` (outside traveller navigation).

Service-role use is limited to unforgeable quota/event writes after Auth validation;
the privileged client never loads profiles, saved data or tourism facts. Table
constraints bound metric ranges and identifiers. Events contain no prompt, response,
health/dietary data, free-form errors or arbitrary JSON. Completion is idempotent
(`reserved` → final state only). Repeated request UUIDs do not generate again;
responses are not persisted for replay. Saved actions emit a separate redacted log
with an ephemeral account pseudonym and action kind, never snapshot content.

Deterministic provider cost and tokens are explicitly zero (hosting/database costs
are excluded). Future model pricing is supplied through validated versioned
metadata, and missing units/pricing produce unknown cost, not zero. The report
separates unknown-cost counts and labels amounts as estimates. Actual provider
usage mapping awaits the approved live adapter.

Timestamps/indexes support retention and reporting. Before pilot access, approve
and implement an operational retention schedule (suggested maximum 14 days for
usage/logs); this milestone does not install a cron job or silently change backup
retention. Account deletion cascades profile/consent, favourites and usage records.
The existing admin-review foreign key can prevent deleting an administrator who
has reviews; that requires an operator-reviewed record-retention decision.

Vercel's ingress header is used only when `VERCEL=1`; other hosts deliberately share
a network bucket until a trusted ingress is configured. Never set that variable
to trust arbitrary client headers on a self-hosted server. See the official
[Vercel request-header documentation](https://vercel.com/docs/headers/request-headers).
Unauthenticated distributed ingress abuse protection remains a hosting/operator
acceptance item; it must not be confused with the database-backed account quotas.

## Server configuration (no secrets in documentation)

| Name | Default / purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Existing session client |
| `ASSISTANT_PILOT_ENABLED` | `false`; authenticated durable pilot mode |
| `SUPABASE_SERVICE_ROLE_KEY` | Required only for pilot quota/event writer; server only |
| `ASSISTANT_NETWORK_SECRET` | Required in pilot; private random secret, at least 32 characters |
| `ASSISTANT_PROVIDER` | `demo`; also validates `openai` / `gemini` |
| `ASSISTANT_LIVE_ENABLED` | `false`; cannot activate unregistered adapters |
| `ASSISTANT_TIMEOUT_MS` | 8000; range 100–20000 |
| `ASSISTANT_REQUESTS_PER_MINUTE` | 20; range 1–60 |
| `ASSISTANT_REQUESTS_PER_DAY` | 100 rolling 24 hours; range 1–1000 |
| `ASSISTANT_IP_PER_MINUTE` | 60; range 1–300 |
| `ASSISTANT_PRICING_JSON` | Optional versioned map keyed by `provider/model`; `inputPerMillionUsd`, `outputPerMillionUsd`, `version`; future adapter helper |
| `VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA`, `NODE_ENV` | Bounded environment/release metadata when available |

These are pilot operational limits, not subscription allowances. No subscription
price or client-owned provider secret was invented. Invalid flags/limits fail
closed with a generic UI error. No new dependency was installed.

## Consent and deletion audit

Existing optional stages can be skipped/restored/edited/deleted. The database RPC
creates consent purpose/version/source/grant/withdrawal timestamps and atomically
removes food data on withdrawal. Personalisation withdrawal stops future saved
travel-context use. Location/safety are inactive; health conditions and trusted
contacts are not collected and have no enabled processing purpose. Application
consent does not grant device permissions.

Messages remain only in the current tab, are not stored in telemetry, and are not
sent to live providers. Assistant-authored messages are not treated as traveller
profile context. Saved snapshots are reconstructed from public records and never
contain private prompts/profile data. API responses use no-store and the PWA does
not cache account/API responses. Already displayed tab content cannot be remotely
recalled; clear/close the conversation on a shared device. Account deletion/session
revocation and backup expiry still require operator acceptance; no account-deletion
UI or backup-retention change is claimed.

## Activation, rollback and readiness

1. Review this implementation and verification report; approve a preview migration
   and target separately. Do not use production as a test database.
2. Apply the additive migration only after approval. Reconcile migration history;
   regenerate the currently handwritten database types against preview if desired.
3. Populate reviewed Namibia records, configure server-only pilot settings, approve
   retention/access policy and hosting ingress protection; exercise two real accounts.
4. Complete the demonstration below and physical mobile/accessibility acceptance.
5. Separately approve provider/model, data-sharing/retention terms, budget and client
   credentials. Implement and mock-test its transport/usage mapping behind the
   existing adapter; benchmark only after spend approval. Recheck data minimization,
   prompt-injection defenses, generated factual claims and exact pricing metadata.

Rollback: disable pilot/live flags and return to the public labelled demo; keep
the additive tables/data. Application rollback may restore the previous release.
If revocation is needed, add a new reviewed forward migration revoking admission
execution; never edit historical migrations or destructively drop stored data.

| Feature | Status |
| --- | --- |
| Provider-neutral contract, deterministic adapter, validation, deadlines | Complete |
| OpenAI/Gemini live transports and benchmarking | Blocked — provider/model/data-sharing/spend approval |
| Approved retrieval schema, provenance, Namibia-only boundary | Complete |
| Real verified dataset / broader tourism categories | Blocked — source/content approval; matching coverage Partial |
| Conversation and item-level itinerary refinement/save/revisit/remove | Complete within documented English/catalogue limits |
| Budget/party matching and whole itinerary persistence | Partial / Deferred respectively |
| Durable pilot account/network quotas and request telemetry | Complete locally; preview activation Blocked |
| Cost metadata/estimator and protected reporting | Complete; live token mapping Blocked |
| Profile/consent/RLS and deletion cascade verification | Complete locally; real-account session/backup acceptance Blocked |
| Retention automation / production ingress acceptance | Not started / Blocked |
| Physical-device and assistive-technology certification | Blocked — manual acceptance |
| Voice, vision, maps, tracking, emergency escalation, payments, integrations | Deferred |

## Repeatable demonstration

Use an approved preview deployment, two synthetic traveller accounts A/B and a
separate administrator. Do not enter real health information in testing.

1. Register/sign in A. Save account/trip stages, skip interests, reload, edit trip,
   delete it, and confirm restoring does not resurrect deleted fields.
2. Grant personalisation and food separately. Save a synthetic food preference,
   withdraw food and reload; verify the field is gone. Withdraw personalisation;
   a new generic plan must ask for its area instead of using saved context.
3. Ask “Plan a trip to Windhoek”, then “2 days”. Confirm one focused clarification,
   approved source metadata when records exist, otherwise the explicit illustration
   notice. Ask “make it slower”, “change it to one day”, and remove a named activity.
4. Save an item twice; revisit it on Dashboard, then remove it. Check one stored
   unique item and confirm account B cannot read or mutate A's data through APIs.
5. Ask about current price, opening hours, ingredients, bookings and Zambia. Confirm
   no fabricated quote, availability, allergy guarantee or active capability claim.
6. With preview quota set to one request/minute, send a second request. Confirm
   readable quota guidance, no provider execution and a quota-rejection event.
   Resend a request UUID and verify duplicate rejection. Mock timeout/failure in
   tests; never spend money to demonstrate a failure.
7. Visit `/admin/assistant` as traveller and admin. Verify protected redirect versus
   aggregate usage, zero deterministic provider cost and absence of private text.
   Recheck partner application access and existing admin review protections.
8. Repeat key paths at 320, 390, 768, 1024 and 1440px, short landscape and a physical
   mobile keyboard. Check focus, readable errors, reduced motion, touch controls,
   offline/PWA behavior and hidden standalone Trip Planner navigation.

Verification commands: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`,
`npm run test:responsive`, `git diff --check`. Run heavy browser/build/lint checks
sequentially on this workstation. SQL tests execute every migration unchanged in
PGlite with simulated Supabase Auth roles; they do not certify remote PostgREST or
multi-replica concurrency. Official [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [database-function](https://supabase.com/docs/guides/database/functions) guidance
informed grants and invoker privileges.

## Complete file inventory

| File | Change |
| --- | --- |
| `README.md` | Links this runbook |
| `docs/ASSISTANT-PILOT.md` | Architecture, status, configuration, activation, rollback and demo evidence |
| `app/admin/assistant/page.tsx` | Protected aggregate reporting |
| `app/ai-guide/ai-guide-chat.tsx` | Request IDs, safe quota/auth errors, source links |
| `app/api/ai-guide/route.ts` | Pilot admission, bounded body deadlines, origin checks, telemetry |
| `app/api/saved/route.ts` | Approved-record saves, removal after record withdrawal, redacted action logs |
| `utils/ai-guide/config.ts` | Validated flags, limits and versioned pricing helper |
| `utils/ai-guide/contracts.ts` | Structured provenance/mode/usage fields |
| `utils/ai-guide/conversation.ts` | Natural unavailable responses and latest duration/interest refinement |
| `utils/ai-guide/gateway.ts` | Minimal consent-filtered context, retrieval, response validation |
| `utils/ai-guide/operations.ts` | Trusted-ingress pseudonyms, deterministic cost metadata and saved actions |
| `utils/ai-guide/pilot-store.ts` | Privileged quota/event writer after Auth validation |
| `utils/ai-guide/provider.ts` | Adapter registry, deadlines/cancellation and response validation |
| `utils/ai-guide/retrieval.ts` | Bounded Namibia retrieval and explicit source metadata |
| `utils/ai-guide/service.ts` | Removes illustrative price/rating amounts from chat |
| `utils/http.ts` | Abortable bounded JSON reader and origin/Host normalization repair |
| `utils/supabase/database.types.ts` | Handwritten schema/RPC types updated |
| `supabase/migrations/20260921153121_assistant_gateway_pilot.sql` | Additive content, telemetry, RLS, admission and summary |
| `tests/admin-responsive.pw.ts` | Detaches sign-in hydration before static admin fixture mounting |
| `tests/ai-guide-route.test.ts` | Origin/cache/request-ID regression |
| `tests/ai-guide-service.test.ts` | Asserts sample prices/ratings are absent |
| `tests/assistant-foundations.test.ts` | Latest word-duration refinement |
| `tests/assistant-gateway.test.ts` | Sensitive context exclusion |
| `tests/assistant-pilot.test.ts` | Configuration, pricing, selection, retrieval, schema and deadlines |
| `tests/assistant-pilot-store.test.ts` | Authentication, quota/idempotency and private operational records |
| `tests/assistant-pilot.pw.ts` | Five widths, landscape recovery, quota and pilot sign-in messages |
| `tests/database.test.ts` | Executed migration/RLS/quota/ownership/deletion tests |
| `tests/traveller-api.test.ts` | Server-only module test boundary for saved-action logging |

## Verification results — 21 September 2026

| Check | Executed result |
| --- | --- |
| Baseline unit suite | 125 passed, 12 files |
| Baseline TypeScript / ESLint / production build | Passed |
| Baseline browser suite | 44 passed, 3 admin-fixture failures; repaired below |
| Final complete unit/integration suite | 165 passed, 0 failed, 14 files |
| Focused PostgreSQL/RLS run | 26 passed; every migration executed unchanged |
| Final standalone TypeScript | `npx tsc --noEmit` passed, no diagnostics |
| ESLint | Full run passed; focused lint of final HTTP/test repairs also passed |
| Production build | Passed; Next.js 16.3.5 / Turbopack, including protected reporting |
| Final full Playwright suite | 53 passed, 0 failed/skipped/retried, 9 files, 2.7 minutes |
| Remote migration comparison | Four existing migrations match; only `20260921153121` is pending |
| Remote database lint | Passed, no schema errors; covers deployed schema only |
| Local Supabase lint | Unavailable: no PostgreSQL listener on 127.0.0.1:54322; new SQL verified through PGlite |
| Diff whitespace | `git diff --check` passed |

The baseline admin fixture was being replaced by late sign-in hydration. It now
uses an isolated same-origin document and the actual production CSS; existing
assertions and timeouts were preserved. Browser regression testing also exposed
Next's internal `localhost` URL normalization rejecting legitimate `127.0.0.1`
Origin headers. The HTTP guard now compares the actual Host and protocol, rejects
foreign origins, and ignores untrusted X-Forwarded-Host for authorization. A new
unit regression and the successful real browser POST journeys verify this repair.

Browser coverage includes 320/390/768/1024/1440px portrait, 640/768/1024px short
landscape, and the additional pilot-error landscape sweep through 1440px. Profile
save/skip/restore/edit/delete/consent, itinerary refinement/save/removal, saved
collection duplicate handling, navigation, sign-out, protected admin/partner
routes, translated errors, reduced motion, offline/PWA and simulated mobile
keyboard-height checks passed. Account mutations use synthetic fixtures; this is
not a claim of real-account preview acceptance. The new quota/fallback screenshots
at 320px and 1440px were visually inspected; all five are regenerated under ignored
`test-results/assistant-pilot-<width>.png`.

No remote migration, production environment change, paid provider call, GitHub push
or deployment was performed. The additive migration and runbook are ready for
review; live provider/data readiness and the operational/manual gates above remain
explicitly blocked or partial.
