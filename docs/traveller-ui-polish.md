# Traveller interface refinement

The restored blue/teal visual direction is retained. The dashboard now presents
one saved collection, a private profile entry point, and a clear Assistant action.
Repeated favourites, subscription placeholders, and competing overview cards have
been removed from its presentation. Historical saved trip notes still appear when
present; the standalone planner remains available at its existing route but is
not promoted in public navigation.

The presentation problems came from minimally structured saved-item markup,
duplicate collections on the dashboard, competing header breakpoints, and a
language control inserted only after hydration. Shared presentation primitives
replace the flat list; scoped overrides reconcile the traveller layouts without
changing the restored product direction.

## Shared presentation

- Primary navigation: Assistant, Explore, Profile. Stays and Activities are
  discoverable in Explore and the mobile menu; partner entry points stay secondary.
- Stable header dimensions, bounded account names, keyboard-operated account menu,
  and a scrollable mobile menu with focus containment and background scroll lock.
- The traveller language control renders in the initial page, without waiting
  for the legacy portal. Other existing header types retain their portal fallback.
- Shared cards, headings, icon treatments, buttons, notices, empty states, and
  loading placeholders live in the traveller components and scoped traveller CSS.
- Saved snapshots display only known bounded text, never identifiers as titles.
  Duplicate display records collapse by type and identifier. Removal requires a
  small inline confirmation; focus and status move to the remaining collection.
- Profile stages use a desktop step rail and mobile grid. Optional answers,
  editing, deletion, purpose-specific consent and food boundaries remain explicit.
  Saving feedback appears beside the form rather than below all consent choices.
- Home hero spacing, heading scale and text-gradient contrast are refined.
  The Assistant has a less oversized empty conversation area. Catalogue preview
  labels, disabled searches and all demo disclosures remain intact.

## Verification and fixture safety

Run the normal production build, then `npm run test:responsive`. Playwright owns
its local server on port 3100 and refuses to reuse an unrelated server.
`tests/fixtures/supabase-preload.mjs` is loaded only by that test server command.
It intercepts all Supabase HTTP calls in the test process, rejects writes, and
accepts only a clearly synthetic test identity. Browser API fixtures model
presentation states without changing remote records. No real credentials or
session data are included. Normal application start and build commands do not
load this fixture.
Browser tests also replace Unsplash requests with a clearly labelled SVG fixture.
The application still uses its existing illustrative images and fallback behavior;
UI checks no longer depend on a third-party image host or its cleanup timing.

The browser suite covers the original journeys plus saved collection states,
long content, removal focus, account menus, translation, reduced motion, and
320/390/768/1024/1440px portrait layouts and 640/768/1024 × 390px landscape.
Screenshots are written under the ignored `test-results/` directory.
On machines with limited memory, run build, lint, TypeScript and browser checks
sequentially. Overlapping those processes caused a cold admin redirect to exceed
its existing test deadline during verification; its assertion and timeout were
left unchanged.

## Preserved boundaries and manual acceptance

No API, migration, RLS, RPC, telemetry, service worker or production configuration
changes are needed. Catalogue content and Assistant responses remain demonstrative.
There is no booking, live availability, paid provider, or new sensitive data use.

Before release, use a controlled real account to confirm persistence and sign-in
on the intended environment. Also check actual iOS/Android keyboards and safe
areas, VoiceOver/TalkBack reading order, and translated copy with native speakers.
Browser fixtures establish UI behavior, not live Supabase acceptance or native
device certification. Profile and saved-item dynamic copy retains the existing
English-first behavior.

## File inventory

