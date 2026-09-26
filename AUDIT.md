# Production Readiness Audit

Audit date: 2026-09-26

## Scope and architecture

This repository is an Expo SDK 57 / React Native application for iOS, Android, and web. It is not a Next.js/Vercel website. It uses React Navigation (keep it as-is to preserve the existing screen flow), and `App.tsx` hydrates a local AsyncStorage store before rendering. `vercel.json` runs Expo's web export and rewrites client routes to `index.html`.

## Working foundations found

- `src/utils/qrGenerator.ts` uses the `qrcode` package to encode standards-compliant QR matrices; the earlier audit claim that it generated fake random patterns is stale. QR rendering can still be made harder to scan by rounded modules, gaps, or the center logo.
- `src/screens/ScannerScreen.tsx` uses `expo-camera`, requests camera permission, scans live QR codes, and attempts to open HTTP(S) payloads.
- `src/store/store.ts` persists state to AsyncStorage and `App.tsx` waits for hydration. Seed factory functions remain in the store but are not used to initialize state; normal installs start empty.
- `src/screens/QRCardDetailScreen.tsx` copies payload text and shares payload text through the OS share sheet. Its download/gallery actions are success-only alerts, not exports.
- `app.json` includes an Expo Camera permission plugin. No Android/iOS generated folders are present or needed.

## Fake, incomplete, or risky behavior

- `src/screens/TransferSessionScreen.tsx`: uses fixed sample files, synthetic peer connection, random progress/speed, and marks transfers complete without moving bytes. There is no supported Nearby Connections/Wi-Fi Direct transport.
- `src/screens/TranslationScreen.tsx`: capture is unavailable; there is no OCR or translation provider. Manual text save and QR creation do work locally.
- `src/screens/LinkVaultScreen.tsx`: its add action inserts a fixed URL rather than collecting user input. Saved links persist locally; copy and QR generation are real.
- `src/screens/MeetingScreen.tsx`: host flow creates a local record and QR invite, but join only displays a connecting alert; no meeting/signaling/media service exists. Host flow currently does not claim to start a real call.
- `src/screens/AIScreen.tsx`: sample conversation and keyword/canned responses are not an AI service.
- `src/screens/ProfileScreen.tsx`: identity, plan, verification, and stats are hardcoded. Identity QR Share and Download handlers are empty.
- `src/screens/QRCardDetailScreen.tsx`: scan simulation increments a local counter and falsely implies a third-party scan; gallery/download alerts do not export an image. QR card `encrypted`, `passwordProtected`, expiry, and one-time fields are metadata only and do not enforce security.
- `src/screens/SettingsScreen.tsx`: several settings and support/privacy rows are static or inert.
- `src/screens/HomeScreen.tsx`: file storage usage is based on store metadata and a hardcoded 50 GB cap; it is not device/cloud storage measurement.
- `src/screens/FileOrganizerScreen.tsx`: lists metadata rather than enumerating device storage; scan/clean/share actions are incomplete.
- `src/screens/AllQRCardsScreen.tsx`: search/sort work over local records; filter control is inert.
- `src/screens/QRTemplateGalleryScreen.tsx` is registered, but no in-app route leads to it. `src/components/IconBadge.tsx` appears unused.
- There is no Supabase client/auth integration, cloud upload flow, Google OAuth, translation API, or account isolation. This pass adds a schema/RLS/storage migration and `.env.example`, but the migration is not applied to a live project. AsyncStorage is device-local, not a secure cloud database.
- `app.json` configures camera permission but not gallery/media permissions. No credentials/secrets are present; a Supabase URL/key, Google OAuth setup, and server-side translation provider are required for those services.
- Native peer-to-peer file transport, encrypted transfer sessions, and parity across Android/iOS cannot be supplied by the current JS-only implementation. This needs native modules/development builds and device testing.

## Production constraints and security

- QR codes encode their raw payload. A QR containing a private URL/text is readable by anyone who scans it. Password/expiry/one-time options currently do not protect that payload.
- The app has no user identity or protected routes. Local persisted data is shared with whoever uses the device profile.
- No account backend, upload limit/MIME checks, secure signed URLs, network retry behavior, or external-service error handling exists.
- A reliable production build/device verification needs installed compatible dependencies and configured external services. Vercel only hosts the web export; it does not provide native mobile services.

## Recommended implementation order

1. Remove misleading success/simulation behavior and fix actionable routing/payload bugs.
2. Replace demo inputs with actual user input, local persistence, and OS share/clipboard/picker functions where existing dependencies support them.
3. Add Supabase auth, per-user tables/RLS, secure storage, and protected navigation after project credentials and OAuth redirect settings are supplied.
4. Add validated upload/export and real translation/OCR through configured providers.
5. Add native peer transfer only with a selected Android/iOS transport and physical-device verification.
6. Wire remaining settings, clean dead code, and verify web export, lint/typecheck, and native builds.

## Changes made in this pass

- Fixed `src/screens/CreateQRScreen.tsx` so the live preview QR encodes the same user content saved in the card; previously the preview encoded extra template/color/type characters and did not match the card.
- Fixed `src/screens/LinkVaultScreen.tsx` so Add opens a cross-platform input, validates and normalizes HTTP(S) URLs, categorizes common services from their host, and persists the user's actual URL instead of inserting a fixed sample.
- Added `supabase/migrations/202609260001_initial_schema.sql` with the user, QR, link, transfer, and translation tables, per-user RLS, a private `user-files` bucket, MIME allowlist, 100 MiB size limit, and per-user storage object policies. Added `.env.example` and ignore rules for local environment files.
- TypeScript checking passes and `expo export --platform web` completes successfully. `expo lint` could not run: there is no ESLint config, and Expo's attempted setup needs network access unavailable in this workspace. Device testing and external service integrations remain unverified because this workspace has no configured providers or native transport.

The migration has not been applied against a Supabase project, so its behavior has not been verified against a live database.

## Implementation update (2026-09-26)

This section supersedes earlier status statements above where they conflict.

- Supabase auth/session gating and user-scoped cloud repositories now exist. QR cards, saved links, translations, and completed transfers load/save through the configured client. Storage uploads and file metadata are implemented in `src/services/fileUploads.ts`.
- QR creation persists history; cards load, search, sort, favorite, delete, export as SVG/PNG, and share. Link Vault saves categorized links and Microlink previews. Link preview metadata migrations are in `supabase/migrations/202609260002_link_preview_metadata.sql`.
- Offline transfer now uses device file selection, a token QR, Nearby Connections discovery, and streamed text chunks for file bytes. The native config is prepared through Expo plugins and permissions; it requires a development build and physical-device verification. The Nearby library only documents Android-to-Android or iOS-to-iOS transfer, not cross-platform peers.
- Picture translation now captures/selects images, runs native ML Kit OCR, calls the translation endpoint, supports editing, saves translations, and creates QR cards. ML Kit requires a development build; iOS target is set to 16.4.
- `npm run type-check`, `npm run build`, Expo config introspection, and QR encoder output checks pass. Browser runtime renders the sign-in screen and the signup toggle. Live database, auth, storage, OCR, media-library, and peer-transfer flows remain unverified because Supabase is unconfigured and no native development build/two-device runtime is available. `npm run lint` remains blocked by the absent ESLint config and network-restricted auto-setup.
