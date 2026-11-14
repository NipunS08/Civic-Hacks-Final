# Mobile implementation verification log

> [Documentation index](../README.md)

Date: November 13–14, 2026 (America/Toronto / UTC). Working tree initially clean. Node 24.22.3, npm workspaces, existing Next.js website at port 3000. No account or privileged credentials used. No app publishing, database writes, ingestion or mail sends performed.

## Commands and results

| Command / action | Expected | Observed | Result |
| --- | --- | --- | --- |
| Pre-implementation `npm test` | Existing tests preserved | 69 passed, 0 failed | Pass |
| `npm install --workspace @civiclens/mobile --no-audit --no-fund` | Compatible dependencies in existing lockfile | Expo 58 / RN 0.88 installed; no existing website package version changed | Pass; initial npm workspace warning did not prevent installed-package verification |
| `npm run mobile:typecheck` | Native TS source compiles | Pass after correcting JSX and native ref/color types | Pass |
| `npm exec --workspace @civiclens/mobile -- expo install --check` | SDK-compatible versions | Dependencies up to date after installing mobile-only TypeScript ~6.0.3 | Pass |
| `npm test` | Existing plus mobile regressions | 73 passed, 0 failed, 0 skipped | Pass |
| `npm run lint` | No errors | Exit 0; native asset requires/labels scoped separately from DOM image rules | Pass |
| `npx tsc --noEmit --incremental false` | Website/shared types compile | Exit 0 during implementation; mobile compiler runs separately | Pass |
| `npm run build` | Existing website still builds; API emitted | Exit 0; website routes retained, two public mobile route handlers added | Pass |
| `npm run mobile:export` | Expo web bundle compiles | Exported web assets and index into `apps/mobile/dist` | Pass |
| `npm run export:native --workspace @civiclens/mobile` | iOS + Android bundles compile | Exported Hermes bundles for both native targets; final output is `dist-native`, separate from web | Pass; not a native installation |
| `CI=1 BROWSER=none EXPO_NO_TELEMETRY=1 npm run web --workspace @civiclens/mobile -- --port 8081 --localhost` | Metro/web dev server starts | Waiting on `http://localhost:8081`; restarted without CI for a current interactive preview | Pass for startup; browser interactions not verified |
| `xcrun simctl list devices available` | Detect simulator | simctl unavailable; no Xcode simulator toolchain | Blocked on-device verification |
| Native Chrome preview actions | Exercise UI | Browser automation host unavailable; native window actions interrupted by active-window changes | Not verified; no interaction/screenshot pass claimed |

The first compilation surfaced JSX/type errors; these were corrected before passing checks. An initial Expo compatibility warning identified TypeScript 5 in mobile; mobile now has the SDK-compatible TypeScript 6 dependency without replacing the web compiler. No heavy browser testing package was installed to work around unavailable computer control.

## Live API checks

Read-only requests against `http://localhost:3000`:

| Endpoint | Response / observation |
| --- | --- |
| `/api/mobile/items?city=ottawa` | HTTP 200, API version 1, 135 real records |
| `/api/mobile/items?city=kingston` | HTTP 200, 65 real records |
| `/api/mobile/items/OTT-2026-09-09-0576ac9f-68` | HTTP 200, one record, Eastern Bridge |
| `/api/mobile/items?city=invalid` | HTTP 400 |
| `/api/mobile/items/OTT-no-such-record` | HTTP 404 |

These are service checks, not proof of rendered screens or a completed native resident journey. All eight city IDs and adapter paths are retained; the current run did not re-fetch every city.

## Municipal source checks

1. **1622 Beckett's Creek**, Ottawa Panel 3, November 17, 2026. The API record's title/date and purpose agree with the [official agenda](https://pub-ottawa.escribemeetings.com/Meeting.aspx?Id=1d2d50c0-6ecb-4a4a-a9ce-08b5806e14bb&Agenda=Agenda&lang=English&Item=9), retrieved HTTP 200. The official purpose describes subdivision into three parcels. The app does not assert an open submission window; the agenda's linked notice PDF and cutoff were not verified.
2. **Eastern Bridge Project**, Ottawa City Council, September 9, 2026. API source and carried 23–2 tally agree with the [official minutes](https://pub-ottawa.escribemeetings.com/Meeting.aspx?Id=0576ac9f-74e8-4986-b8f8-9c96b26f6e67&Agenda=PostMinutes&lang=English&Item=68), retrieved HTTP 200. This is the recorded consultation-related motion, not evidence of approval to construct the bridge. Work/completion dates remain unknown. No current participation opportunity was independently verified.

Local raw evidence: `/private/tmp/civiclens-mobile-evidence/items.json` and the two item-number HTML files in that directory. Existing audit source checks are additional context, not counted here as new native-app verification.

## Test coverage

`tests/mobile.test.mjs` exercises versioned API parsing, invalid nested votes/date/source data, unsafe URL rejection, preference validation/JSON round-trip, combined filters and contextual guidance. It checks that mobile and web share stage semantics and that missing participation evidence does not produce open-window claims. Existing website tests cover date handling, parsed votes, timelines and explicit participation evidence.

**Persistence limitation:** AsyncStorage read/write/clear are wired into the resident provider, with queued writes and visible errors. The JSON round-trip test is not an AsyncStorage/device integration test. Saving, switching tabs, reload persistence, corrupt-storage recovery and offline saved-item refresh must still be exercised in the actual UI.

**UI limitation:** Onboarding/skip, search, filters, detail navigation, source linking, modal focus restoration, saved items and settings are implemented but not end-to-end browser/device-verified in this pass. No mock data replaces unavailable API calls. There is no device screenshot artifact. Do not describe compilation as an iPhone/Android runtime pass.

## Device checklist before a demo

- Start API with LAN binding and Expo as documented; verify phone can reach the API URL before scanning QR.
- Run onboarding and skip independently; change city/topic/time preferences; verify the next feed.
- Search/open a real item; check vote scope and uncertainty; open its official source.
- Save/remove/reload; then disconnect network and reopen a saved snapshot. Confirm stale-data warning and retry.
- Exercise Civi's four choices in and out of item context; test dismissal and accessibility focus.
- Check small phone widths, tablet, large fonts, light/dark appearance, VoiceOver/TalkBack and touch targets.
- Verify 60-second timeout, unavailable record, empty filters and storage-denied paths.

## Logs and scope

Local logs: `/private/tmp/civiclens-mobile-baseline.log`, `civiclens-mobile-tests.log`, `civiclens-mobile-types.log`, `civiclens-mobile-lint.log`, `civiclens-mobile-web-types.log`, `civiclens-mobile-next-build.log`, `civiclens-mobile-web-export.log`, `civiclens-mobile-native-export.log`, `civiclens-mobile-install.log`.

Only new mobile/shared/API code and required workspace/compiler/lint integration were added. The root website was not migrated or redesigned. Generated outputs and local Expo/native state are gitignored. Existing tracked npm hidden metadata was restored to avoid generated churn. No nested Git repository or production secrets were added. Source attribution and AI assistance are documented in the mobile README.
