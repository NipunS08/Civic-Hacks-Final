# CivicLens local setup

> [Documentation index](../README.md)

Run all commands below from the **repository root**, the directory containing `package.json`. The public website and mobile app work without an account, Supabase or mail credentials.

## Requirements

Use Node 24.3+ LTS for the combined npm workspace (tested: Node 24.22.3). The website, `apps/mobile` and `packages/shared` share one root `package-lock.json`.

## Website

```sh
# After cloning this repository:
cd CIVIC-Hacks
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The [public feed](http://localhost:3000/feed) fetches official municipal data and caches responses in memory. The initial fetch can be slow; see [source limitations](../quality/LIMITATIONS.md). No `.env.local` is needed for public browsing.

After pulling changes that update `package-lock.json`, run `npm ci` again. Git does not contain installed `node_modules`, Next.js output, Expo output or TypeScript build caches; the install and run commands create them locally.

## Mobile

Keep the website running in one terminal, then run this in another:

```sh
npm run mobile
# Explicit browser preview:
npm run web --workspace @civiclens/mobile -- --port 8081
```

For a phone, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env.local` to the website's LAN address or a deployed HTTPS URL. Follow the [mobile README](../../apps/mobile/README.md) for device requirements, Expo compatibility and the complete walkthrough. A phone's `localhost` points to the phone.

## Verification

```sh
npm test
npm run lint
npx tsc --noEmit --incremental false
npm run build
npm run mobile:typecheck
```

`npm run check-links` checks official external URLs and requires network access. Source services can block or time out; consult [adapter notes](../architecture/ADAPTERS.md) before treating a failure as an application defect.

`npm run doctor` is a legacy backend check: it requires Supabase variables and connectivity. Missing Supabase checks are expected for the account-free setup; they do not prevent public browsing. See [mobile verification](../quality/mobile-testing.md) for the distinction between bundle checks and device interactions.

## Optional legacy Supabase integration

The source retains legacy account routes and optional database ingestion. Public navigation does not expose login or signup. Configure this section only if deliberately developing those features; it is not a prerequisite for the website or mobile app.

1. Create a Supabase project and obtain its project URL and appropriate API keys from its dashboard.
2. Copy the placeholder template at the repository root:

   ```sh
   cp .env.example .env.local
   ```

3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the legacy browser/auth client. Set `SUPABASE_SERVICE_ROLE_KEY` only for server-side administrative ingestion. Never put a privileged key in a `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variable. Keep `.env.local` untracked.
4. Review and apply `src/lib/db/schema.sql` in a development Supabase project before exercising database writes. Do not apply it blindly to an existing production database.
5. Set `NEXT_PUBLIC_APP_URL` to the website origin and configure the corresponding auth callback URLs if testing legacy authentication.
6. Run `npm run doctor` to check this optional integration. The separate `npm run ingest` command writes Toronto records into the configured database; public browsing continues to use the official source adapters.

Production ingestion requires `CRON_SECRET` for `/api/ingest`. Optional ingestion does not send notifications.

## Alerts and deployment

Email alerts and daily digests are unavailable. Mail credentials do not activate delivery. The dispatcher, matching, consent handling, durable delivery records and scheduling still require implementation and verification; see the [repair report](../quality/CIVICLENS_FIX_REPORT.md).

Deploy the Next.js website from the repository root using its existing build/start commands. Set only environment variables needed by the features you intend to enable. Point the mobile app at the deployed HTTPS origin for use outside the development LAN. App Store publishing and EAS configuration are not part of this setup.
