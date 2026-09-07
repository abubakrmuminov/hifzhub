import { getSqliteDb } from '@/db/client';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import { getSurahName } from '@/features/quran/utils/quranUtils';
import type { Surah } from '@/db/schema';

export interface AyahSearchResult {
  id: number;
  surahId: number;
  ayahNumber: number;
  surahName: string;
  surahArabic: string;
  textUthmani: string;
  translation: string;
  translator: string;
  juz: number;
  page: number;
  matchType: 'reference' | 'translation' | 'arabic';
}

export interface SurahSearchResult {
  surah: Surah;
  localizedName: string;
  matchField: 'name' | 'id' | 'arabic' | 'transliteration';
}

export interface QuranSearchResults {
  query: string;
  referenceMatch: AyahSearchResult | null;
  surahs: SurahSearchResult[];
  ayahs: AyahSearchResult[];
  totalMatches: number;
}

// Fallback in-memory data
let bundledAyahs: any[] | null = null;
let bundledTranslations: any[] | null = null;

const getBundledAyahs = (): any[] => {
  if (!bundledAyahs) {
    try {
      bundledAyahs = require('../../../../assets/data/quran-full-ayahs.json');
    } catch {
      bundledAyahs = [];
    }
  }
  return bundledAyahs ?? [];
};

const getBundledTranslations = (): any[] => {
  if (!bundledTranslations) {
    try {
      bundledTranslations = require('../../../../assets/data/quran-full-translations.json');
    } catch {
      bundledTranslations = [];
    }
  }
  return bundledTranslations ?? [];
};

/**
 * Normalizes Arabic text by stripping all tashkeel (harakat),
 * Quranic stop/annotation marks, tatweel, and normalizing letter forms.
 */
export const normalizeArabic = (text: string, keepAlif = true): string => {
  if (!text) return '';
  let s = text
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u06E1\u06E2\u0640]/g, '') // strip harakat, waqf marks, tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');

  if (keepAlif) {
    s = s.replace(/\u0670/g, 'ا'); // dagger alif -> standard alif
  } else {
    s = s.replace(/[\u0670ا]/g, ''); // strip alif for skeleton compare
  }
  return s.trim();
};

export const isArabicText = (text: string): boolean => {
  return /[\u0600-\u06FF]/.test(text);
};

// Map of common alias search queries to exact references
const FAMOUS_AYAH_ALIASES: Record<string, { surahId: number; ayahNumber: number }> = {
  'аят аль курси': { surahId: 2, ayahNumber: 255 },
  'аят аль-курси': { surahId: 2, ayahNumber: 255 },
  'аятуль курси': { surahId: 2, ayahNumber: 255 },
  'курси': { surahId: 2, ayahNumber: 255 },
  'kursi': { surahId: 2, ayahNumber: 255 },
  'kursiy': { surahId: 2, ayahNumber: 255 },
  'oyatul kursi': { surahId: 2, ayahNumber: 255 },
  'аманарасулю': { surahId: 2, ayahNumber: 285 },
  'амана расулю': { surahId: 2, ayahNumber: 285 },
  'амана р-расулю': { surahId: 2, ayahNumber: 285 },
  'amanarrasulu': { surahId: 2, ayahNumber: 285 },
  'аят света': { surahId: 24, ayahNumber: 35 },
  'оят нур': { surahId: 24, ayahNumber: 35 },
  'нур 35': { surahId: 24, ayahNumber: 35 },
  'хашр 22': { surahId: 59, ayahNumber: 22 },
  'хашр 23': { surahId: 59, ayahNumber: 23 },
  'хашр 24': { surahId: 59, ayahNumber: 24 },
};

/**
 * Parses user queries like "2:255", "2 255", "2-255", "Бакара 255", "yosin 1", "курси"
 */
export const parseReferenceQuery = (
  query: string
): { surahId: number; ayahNumber: number } | null => {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. Check famous aliases
  if (FAMOUS_AYAH_ALIASES[q]) {
    return FAMOUS_AYAH_ALIASES[q];
  }

  // 2. Numeric pattern: "2:255", "2 255", "2-255", "2/255"
  const numericMatch = q.match(/^(\d{1,3})[\s:\-/]+(\d{1,3})$/);
  if (numericMatch) {
    const surahId = parseInt(numericMatch[1], 10);
    const ayahNumber = parseInt(numericMatch[2], 10);
    const surah = SURAHS_DATA.find((s) => s.id === surahId);
    if (surah && ayahNumber >= 1 && ayahNumber <= surah.ayahCount) {
      return { surahId, ayahNumber };
    }
  }

  // 3. Name + number pattern: "Бакара 255", "Фатиха 7", "Ясин 12", "Kahf 10"
  const nameMatch = q.match(/^(.*?)[,:\s]+(\d{1,3})$/);
  if (nameMatch) {
    const namePart = nameMatch[1].trim().toLowerCase();
    const ayahNumber = parseInt(nameMatch[2], 10);
    if (namePart.length >= 2) {
      for (const s of SURAHS_DATA) {
        let ruName = '';
        let uzName = '';
        try {
          const parsed = JSON.parse(s.nameTranslation);
          ruName = (parsed.ru || '').toLowerCase();
          uzName = (parsed.uz || '').toLowerCase();
        } catch {}

        const cleanRu = ruName.replace(/^(аль-|ат-|ан-|аш-|ар-|аз-|ад-)/, '');
        const cleanUz = uzName.replace(/^(al-|at-|an-|ash-|ar-|az-|ad-)/, '');
        const ar = s.nameArabic;

        if (
          ruName.includes(namePart) ||
          cleanRu.includes(namePart) ||
          uzName.includes(namePart) ||
          cleanUz.includes(namePart) ||
          ar.includes(namePart)
        ) {
          if (ayahNumber >= 1 && ayahNumber <= s.ayahCount) {
            return { surahId: s.id, ayahNumber };
          }
        }
      }
    }
  }

  return null;
};

// Cached normalized Arabic ayahs for instant search (< 3ms)
let normalizedArabicAyahsCache:
  | { id: number; surahId: number; ayahNumber: number; normalizedWithAlif: string; normalizedWithoutAlif: string }[]
  | null = null;

const getNormalizedArabicAyahs = () => {
  if (!normalizedArabicAyahsCache) {
    const ayahs = getBundledAyahs();
    normalizedArabicAyahsCache = ayahs.map((a) => ({
      id: a.id,
      surahId: a.surahId,
      ayahNumber: a.ayahNumber,
      normalizedWithAlif: normalizeArabic(a.textUthmani, true),
      normalizedWithoutAlif: normalizeArabic(a.textUthmani, false),
    }));
  }
  return normalizedArabicAyahsCache;
};

/**
 * Searches Surahs matching the query
 */
export const searchSurahs = (
  query: string,
  language: string = 'ru'
): SurahSearchResult[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SurahSearchResult[] = [];
  const cleanQ = q.replace(/^(аль-|ат-|ан-|аш-|ар-|аз-|ад-|al-|at-|an-|ash-|ar-|az-|ad-)/, '');

  for (const surah of SURAHS_DATA) {
    const localized = getSurahName(surah.nameTranslation, language);
    const localizedLower = localized.toLowerCase();
    const cleanLocalized = localizedLower.replace(
      /^(аль-|ат-|ан-|аш-|ар-|аз-|ад-|al-|at-|an-|ash-|ar-|az-|ad-)/,
      ''
    );
    const idStr = surah.id.toString();
    const arabic = surah.nameArabic;

    if (idStr === q) {
      results.push({ surah, localizedName: localized, matchField: 'id' });
    } else if (localizedLower.includes(q) || cleanLocalized.includes(cleanQ)) {
      results.push({ surah, localizedName: localized, matchField: 'name' });
    } else if (arabic.includes(q)) {
      results.push({ surah, localizedName: localized, matchField: 'arabic' });
    } else {
      // Check other language as well
      const altLang = language === 'ru' ? 'uz' : 'ru';
      const altName = getSurahName(surah.nameTranslation, altLang).toLowerCase();
      if (altName.includes(q) || altName.includes(cleanQ)) {
        results.push({ surah, localizedName: localized, matchField: 'transliteration' });
      }
    }
  }

  return results;
};

/**
 * Fetches a single ayah result by reference (surahId + ayahNumber)
 */
