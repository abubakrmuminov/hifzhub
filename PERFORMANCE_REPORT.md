# HifzHub — Отчёт по фризам UI и план исправления

**Дата:** 10.09.2026  
**Ветка:** `arena/01a0897f-hifzhub`  
**Статус:** фазы 0–3 реализованы (10.09.2026). `npx tsc --noEmit` — без ошибок.

---

## 1. Симптомы (как воспроизводится)

| # | Что видит пользователь | Когда |
|---|------------------------|--------|
| A | Экран «тупит» 0.5–2 с при переходе | Открытие суры, смена таба, вход в урок/хифз |
| B | Быстрый свайп страниц: пауза 1–3 с, потом резкий скачок на 1 страницу | Режим Мусхаф, листание пальцем |
| C | Медленный свайп работает нормально | Режим Мусхаф |
| D | После перелистывания текст на новой странице резко «включается» и иногда «выключается» | Режим Мусхаф |

Это не «слабый телефон». Это синхронная блокировка JS-потока + подмена контента PagerView посреди жеста.

---

## 2. Корневые причины

### 2.1 Главный баг: фейковая виртуализация пейджера

Файл: `src/features/quran/components/MushafRollingPager.tsx`

В `app/surah/[id].tsx` комментарий обещает:

> Rolling 3-slot pager: constant native view count regardless of surah length

Реальность — **не 3 слота**, а **все страницы суры**:

```tsx
{Array.from({ length: pageCount }, (_, index) => {
  const isRendered = renderedPages.has(index);
  return (
    <View key={`mushaf-page-slot-${index}`}>
      {isRendered ? renderPage(index) : placeholderNode}
    </View>
  );
})}
```

- Для Аль-Бакары это ~48 нативных детей `PagerView`.
- «Виртуализация» — это swap `placeholder ↔ MushafView` через React state.
- Окно рендера: текущая ±1, LRU до 8 страниц.
- `offscreenPageLimit={1}` — натив знает только соседей, а React не успевает домонтировать `current+2`.

**Почему медленно ок, быстро ломается**

```
Медленно:  page N  →  React успевает смонтировать N+1  →  свайп видит готовый текст
Быстро:    page N  →  свайп на N+1/N+2, пока там placeholder
           onPageSelected → setState → монтирование MushafView (100–300 Text)
           JS-поток блокируется на 1–3 с
           нативный PagerView теряет жест
           через паузу — резкий скачок на 1 страницу
```

`onPageSelected` сразу делает два `setState`:

1. `updateRenderedWindow()` — меняет `renderedPages`
2. `onPageChange()` → `setCurrentMushafPageIndex` в родителе

Оба происходят **во время/сразу после жеста**, а не на `idle`. Пока жест ещё жив, React размонтирует/монтирует тяжёлые деревья.

### 2.2 Вспышка текста («включение / выключение»)

Цепочка:

1. Свайп приземляется на слот, где `isRendered === false`.
2. Пользователь видит пустую карточку-плейсхолдер (золотая рамка без аятов).
3. После `setState` плейсхолдер заменяется на `MushafView`.
4. Yoga/HarfBuzz раскладывает вложенный арабский текст → текст резко появляется.
5. LRU вытесняет страницу за окном → `MushafView` размонтируется → текст резко пропадает.
6. Возврат на ту же страницу — снова вспышка с нуля.

Дополнительно: каждый `setCurrentMushafPageIndex` перерисовывает весь `SurahDetailScreen` (1449 строк), пейджер заново мапит все слоты.

### 2.3 Почему одна страница мусхафа такая дорогая

`MushafView` рисует страницу как дерево вложенных `Text`:

```
<Text>                          // вся страница
  ayahs.map → <Text>            // аят
    segments.map → <Text>       // кусок таджвида (цвет)
    <Text> ﴿١٢﴾ </Text>         // номер аята
```

На типичной мединской странице:

- 10–20 аятов
- 5–15 таджвид-сегментов на аят
- **~100–300 нативных Text** на одну страницу
- шрифт KFGQPC Uthmanic (дорогой shaping)
- `textAlign: 'justify'` на iOS

При окне ±1 это 300–900 Text одновременно. Монтирование **одной** новой страницы во время свайпа и есть те самые «пара секунд ничего».

Таджвид парсится в рендере:

```ts
getAyahTajweedSegments(...) → getTajweedDataset()
```

Первый вызов делает `require('quran-tajweed.json')` — **1.8 МБ / 6236 ключей** синхронно на JS-потоке. Это бьёт по первому открытию суры.

Кэш таджвида маленький: 300 текстов / 600 слов / 200 word-lists. При листании кэш вытесняется, парсер работает снова.

### 2.4 Фриз при переходе на экран

Открытие `app/surah/[id].tsx`:

| Шаг | Где | Проблема |
|-----|-----|----------|
| 1 | `useAyahs` → `useState(loadData)` | **Синхронный** SQLite `getAllSync` в первом рендере |
| 2 | `fetchTranslationsSync` | Ещё один sync-запрос |
| 3 | Fallback JSON | При пустой БД грузит `quran-full-ayahs.json` (2.0 МБ) в рендере |
| 4 | `MushafRollingPager` | Создаёт `pageCount` нативных View сразу |
| 5 | 3× `MushafView` | Сотни Text + первый `require` таджвида |
| 6 | Навигационная анимация | Всё это на JS-потоке → анимация стопорится |

`setLastRead` в `useEffect` при маунте пишет в Zustand persist → AsyncStorage. Не главная причина, но лишняя работа на кадре перехода.

### 2.5 Фриз при смене табов / других экранов

Не только мусхаф.

1. **Progress** (`app/(tabs)/progress.tsx`) держит **все три вкладки сразу** через `display: none`:
   - `ActivityTracker` (683 строки)
   - `JuzProgressList` (731, 30 джузов)
   - `LessonProgressCard` (632)
   - `AchievementsSection` (545)
   
   Комментарий: «0ms instant tab switching». Цена — тяжёлый первый вход на таб «Прогресс».

2. **Learn** — `FadeInDown.delay(index * 90)` на каждую карточку модуля. Анимация на JS/UI при входе.

3. **Memorize** — `SurahPickerSheet` (878 строк) всегда в дереве, даже когда `visible={false}` (зависит от реализации шита).

4. **Tab bar** — `BlurView` intensity 85 + два `LinearGradient` на каждый кадр. На Android blur дорогой.

5. **`FullScreenPlayer`** — 1883 строки, живёт в корневом `_layout`. Пока скрыт возвращает `null` — это ок. Но `usePlayer()` и подписки на стор работают всегда.

6. **Синхронный seed БД** в `src/db/init.ts`: `getAllSync` / `execSync` / вставка 6236 аятов + 12472 перевода на первом запуске. После сида уже быстрее, но холодный старт тяжёлый.

### 2.6 Сопутствующие ловушки в текущем коде

- `handleMushafPageChange` обновляет React-state на **каждый** `onPageSelected`, а не на idle. Нижний счётчик страниц из-за этого перерисовывает весь экран.
- `useEffect([pageIndex])` в пейджере может вызвать `setPageWithoutAnimation` и конфликтовать с живым жестом.
- `renderMushafRollingPage` зависит от `selectedAyah`, `playingAyahNumber`, `highlightedAyahNumber` — любая подсветка/аудио пересобирает страницы.
- `mushafPageHeight` зависит от `currentTrack` — появление мини-плеера меняет высоту и перекладывает все видимые страницы.
- Zustand `persist` на AsyncStorage (не MMKV, хотя MMKV в зависимостях) — запись `lastRead` на главном потоке после debounce 800 мс.

---

## 3. Карта файлов

| Файл | Роль в баге |
|------|-------------|
| `src/features/quran/components/MushafRollingPager.tsx` | Фейковый N-слотовый пейджер, placeholder swap, setState на жесте |
| `src/features/quran/components/MushafView.tsx` | 100–300 вложенных Text / страница |
| `app/surah/[id].tsx` | setState на каждый page change, sync load, тяжёлый экран |
| `src/features/quran/services/tajweedParser.ts` | Sync require 1.8 МБ JSON, узкий LRU |
| `src/features/quran/hooks/useAyahs.ts` | Sync SQLite в первом рендере |
| `src/features/quran/services/pagePreloader.ts` | Греет кэш после interactions — не спасает жест |
| `app/(tabs)/progress.tsx` | Монтирует все секции сразу |
| `app/(tabs)/_layout.tsx` | BlurView на таб-баре |
| `src/db/init.ts` | Sync seed на старте |
| `src/stores/settingsStore.ts` | persist через AsyncStorage |

Предыдущий коммит `825848a perf(mushaf): fix text swiping...` — это **начальный импорт всего репо**, а не рабочий фикс. Симптомы ожидаемы.

---

## 4. План исправления

Приоритет: сначала убрать фриз свайпа и вспышку текста (то, что описал пользователь), затем переходы между экранами.

---

### Фаза 0 — Настоящий rolling pager (P0, 1 сессия)

**Цель:** у `PagerView` ровно **3** ребёнка. Никакого монтирования во время свайпа.

Алгоритм (классический book-pager):

```
Слоты: [prev | current | next]  →  native indexes 0, 1, 2
initialPage = 1
offscreenPageLimit = 1

onPageSelected:
  if position === 1: ничего (уже в центре)
  if position === 2: logicalIndex++
  if position === 0: logicalIndex--
  // НЕ трогать children во время dragging

onPageScrollStateChanged === 'idle':
  1. Обновить данные трёх слотов (prev/current/next)
  2. pager.setPageWithoutAnimation(1)   // тихо вернуть в центр
  3. Сообщить родителю новый index (счётчик страниц)
```

Правила:

- Слоты **всегда** с полным `MushafView`, никогда placeholder.
- Контент соседних страниц готов **до** следующего жеста.
- Во время `dragging` / `settling` — ноль React setState, только refs.
- `pageCount` больше не равен числу детей PagerView.
- Кнопки prev/next тоже гоняют logical index + reset в центр.

Ожидаемый эффект: быстрый свайп больше не блокируется, вспышка текста пропадает (страница уже нарисована за кадром).

---

### Фаза 1 — Не обновлять React во время жеста (P0, вместе с фазой 0)

В `app/surah/[id].tsx`:

- `currentMushafPageIndex` обновлять **только на idle**.
- Счётчик страниц: либо Reanimated shared value, либо state после idle.
- Убрать `setPageWithoutAnimation` из `useEffect([pageIndex])` — это источник гонок с пальцем.
- Автоскролл по аудио — тоже через `setPageWithoutAnimation` на idle, не посреди свайпа.

---

### Фаза 2 — Дешёвый MushafView (P1)

Даже с 3 слотами страница тяжёлая. Нужно снизить стоимость layout.

1. **Сильнее мержить сегменты таджвида** — меньше nested `Text`.
2. Мемоизировать готовое дерево сегментов **вне** компонента страницы (по `pageNumber + fontSize + showTajweed + theme`).
3. Не парсить таджвид в рендере: предрасчёт в `pagePreloader` / воркере.
4. На Android не использовать `justify` (уже `right`) — ок. На iOS `justify` дорогой для арабского; проверить, нужен ли.
5. `pointerEvents="none"` на тексте оставить (сейчас так) — меньше hit-testing.
6. Первую загрузку `quran-tajweed.json` сделать при старте приложения через `InteractionManager.runAfterInteractions`, не при первом аяте.
7. Увеличить LRU таджвида (300 → хотя бы 1500 аятов ≈ 2–3 джуза).

Опциональный быстрый режим: пока идёт серия свайпов (`dragging` дольше N мс или >1 page/s) — соседей рисовать **без** цветного таджвида (один `Text` на страницу). После idle — подменить на цветную версию **без размонтирования слота** (тот же `MushafView`, проп `showTajweed`). Это уберёт остаточный jank на слабых Android.

---

### Фаза 3 — Переходы между экранами (P1)

**Открытие суры**

