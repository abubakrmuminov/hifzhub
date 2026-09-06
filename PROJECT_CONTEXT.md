# HifzHub — Полный контекст проекта (обновлён 03.09.2026)

> **ВНИМАНИЕ**: Этот файл создан для передачи контекста между сессиями. Читай его ПОЛНОСТЬЮ перед любой работой.

---

## 1. Обзор проекта

**HifzHub** — мобильное приложение для изучения, чтения и заучивания Корана.
- **Фреймворк**: React Native (Expo SDK 57, Expo Router)
- **Язык**: TypeScript 6.0
- **Платформа**: Android (основная), iOS (вторичная)
- **Языки интерфейса**: Русский (основной), Узбекский
- **Корень проекта**: `c:\Users\Intel\Desktop\learn quran\hifzhub`

---

## 2. Технический стек

### Зависимости
| Категория | Библиотека | Версия |
|---|---|---|
| UI Framework | React Native | 0.86.3 |
| Navigation | expo-router | ~57.0.18 |
| State | zustand + persist | ^5.0.15 |
| Database | drizzle-orm + expo-sqlite | ^0.45.2 / ~57.0.2 |
| Lists | @shopify/flash-list | 2.0.2 |
| Animation | react-native-reanimated | 4.5.1 |
| Audio | expo-audio | ~57.0.4 |
| Blur | expo-blur | ~57.0.2 |
| Gradients | expo-linear-gradient | ~57.0.1 |
| Haptics | expo-haptics | ~57.0.2 |
| Clipboard | expo-clipboard | ~57.0.1 |
| i18n | react-i18next + i18next | ^17.0.13 / ^26.4.1 |
| Spaced Rep | ts-fsrs | ^5.4.2 |
| Icons | @expo/vector-icons (Feather, Ionicons, MaterialCommunityIcons) | ^15.0.2 |
| SVG | react-native-svg | 15.15.4 |
| Bottom Sheet | @gorhom/bottom-sheet | ^5.2.14 |

