# HifzHub — Project Rules

## Tech Stack
- React Native with Expo SDK 57 (managed workflow, New Architecture)
- TypeScript (strict mode)
- Expo Router v3 (file-based routing)
- Zustand v5 + MMKV (state management)
- Expo SQLite + Drizzle ORM (local database)
- react-native-track-player v4 (audio)
- react-i18next + expo-localization (i18n: Russian + Uzbek)
- ts-fsrs (spaced repetition)
- @shopify/flash-list (performant lists)
- react-native-reanimated + moti (animations)
- expo-haptics (tactile feedback)

## Commands
- Install deps: `npx expo install <package>`
- Run dev: `npx expo start --dev-client`
- Type check: `npx tsc --noEmit`
- Lint: `npx eslint .`

## Architecture
- Feature-based: `src/features/<feature>/`
- Screens: `app/` (Expo Router)
- Shared: `src/shared/components/`
- Database: `src/db/`
- i18n: `src/i18n/locales/` (ru.json, uz.json)
- Stores: `src/stores/`

## Coding Conventions
- Functional components only, no class components
- Named exports only (no default exports)
- PascalCase for components, camelCase for hooks/utils
- All components must have TypeScript props interface
- Use `@/` path alias for imports from `src/`
- Keep components under 150 lines
- Co-locate tests with source files

## RTL & Arabic
- Use marginStart/marginEnd, start/end — NEVER marginLeft/marginRight
- Arabic Quran text: KFGQPC Uthmanic Script HAFS font
- lineHeight for Quranic text: fontSize * 2.5
- Never split Arabic words across Text components

## i18n
- All user-facing strings use t('key') from react-i18next
- Never hardcode strings in components
- Keys: dot-separated (quran.surah, common.next)

## Database
- User tables include: id (UUID), updated_at, deleted_at, sync_status
- Client-generated UUIDs
- Soft deletes only

## Animations
- withSpring over withTiming for interactive elements
- useSharedValue, NEVER useState for animations
- AnimatedPressable instead of TouchableOpacity
- Skeleton shimmer instead of ActivityIndicator
- Stagger delay: index * 80ms
- Haptic feedback on every press action

## Git
- Conventional commits: feat:, fix:, chore:, docs:, refactor:
