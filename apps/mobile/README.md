# CivicLens mobile

Expo / React Native resident app in the same repository as the Next.js website. No account or Supabase setup is required. This is an implemented mobile MVP with compiled iOS/Android bundles; device interaction verification is pending.

## Requirements

Use Node 24.3+ LTS (tested: 24.22.3) or another version accepted by Expo's engine declaration. npm installs all workspaces from the **repository root**. Mobile has its own TypeScript 6 compiler; the website retains TypeScript 5. Xcode is required for an iOS Simulator; Android Studio is required for a local Android emulator.

## Run on this computer

```sh
# Terminal 1, repository root
npm install
npm run dev

# Terminal 2, repository root
npm run mobile
# Press w for the browser preview, i for a configured iOS Simulator,
# or scan the QR code with a compatible Expo Go app.
```

For an explicit browser preview:

```sh
npm run web --workspace @civiclens/mobile -- --port 8081
```

## Run on an iPhone or Android phone

1. Put phone and computer on the same trusted Wi-Fi network.
2. Find the computer's LAN IP in network settings.
3. Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and set:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
```

Replace the sample IP. **localhost on a phone means the phone, not your computer.** Use a deployed HTTPS website URL when outside your LAN. This value is public; never add service-role, database or mail secrets to EXPO_PUBLIC variables.

4. Run the website with LAN binding if needed:

```sh
npm run dev -- --hostname 0.0.0.0
npm run mobile
```

5. Scan the Expo QR code. Allow the computer firewall/local-network access only as needed for your own devices. Restart Expo after changing its `.env.local` file. To verify API connectivity, open `http://YOUR_COMPUTER_IP:3000/api/mobile/items?city=ottawa` on the phone first.

Use Expo Go **compatible with SDK 58** for the quickest development run. A development build is a compiled native app with its native dependencies; use one if your Expo Go version does not support this SDK or when adding custom native modules. With the appropriate local native toolchain installed, `npm exec --workspace @civiclens/mobile -- expo run:ios` or `expo run:android` can build locally. No App Store publishing or EAS project has been configured.

## Resident walkthrough

1. Choose Ottawa, any topics and Upcoming + past, or skip onboarding.
2. Search **Eastern Bridge** in Discover. Open the council record dated September 9, 2026.
3. Inspect its recorded 23–2 motion, exact motion wording and official source. Passing that consultation motion does not establish bridge construction approval.
4. Save it; open Saved; reload the app and check persistence on your device.
5. Open Civi from the item and ask what it means, personal impacts, participation or sources. Responses are predetermined, use the current item and retain uncertainty.
6. Check an upcoming property request, e.g. **1622 Beckett's Creek**, November 17. The agenda describes three parcels; the input deadline is unverified. Use the official page to check the window.

Live feeds change and old records can leave the limited source window. Saved copies are explicitly snapshots. If a live detail refresh fails, an existing snapshot remains visible with an error/staleness notice. Unsaved unavailable records show a recoverable error. Saved items do not subscribe to update notifications.

## Features and limits

- Three-step, skippable preferences; eight cities; topics/time/body/title filters.
- Source-linked status, explanation, available impacts, votes, dates and illustrative delivery timeline.
- Open/closed/unknown input rules shared with the website; the current adapters supply no verified open-window metadata, so unknown is expected.
- Saved snapshots and preferences in AsyncStorage, capped at 100 saves; read/write failures are surfaced.
- Floating Civi and contextual bottom-sheet guidance; tabs for Discover, Saved, Civi and Settings.
- No login, location permission, background tracking, calendar write or push notification integration.
- Finite 60-second client timeout, explicit empty/error/retry states and cancellation on navigation.
- System light/dark appearance and font scaling; native accessibility labels. VoiceOver/TalkBack and a real device need verification.

## Checks

From repository root:

```sh
npm test
npm run lint
npx tsc --noEmit --incremental false
npm run build
npm run mobile:typecheck
npm run mobile:export
npm run export:native --workspace @civiclens/mobile
npm exec --workspace @civiclens/mobile -- expo install --check
```

See [testing evidence](../../docs/quality/mobile-testing.md) and [architecture](../../docs/architecture/mobile-architecture.md). Web preview export is a validation/preview artifact, not native device verification.

## Assets and assistance

Civi artwork is copied unchanged from the repository's supplied mascot (`public/civi.png`). The app icon rasterizes the existing original CivicLens SVG. Do not substitute official municipal logos. UI and code were authored with Codex assistance; live city records and deterministic explanations come from the existing adapters and helpers, not generated policy claims. Package versions are in the root lockfile and the architecture document.