### Структура проекта
```
hifzhub/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (ThemeProvider, DB init, fonts)
│   ├── settings.tsx              # Settings screen
│   ├── (tabs)/                   # Tab navigator
│   │   ├── _layout.tsx           # Tab bar (floating glass blur capsule)
│   │   ├── index.tsx             # Home screen
│   │   ├── learn.tsx             # Learn tab (заглушка)
│   │   ├── quran.tsx             # Quran surah list
│   │   ├── memorize.tsx          # Hifz tab (заглушка)
│   │   └── progress.tsx          # Progress tab (заглушка)
│   └── surah/
│       └── [id].tsx              # Surah reader (mushaf + translation modes)
├── src/
│   ├── db/
│   │   ├── schema.ts             # Drizzle ORM tables (surahs, ayahs, words, translations, bookmarks, progress, memorization)
│   │   ├── client.ts             # DB connection
│   │   ├── init.ts               # DB initialization + seed
│   │   ├── seed/                 # Seed data JSON files
│   │   └── migrations/           # SQL migrations
│   ├── stores/
│   │   ├── settingsStore.ts      # App settings (language, theme, reciter, fontSize, readingMode, lastRead)
│   │   ├── audioStore.ts         # Audio playback state (currentTrack, isPlaying, position, repeatCount, playbackRate)
│   │   ├── bookmarkStore.ts      # Ayah bookmarks (toggleBookmark, isBookmarked) — persisted in AsyncStorage
│   │   ├── downloadStore.ts      # Download manager state
│   │   └── index.ts              # Barrel exports
│   ├── features/
│   │   ├── quran/
│   │   │   ├── components/
│   │   │   │   ├── SurahList.tsx          # Searchable surah list with FlashList
│   │   │   │   ├── SurahListItem.tsx      # Individual surah card
│   │   │   │   ├── SurahHeader.tsx        # Big green gradient header card inside reader
│   │   │   │   ├── ReadingModeToggle.tsx  # Mushaf / Translation toggle
│   │   │   │   ├── MushafView.tsx         # Continuous Arabic text page with ayah selection/highlight
│   │   │   │   ├── AyahText.tsx           # Single ayah display
│   │   │   │   ├── TranslationText.tsx    # Translation display
│   │   │   │   ├── FloatingAudioPlayer.tsx # Surah-level floating player with controls
│   │   │   │   ├── PageDivider.tsx        # Page number divider between mushaf pages
│   │   │   │   └── AyahActionBar.tsx      # Contextual action bar (Copy, Bookmark, Play) for selected ayah
│   │   │   ├── hooks/
│   │   │   │   ├── useSurahs.ts           # Fetch surahs from DB
│   │   │   │   └── useAyahs.ts            # Fetch ayahs + translations from DB
│   │   │   ├── utils/
│   │   │   │   └── quranUtils.ts          # getSurahName, toArabicDigits, etc.
│   │   │   ├── data/
│   │   │   │   └── surahsData.ts          # Static fallback surah metadata
│   │   │   └── index.ts                   # Barrel exports
│   │   ├── audio/
│   │   │   ├── components/
│   │   │   │   ├── GlobalMiniPlayer.tsx   # Floating mini player above tab bar (with close animation)
│   │   │   │   ├── AudioPlayer.tsx        # Full audio player controls
│   │   │   │   ├── DownloadManager.tsx    # Audio download UI
│   │   │   │   └── ReciterPicker.tsx      # Reciter selection
│   │   │   ├── hooks/
│   │   │   │   └── useAudioPlayer.ts      # Audio playback hook
│   │   │   ├── services/
│   │   │   │   └── trackPlayer.ts         # playAyah, playSurah, pauseAudio, stopAudio, seekTo, etc.
│   │   │   └── index.ts                   # Barrel exports (playAyah, stopAudio, GlobalMiniPlayer, etc.)
│   │   ├── home/
│   │   │   └── components/
│   │   │       ├── HomeHeader.tsx          # App header with greeting + settings gear
│   │   │       ├── HomeStatsRow.tsx        # Daily goal + streak stats
│   │   │       ├── HomeProgressCard.tsx    # "Continue reading" card (linked to lastRead)
│   │   │       ├── HomeTodayTasks.tsx      # Daily tasks checklist
│   │   │       ├── HomeAyahOfTheDay.tsx    # Inspirational ayah card
│   │   │       └── HomeMiniAudioPlayer.tsx # (deprecated, replaced by HomeAyahOfTheDay)
│   │   ├── settings/                      # Settings feature
│   │   ├── alphabet/                      # (заглушка — Phase 2)
│   │   ├── memorization/                  # (заглушка — Phase 3, FSRS)
│   │   ├── progress/                      # (заглушка — Phase 4)
│   │   └── quiz/                          # (заглушка — Phase 5)
│   ├── shared/
│   │   ├── components/
│   │   │   ├── GlassView.tsx              # Glassmorphic container (BlurView + LinearGradient)
│   │   │   ├── AnimatedPressable.tsx       # Reanimated pressable with scale + haptics
│   │   │   ├── ProgressRing.tsx           # Animated SVG circular progress
│   │   │   ├── Skeleton.tsx               # Loading skeleton components
│   │   │   └── index.ts
│   │   ├── theme/
│   │   │   ├── index.ts                   # useTheme hook (returns isDark, colors, spacing, radius, shadows, fontFamilies)
│   │   │   ├── colors.ts                  # Light/dark theme colors
│   │   │   ├── spacing.ts                 # Spacing constants
│   │   │   ├── radius.ts                  # Border radius constants
│   │   │   ├── shadows.ts                 # Shadow presets
│   │   │   └── typography.ts              # Font families, sizes, getQuranLineHeight
│   │   ├── constants/
│   │   ├── hooks/
│   │   └── utils/
│   └── i18n/
│       ├── index.ts                       # i18next config
│       └── locales/
│           ├── ru.json                    # Russian translations
│           └── uz.json                    # Uzbek translations
├── assets/                                # Fonts, images
└── package.json
```