export const getAyahByReference = (
  surahId: number,
  ayahNumber: number,
  language: string = 'ru'
): AyahSearchResult | null => {
  const surah = SURAHS_DATA.find((s) => s.id === surahId);
  if (!surah) return null;

  const surahName = getSurahName(surah.nameTranslation, language);
  const lang = language === 'uz' ? 'uz' : 'ru';

  try {
    const sqliteDb = getSqliteDb();
    const row = sqliteDb.getFirstSync<any>(
      `SELECT a.id, a.surah_id AS surahId, a.ayah_number AS ayahNumber,
              a.text_uthmani AS textUthmani, a.juz, a.page,
              t.text AS translation, t.translator
       FROM ayahs a
       LEFT JOIN translations t ON t.ayah_id = a.id AND t.language = ?
       WHERE a.surah_id = ? AND a.ayah_number = ?;`,
      [lang, surahId, ayahNumber]
    );

    if (row) {
      return {
        id: row.id,
        surahId: row.surahId,
        ayahNumber: row.ayahNumber,
        surahName,
        surahArabic: surah.nameArabic,
        textUthmani: row.textUthmani,
        translation: row.translation || '',
        translator: row.translator || (lang === 'ru' ? 'Кулиев' : 'Мухаммад Содиқ'),
        juz: row.juz,
        page: row.page,
        matchType: 'reference',
      };
    }
  } catch (err) {
    // Fallback to bundled JSON
  }

  // Bundled JSON fallback
  const ayahs = getBundledAyahs();
  const translations = getBundledTranslations();
  const ayah = ayahs.find((a) => a.surahId === surahId && a.ayahNumber === ayahNumber);
  if (!ayah) return null;

  const trans = translations.find((t) => t.ayahId === ayah.id && t.language === lang);

  return {
    id: ayah.id,
    surahId: ayah.surahId,
    ayahNumber: ayah.ayahNumber,
    surahName,
    surahArabic: surah.nameArabic,
    textUthmani: ayah.textUthmani,
    translation: trans ? trans.text : '',
    translator: trans ? trans.translator : (lang === 'ru' ? 'Кулиев' : 'Мухаммад Содиқ'),
    juz: ayah.juz,
    page: ayah.page,
    matchType: 'reference',
  };
};

/**
 * Searches Ayahs by text translation and/or Arabic text
 */
export const searchAyahs = (
  query: string,
  language: string = 'ru',
  limit: number = 40
): AyahSearchResult[] => {
  const q = query.trim();
  if (q.length < 2) return [];

  const lang = language === 'uz' ? 'uz' : 'ru';
  const isArabic = isArabicText(q);
  const results: AyahSearchResult[] = [];
  const seenAyahIds = new Set<number>();

  const surahMap = new Map<number, Surah>();
  for (const s of SURAHS_DATA) {
    surahMap.set(s.id, s);
  }

  // 1. If Arabic query, search normalized Arabic
  if (isArabic) {
    const qWithAlif = normalizeArabic(q, true);
    const qWithoutAlif = normalizeArabic(q, false);
    const normalizedList = getNormalizedArabicAyahs();

    const matchedAyahIds: number[] = [];
    for (const item of normalizedList) {
      if (
        (qWithAlif && item.normalizedWithAlif.includes(qWithAlif)) ||
        (qWithoutAlif && item.normalizedWithoutAlif.includes(qWithoutAlif))
      ) {
        matchedAyahIds.push(item.id);
        if (matchedAyahIds.length >= limit) break;
      }
    }

    if (matchedAyahIds.length > 0) {
      try {
        const sqliteDb = getSqliteDb();
        const placeholders = matchedAyahIds.map(() => '?').join(', ');
        const rows = sqliteDb.getAllSync<any>(
          `SELECT a.id, a.surah_id AS surahId, a.ayah_number AS ayahNumber,
                  a.text_uthmani AS textUthmani, a.juz, a.page,
                  t.text AS translation, t.translator
           FROM ayahs a
           LEFT JOIN translations t ON t.ayah_id = a.id AND t.language = ?
           WHERE a.id IN (${placeholders})
           ORDER BY a.surah_id ASC, a.ayah_number ASC;`,
          [lang, ...matchedAyahIds]
        );

        for (const row of rows) {
          const surah = surahMap.get(row.surahId);
          seenAyahIds.add(row.id);
          results.push({
            id: row.id,
            surahId: row.surahId,
            ayahNumber: row.ayahNumber,
            surahName: surah ? getSurahName(surah.nameTranslation, language) : `Surah ${row.surahId}`,
            surahArabic: surah?.nameArabic ?? '',
            textUthmani: row.textUthmani,
            translation: row.translation || '',
            translator: row.translator || '',
            juz: row.juz,
            page: row.page,
            matchType: 'arabic',
          });
        }
      } catch {
        // Fallback for Arabic search
        const ayahs = getBundledAyahs();
        const translations = getBundledTranslations();
        for (const id of matchedAyahIds) {
          const ayah = ayahs.find((a) => a.id === id);
          if (!ayah) continue;
          const trans = translations.find((t) => t.ayahId === id && t.language === lang);
          const surah = surahMap.get(ayah.surahId);
          seenAyahIds.add(id);
          results.push({
            id: ayah.id,
            surahId: ayah.surahId,
            ayahNumber: ayah.ayahNumber,
            surahName: surah ? getSurahName(surah.nameTranslation, language) : `Surah ${ayah.surahId}`,
            surahArabic: surah?.nameArabic ?? '',
            textUthmani: ayah.textUthmani,
            translation: trans ? trans.text : '',
            translator: trans ? trans.translator : '',
            juz: ayah.juz,
            page: ayah.page,
            matchType: 'arabic',
          });
        }
      }
    }
  }

  // 2. Full-text search in translation (Cyrillic / Latin / keywords)
  if (results.length < limit) {
    const remainingLimit = limit - results.length;
    const lowerQ = q.toLowerCase();

    try {
      const sqliteDb = getSqliteDb();
      const rows = sqliteDb.getAllSync<any>(
        `SELECT a.id, a.surah_id AS surahId, a.ayah_number AS ayahNumber,
                a.text_uthmani AS textUthmani, a.juz, a.page,
                t.text AS translation, t.translator
         FROM translations t
         JOIN ayahs a ON a.id = t.ayah_id
         WHERE t.language = ? AND t.text LIKE ?
         ORDER BY a.surah_id ASC, a.ayah_number ASC
         LIMIT ?;`,
        [lang, `%${lowerQ}%`, remainingLimit]
      );

      for (const row of rows) {
        if (!seenAyahIds.has(row.id)) {
          seenAyahIds.add(row.id);
          const surah = surahMap.get(row.surahId);
          results.push({
            id: row.id,
            surahId: row.surahId,
            ayahNumber: row.ayahNumber,
            surahName: surah ? getSurahName(surah.nameTranslation, language) : `Surah ${row.surahId}`,
            surahArabic: surah?.nameArabic ?? '',
            textUthmani: row.textUthmani,
            translation: row.translation,
            translator: row.translator,
            juz: row.juz,
            page: row.page,
            matchType: 'translation',
          });
        }
      }
    } catch {
      // Bundled JSON fallback
      const ayahs = getBundledAyahs();
      const translations = getBundledTranslations();
      const matchedTranslations = translations.filter(
        (t) => t.language === lang && t.text.toLowerCase().includes(lowerQ)
      );

      for (const t of matchedTranslations) {
        if (results.length >= limit) break;
        if (!seenAyahIds.has(t.ayahId)) {
          seenAyahIds.add(t.ayahId);
          const ayah = ayahs.find((a) => a.id === t.ayahId);
          if (ayah) {
            const surah = surahMap.get(ayah.surahId);
            results.push({
              id: ayah.id,
              surahId: ayah.surahId,
              ayahNumber: ayah.ayahNumber,
              surahName: surah ? getSurahName(surah.nameTranslation, language) : `Surah ${ayah.surahId}`,
              surahArabic: surah?.nameArabic ?? '',
              textUthmani: ayah.textUthmani,
              translation: t.text,
              translator: t.translator,
              juz: ayah.juz,
              page: ayah.page,
              matchType: 'translation',
            });
          }
        }
      }
    }
  }

  return results;
};

/**
 * Unified Omni-Search entry point
 */
export const searchQuran = (
  query: string,
  language: string = 'ru',
  options?: { limit?: number }
): QuranSearchResults => {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: '',
      referenceMatch: null,
      surahs: [],
      ayahs: [],
      totalMatches: 0,
    };
  }

  const limit = options?.limit ?? 40;

  // 1. Check for exact reference match (e.g. "2:255" or "Бакара 255" or "курси")
  const ref = parseReferenceQuery(trimmed);
  let referenceMatch: AyahSearchResult | null = null;
  if (ref) {
    referenceMatch = getAyahByReference(ref.surahId, ref.ayahNumber, language);
  }

  // 2. Surahs matching
  const surahs = searchSurahs(trimmed, language);

  // 3. Ayahs matching (translations + Arabic)
  const ayahs = searchAyahs(trimmed, language, limit);

  const totalMatches =
    (referenceMatch ? 1 : 0) + surahs.length + ayahs.length;

  return {
    query: trimmed,
    referenceMatch,
    surahs,
    ayahs,
    totalMatches,
  };
};
