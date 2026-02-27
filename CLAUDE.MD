# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npx expo start` — start dev server (press `a` for Android, `i` for iOS, `w` for web)
- `npx expo lint` — run ESLint
- No test runner is configured.

## Architecture

Expo 54 / React Native 0.81 app using expo-router (file-based routing) with TypeScript and Reanimated for clean animations.

### Routing (`app/`)

- `app/(tabs)/` — Bottom tab screens: Home (`index.tsx`), Explore, Schedule, Profile
- `app/admin/` — Protected admin section (auth-gated via `_layout.tsx` redirect)
- `app/auth/login.tsx` — Login screen
- `app/details/` — Detail screens for mosque, event, school info

### State (`lib/stores/`)

Zustand stores, each fetching from a corresponding Supabase table:

- `mosquesStore` → `mosques` table
- `eventsStore` → `events_activities` table
- `islamicSchoolsStore` → `quran_schools` table
- `adhanStore` — prayer time calculations (uses `adhan` library + device location)
- `scheduleStore` — user schedule/alarms
- `authStore` — Supabase auth session, sign-in/out, mosque ownership

### Data

- **Supabase** (`lib/supabase.ts`) — all data comes from Supabase with RLS (public SELECT)
- `constants/mockData.ts` — TypeScript interfaces (`Mosque`, `Activity`, `IslamicSchool`)

### i18n (`lib/i18n/`)

Three languages: Arabic (`ar.json`), French (`fr.json`), English (`en.json`). Default language is Arabic. All user-facing strings must go in these JSON files and be accessed via `useTranslation()`. RTL is handled via `I18nManager`.

### Theming

- `constants/theme.ts` — `Colors` (light/dark), `Spacing`, `BorderRadius`, `Shadows`, `Fonts`
- `context/ThemeContext.tsx` — theme provider with `useTheme()` hook
- Always use theme tokens from `constants/theme.ts`; never hardcode colors

### Key Libraries

- `@shopify/flash-list` for performant lists
- `react-native-reanimated` for animations
- `@gorhom/bottom-sheet` for bottom sheets
- `expo-image` for images (not `<Image>` from react-native)
- `adhan` for prayer time calculations
- Path alias: `@/*` maps to project root

## Conventions

- Solve problems with maintainability in mind
- All user-facing text must be in `lib/i18n/*.json` files, never hardcoded
- Admin screens live under `app/admin/`; public screens under `app/(tabs)/` and `app/details/`