---

## 3. Дизайн-система

### Цветовая палитра
- **Primary (Emerald)**: `#0D6B4E` (dark: `#0A5A3E`, light: `#17B07A`)
- **Secondary (Gold)**: `#D4A745` (dark: `#B38B30`, light: `#EAC55C`)
- **Background**: Light `#F5F7F6` / Dark `#0F0F1A`
- **Surface**: Light `#FFFFFF` / Dark `#1A1A2E`
- **Text**: Light `#1A1A2E` / Dark `#F5F7F6`

### Дизайн-принципы (КРИТИЧЕСКИ ВАЖНО!)
1. **НЕТ серым границам и edges** — пользователь их ненавидит. В светлой теме: `borderWidth: 0`, `elevation: 0`. В тёмной: тонкий `rgba(255,255,255,0.08–0.16)` контур.
2. **Glassmorphism** — все плавающие элементы используют `BlurView` + `LinearGradient` + specular sheen.
3. **Haptics** — тактильная обратная связь на все интерактивные элементы (expo-haptics).
4. **Reanimated анимации** — все переходы через `withTiming`, `withSpring`, `interpolate`.
5. **RTL Arabic** — арабский текст: `textAlign: 'right'`, `writingDirection: 'rtl'`.

---

## 4. Что уже реализовано (полностью работает)

### 4.1 Главный экран (`app/(tabs)/index.tsx`)
- Шапка с приветствием и кнопкой настроек
- Карточка статистики (дневная цель + серия дней)
- Карточка «Продолжить чтение» (связана с `lastReadSurahId`)
- Список дневных задач (чекбоксы)
- «Аят дня» — вдохновляющая карточка с аятом
- `overScrollMode="never"` для устранения белого свечения Android

### 4.2 Экран Корана (`app/(tabs)/quran.tsx`)
- Полный список 114 сур с поиском
- Зелёный градиентный заголовок с каллиграфией
- Строка поиска в стеклянном контейнере
- `FlashList` с увеличенным нижним отступом для плавающего таб-бара

### 4.3 Экран чтения суры (`app/surah/[id].tsx`)
- **Режим Мусхаф**: Непрерывный арабский текст с разделителями страниц
  - Long-press на аят → золотая подсветка + haptic feedback + AyahActionBar
  - AyahActionBar: Копировать (clipboard), Сохранить (bookmark), Слушать (play), Закрыть
- **Режим перевода**: Карточки с арабским текстом + перевод (ru/uz)
- **Переключатель режимов** (ReadingModeToggle)
- **Плавающая навигационная панель сверху**:
  - Кнопка «Назад» в стеклянной капсуле
  - Центральное название суры (появляется только при скролле вверх, когда зелёная карточка скрыта, и НЕ мерцает при скролле вниз)
  - Скрывается при скролле вниз, появляется при скролле вверх
- **Плавающий аудиоплеер** снизу (пауза, повтор аята, скорость воспроизведения, прогресс-бар)
- `overScrollMode="never"` на обоих FlashList

### 4.4 Аудиосистема
- `expo-audio` для воспроизведения (API: api.quran.com)
- `playAyah(surahId, ayahNumber, reciter)` и `playSurah(surahId, reciter)`
- Пауза/возобновление, повтор аята (1x, 2x, 3x, ∞), скорость (0.75x–2.0x)
- `GlobalMiniPlayer` — всплывающий мини-плеер над таб-баром с анимацией закрытия (slide-down + fade)
- `FloatingAudioPlayer` — детальный плеер внутри экрана суры с кнопкой закрытия
- `stopAudio()` очищает `currentTrack: null`, `isPlaying: false`, `playbackPosition: 0`
- Bottom position GlobalMiniPlayer: `insets.bottom + 76` (выше плавающего таб-бара)