1. `useAyahs`: не звать SQLite в `useState(initializer)`. Показывать скелетон, грузить в `useEffect` / `InteractionManager`. Кэш оставить.
2. Не монтировать пейджер, пока нет `ayahs` и не измерен layout (высота страницы).
3. `Stack.Screen` для `surah/[id]`:
   - `animation: 'slide_from_right'`
   - `freezeOnBlur: true`
   - не показывать дефолтный header (`headerShown: false` уже в экране, но в `_layout` стоит `headerShown: true` — двойная работа).
4. `setLastRead` / `recordAyahRead` — после перехода, не в том же кадре, что mount.

**Табы**

1. Progress: рендерить **только активную** секцию, не три сразу.
2. Learn: убрать stagger `FadeInDown` или оставить только на первую карточку.
3. `Tabs`: явно `lazy: true`, `detachInactiveScreens: true`.
4. Tab bar blur: на Android снизить `intensity` или заменить на полупрозрачный View (blur — частый источник фриза при смене таба).

**Корень**

1. Перенести persist settings/bookmarks на MMKV (уже в `package.json`).
2. Seed БД не блокировать UI: чанки + `requestIdleCallback` / `setImmediate` на первом запуске.

---

### Фаза 4 — Защита от регрессий (P2)

Чеклист ручной проверки после фикса (на устройстве):

- [ ] Аль-Фатиха (1 стр.) — нет пейджера-глюка на 1 странице
- [ ] Аль-Бакара — быстрые 10 свайпов подряд, без паузы и скачка
- [ ] Медленный свайп — по-прежнему плавно
- [ ] Кнопки ‹ › — анимация, без вспышки текста
- [ ] RTL: свайп влево = следующая страница
- [ ] Аудио дошло до конца страницы — автопереход без дёрганья
- [ ] Смена суры с 114 на 2 и обратно
- [ ] Переключение Mushaf ↔ Translation
- [ ] Открытие суры из списка — анимация навигации не стопается
- [ ] Табы Home → Quran → Progress → Learn → Hifz
- [ ] Поворот / смена темы — страницы не вспыхивают

Технически (сделано):
- [x] `npx tsc --noEmit`
- [x] `mushafPagerMath.test.ts` — RTL/LTR окно, clamp, границы суры

---

## 5. Чего не делать

- Не увеличивать `MAX_RETAINED_PAGES` и `offscreenPageLimit` как «фикс». Это маскирует баг и жрёт память.
- Не оставлять `Array.from({ length: pageCount })` внутри PagerView.
- Не вызывать `setState` в `onPageSelected` / `onPageScroll`.
- Не подменять placeholder↔content на видимом слоте.
- Не парсить 1.8 МБ JSON в рендере.
- Не держать Progress/Achievements/Juz списки смонтированными «для 0ms».

---

## 6. Оценка эффекта

| Симптом | После фазы 0–1 | После фазы 2–3 |
|---------|----------------|----------------|
| Быстрый свайп зависает, потом прыжок | Должен исчезнуть | — |
| Вспышка текста на новой странице | Должна исчезнуть | Дополнительно сгладится |
| Фриз входа в суру | Частично (нет N слотов) | Существенно (async load + preload JSON) |
| Фриз смены табов | Без изменений | Существенно (lazy + не монтировать скрытое) |

Фазы 0 и 1 — обязательный минимум. Без настоящего 3-слотового пейджера остальное не спасёт быстрый свайп.

---

## 7. Порядок работ (рекомендуемый)

1. Переписать `MushafRollingPager` на 3 слота + idle-reset.
2. Отвязать `SurahDetailScreen` state от жеста.
3. Предзагрузка таджвид-JSON и сегментов для current±2.
4. Облегчить `MushafView` (меньше Text).
5. Async `useAyahs` + скелетон на входе в суру.
6. Ленивые табы / Progress только активная секция.
7. MMKV persist, правка `headerShown` в root layout.
8. Прогон чеклиста §4.

---

*Диагностика по коду, без профайлера на устройстве. После фаз 0–1 имеет смысл снять React Native Perf Monitor (JS FPS) на быстром свайпе Аль-Бакары — целевой ориентир: JS FPS не падает в 0.*