| File | Change |
| --- | --- |
| `app/components/site-navigation.tsx` | Streamlined links, account keyboard handling, mobile focus/scroll management, initial language control |
| `app/i18n/language-context.tsx` | Reusable language selector; portal fallback excludes headers that render it directly |
| `app/components/saved-recommendations.tsx` | Saved cards, collection states, confirmation, announcements and removal focus |
| `app/components/traveller-ui.tsx` | Shared icons, section headings, empty states and skeletons |
| `app/dashboard/dashboard-content.tsx` | Welcome/profile/saved hierarchy and preserved historical trip notes |
| `app/profile/profile-builder.tsx` | Stage, consent, status, loading, error and guest presentation |
| `app/explore/page.tsx` | Grouped catalogue navigation |
| `app/layout.tsx` | Loads scoped traveller styles |
| `app/traveller.css` | Shared visual system and responsive refinements |
| `utils/saved-recommendations.ts` | Safe bounded display fields and duplicate normalization |
| `playwright.config.ts` | Isolated test server with synthetic Supabase boundary |
| `tests/fixtures/traveller.mjs` | Synthetic account and content fixtures |
| `tests/fixtures/browser.ts` | Automatic deterministic third-party image boundary for browser tests |
| `tests/fixtures/supabase-preload.mjs` | Server-only test interception; remote writes rejected |
| `tests/saved-presentation.test.ts` | Display normalization regression coverage |
| `tests/traveller-polish.pw.ts` | Responsive, saved-state, accessibility and header coverage |
| `tests/navigation-hydration.pw.ts` | Initial language-control and duplicate-control checks |
| `tests/admin-responsive.pw.ts` | Uses shared external-image fixture; assertions unchanged |
| `tests/ai-guide-responsive.pw.ts` | Uses shared external-image fixture; assertions unchanged |
| `tests/mvp-navigation.pw.ts` | Uses shared external-image fixture; assertions unchanged |
| `tests/partner-responsive.pw.ts` | Uses shared external-image fixture; assertions unchanged |
| `tests/profile-assistant.pw.ts` | Shared image fixture and guest-state heading hierarchy check; existing assertions preserved |
| `tests/pwa-responsive.pw.ts` | Uses shared external-image fixture; assertions unchanged |
| `docs/traveller-ui-polish.md` | Design, fixture safety, inventory and manual acceptance notes |

## Verification results — 21 September 2026

| Check | Result |
| --- | --- |
| Full unit suite | 125 passed, 0 failed; 12 files, including existing database/RLS coverage |
| Full Playwright suite | 47 passed, 0 failed; 8 files; final run 4.1 minutes |
| TypeScript | Passed, no diagnostics |
| ESLint | Passed, no findings |
| Production build | Passed |
| Dependency audit | 0 vulnerabilities |
| Diff whitespace check | Passed |

Three unit tests and twelve browser tests were added. Existing assertions were
preserved; navigation hydration and guest heading checks were strengthened.
The final browser run passed in one invocation without retries or skipped tests.

| Viewport | Result |
| --- | --- |
| 320 × 844 | Passed; stacked cards, usable profile, compact header |
| 390 × 844 | Passed; stacked cards, readable forms and mobile menu |
| 768 × 900 | Passed; two-card grid and mobile navigation |
| 1024 × 900 | Passed; two-card grid and mobile navigation |
| 1440 × 900 | Passed; single-line desktop navigation and two-card grid |
| 640 × 390 | Passed; scrollable menu and reachable chat controls |
| 768 × 390 | Passed; scrollable menu and reachable chat controls |
| 1024 × 390 | Passed; scrollable menu and reachable chat controls |

The eight-viewport sweep covers Home, Dashboard, Profile, Assistant, Explore,
Stays and Activities: 56 route/viewport combinations. No horizontal overflow,
page/console errors or HTTP error responses occurred in these fixture-based
happy paths. Loading, failed, retry and signed-out cases are tested separately.

Keyboard focus, Escape, account arrow-key navigation, click-outside dismissal,
menu accessible names, form/error associations, live status announcements,
removal confirmation/focus, long names, and reduced motion were checked.
The new card text/action palette measures 4.81:1–6.88:1 against white. This is
focused verification, not a claim of full assistive-technology certification.

Nine required screenshots were captured and visually inspected for alignment,
spacing, hierarchy, wrapping, clipping, density and contrast. Local artifacts:

- `test-results/polish-home-1440.png`
- `test-results/polish-home-390.png`
- `test-results/polish-menu-390-844.png`
- `test-results/polish-dashboard-1440.png`
- `test-results/polish-dashboard-390.png`
- `test-results/polish-dashboard-empty.png`
- `test-results/polish-profile-1440.png`
- `test-results/polish-profile-390.png`
- `test-results/polish-ai-guide-390.png`

Landscape menu screenshots were also reviewed. An additional browser check
confirmed the new Explore links do not overlap the existing search-preview panel.
Screenshots are local ignored artifacts and are regenerated by the tests.

Authentication, profile/consent behavior, Assistant itinerary/save behavior,
partner/admin regressions, PWA and offline checks passed. Their server APIs,
ownership rules, RLS, RPC and telemetry implementation remain unchanged.
No remote records were created or left behind, no migrations were created or
applied, no paid integration was added, and no production configuration changed.