### 4.5 Нижний таб-бар (`app/(tabs)/_layout.tsx`) — FLOATING GLASS CAPSULE
- **Плавающая капсула**: `borderRadius: 32`, `height: 64`, `left: 16`, `right: 16`, `bottom: insets.bottom + 6`
- **Настоящее размытие на Android**: `BlurTargetView` оборачивает весь навигатор, `BlurView` использует `blurMethod="dimezisBlurView"` + `blurTarget={blurTargetRef}` для реального нативного Gaussian blur
- **Frosted glass diffusion**: `LinearGradient` с `rgba(255, 255, 255, 0.68)` → `rgba(242, 248, 244, 0.52)` — матовое светорассеивающее стекло
- **Specular sheen**: градиентный блик по верху капсулы (14px)
- **Стеклянная фаска**: `borderWidth: 1.2`, `borderColor: rgba(255, 255, 255, 0.75)`
- **Тень**: `shadowColor: #000`, `shadowRadius: 18`, `shadowOpacity: 0.08`
- **Локализованные подписи**: берутся из `i18n` (`t('tabs.home')`, и т.д.)
- **Акцент иконок**: активная иконка увеличивается на 1px

### 4.6 Закладки
- `bookmarkStore.ts` — Zustand persisted store в AsyncStorage
- `toggleBookmark(surahId, ayahId)`, `isBookmarked(surahId, ayahId)`
- Используется в `AyahActionBar` с визуальным переключением иконки

### 4.7 Настройки (`app/settings.tsx`)
- Выбор языка (ru/uz)
- Выбор темы (light/dark/system)
- Размер шрифта Корана
- Показать/скрыть перевод
- Показать/скрыть таджвид

### 4.8 Shared компоненты
- **GlassView**: Glassmorphic контейнер (BlurView + LinearGradient + specular rim). В светлой теме `borderWidth: 0`, `elevation: 0`.
- **AnimatedPressable**: Reanimated pressable с scale-анимацией + haptics + `hitSlop`
- **ProgressRing**: Анимированный SVG кольцевой прогресс
- **Skeleton**: Shimmer-скелетоны для загрузки (AyahSkeleton, SurahSkeleton)

---

## 5. Известные ограничения и баги

1. **expo-audio `playbackRate`**: Свойство `playbackRate` у объекта AudioPlayer — read-only getter. Нельзя просто присвоить. Используем try-catch в `setPlaybackRate`. На некоторых устройствах скорость не меняется.
2. **Background audio**: `expo-audio` требует `enableBackgroundPlayback: true` в app.json config plugin. Без этого lock screen controls и фоновое воспроизведение не работают. Сейчас выдаёт ошибку на этапе активации.
3. **Заглушки**: Экраны Learn, Memorize, Progress — пустые заглушки.
4. **SafeAreaView deprecation warning**: Используем `react-native-safe-area-context` вместо встроенного.

---

## 6. Пользовательские предпочтения (ЗАПОМНИ!)

1. **НЕНАВИДИТ серые края/границы** — никогда не ставь `borderWidth` в светлой теме (кроме стеклянных элементов с белым `rgba`). Никогда не используй `elevation` на Android для glassmorphic элементов.
2. **Glassmorphism** — все плавающие элементы должны быть стеклянными с реальным размытием.
3. **Анимации** — всё должно быть плавным и красивым. Никаких резких появлений/исчезновений.
4. **Язык общения** — русский.
5. **Название суры в шапке** — появляется ТОЛЬКО при скролле ВВЕРХ, когда зелёная карточка ушла. При скролле ВНИЗ не вспыхивает.

---

## 7. Архитектура данных

### DB Schema (Drizzle ORM + SQLite)
```
surahs: id, nameArabic, nameTranslation (JSON), revelationType, ayahCount, juzStart, pageStart
ayahs: id, surahId, ayahNumber, textUthmani, textTajweed, juz, hizb, page
words: id, ayahId, position, textArabic, transliteration, translation (JSON)
translations: id, ayahId, language, translator, text
bookmarks: id (UUID), ayahId, note, createdAt, updatedAt
progress: id, surahId, ayahId, action, timestamp, duration
memorization: id, surahId, ayahId, stability, difficulty, elapsedDays, scheduledDays, reps, lapses, state, due, lastReview
```

### Stores (Zustand)
- `settingsStore` — язык, тема, чтец, размер шрифта, режим чтения, lastRead
- `audioStore` — currentTrack, isPlaying, playbackPosition, repeatCount, playbackRate
- `bookmarkStore` — bookmarks Map, toggleBookmark, isBookmarked
- `downloadStore` — downloads, progress, addDownload, updateProgress

---

## 8. API

### Quran Text
- **Source**: Локальная SQLite БД (seeded из JSON при первом запуске)
- **Fallback**: `SURAHS_DATA` в `src/features/quran/data/surahsData.ts`

### Audio
- **API**: `https://api.quran.com/api/v4/recitations/{reciterId}/by_ayah/{surahId}:{ayahNumber}`
- **CDN**: `https://verses.quran.com/{audioUrl}`
- **Рекомендуемый чтец**: `ar.alafasy` (Мишари Рашид аль-Афаси)

---

## 9. Что нужно делать дальше (Roadmap)

### Phase 2 — Алфавит (`src/features/alphabet/`)
- Интерактивное изучение арабских букв
- Звуковое произношение каждой буквы
- Практика написания

### Phase 3 — Хифз / Заучивание (`src/features/memorization/`)
- FSRS алгоритм (ts-fsrs уже установлен)
- Режим запоминания с подсказками
- Отслеживание прогресса заучивания

### Phase 4 — Прогресс (`src/features/progress/`)
- Тепловая карта активности (heatmap)
- Статистика чтения
- Гамификация (достижения, ачивки)

### Phase 5 — Тесты (`src/features/quiz/`)
- Викторины по аятам
- Тест на узнавание суры
- Тест по таджвиду

---

## 10. Команды для разработки

```bash
# Запуск dev-сервера
cd "c:\Users\Intel\Desktop\learn quran\hifzhub"
npx expo start

# TypeScript проверка (ВСЕГДА запускай после изменений!)
npx tsc --noEmit

# Установка зависимостей
npx expo install <package-name>

# Перезагрузка приложения
# Нажми 'r' в терминале Expo
```

---

## 11. Важные файлы для быстрого доступа

| Файл | Описание |
|---|---|
| `app/(tabs)/_layout.tsx` | Плавающий стеклянный таб-бар с BlurTargetView |
| `app/surah/[id].tsx` | Экран чтения суры (mushaf + translation) |
| `app/(tabs)/index.tsx` | Главный экран |
| `src/features/quran/components/MushafView.tsx` | Отображение непрерывного арабского текста с выделением аятов |
| `src/features/quran/components/AyahActionBar.tsx` | Контекстное меню аята (Копировать, Сохранить, Слушать) |
| `src/features/quran/components/FloatingAudioPlayer.tsx` | Плеер внутри экрана суры |
| `src/features/audio/components/GlobalMiniPlayer.tsx` | Глобальный мини-плеер |
| `src/features/audio/services/trackPlayer.ts` | Аудио-сервис (playAyah, stopAudio, etc.) |
| `src/shared/components/GlassView.tsx` | Glassmorphic контейнер |
| `src/shared/theme/index.ts` | Система тем (useTheme hook) |
| `src/stores/settingsStore.ts` | Настройки приложения |
| `src/stores/audioStore.ts` | Состояние аудио |
| `src/stores/bookmarkStore.ts` | Закладки |
| `src/i18n/locales/ru.json` | Русская локализация |

---

*Последнее обновление: 03.09.2026, 23:25*
*TypeScript статус: 0 ошибок (npx tsc --noEmit)*
