import type { AyahToMemorizeInput } from '../types';
import { getSqliteDb } from '@/db/client';
import type { Ayah, Translation } from '@/db/schema';

const memorizationAyahsCache = new Map<string, AyahToMemorizeInput[]>();

let fallbackAyahsCache: Ayah[] | null = null;
let fallbackTranslationsCache: Translation[] | null = null;

const getFallbackAyahs = (): Ayah[] => {
  if (!fallbackAyahsCache) {
    try {
      fallbackAyahsCache = require('../../../../assets/data/quran-full-ayahs.json');
    } catch {
      fallbackAyahsCache = [];
    }
  }
  return fallbackAyahsCache || [];
};

const getFallbackTranslations = (): Translation[] => {
  if (!fallbackTranslationsCache) {
    try {
      fallbackTranslationsCache = require('../../../../assets/data/quran-full-translations.json');
    } catch {
      fallbackTranslationsCache = [];
    }
  }
  return fallbackTranslationsCache || [];
};

/**
 * Loads ayahs from SQLite (with fallback) for the given surah and ayah range.
 * Results are cached in memory for instant mode toggling without DB roundtrips.
 */
export const getAyahsForMemorization = (
  surahId: number,
  fromAyah: number,
  toAyah: number
): AyahToMemorizeInput[] => {
  const sId = Number(surahId) || 1;
  const from = Number(fromAyah) || 1;
  const to = Math.max(from, Number(toAyah) || from);

  const cacheKey = `${sId}_${from}_${to}`;
  const cached = memorizationAyahsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const sqliteDb = getSqliteDb();
    const ayahs = sqliteDb.getAllSync<Ayah>(
      `SELECT id, surah_id AS surahId, ayah_number AS ayahNumber, text_uthmani AS textUthmani, page, juz
       FROM ayahs
       WHERE surah_id = ? AND ayah_number >= ? AND ayah_number <= ?
       ORDER BY ayah_number ASC;`,
      [sId, from, to]
    );

    if (ayahs && ayahs.length > 0) {
      const translations = sqliteDb.getAllSync<Translation>(
        `SELECT t.ayah_id AS ayahId, t.language, t.text
         FROM translations t
         INNER JOIN ayahs a ON t.ayah_id = a.id
         WHERE a.surah_id = ? AND a.ayah_number >= ? AND a.ayah_number <= ?;`,
        [sId, from, to]
      );

      const translationsMap: Record<number, { ru?: string; uz?: string }> = {};
      for (const t of translations) {
        if (!translationsMap[t.ayahId]) {
          translationsMap[t.ayahId] = {};
        }
        if (t.language === 'ru') {
          translationsMap[t.ayahId].ru = t.text;
        } else if (t.language === 'uz') {
          translationsMap[t.ayahId].uz = t.text;
        }
      }

      const result: AyahToMemorizeInput[] = ayahs.map((a) => ({
        surahId: a.surahId,
        ayahNumber: a.ayahNumber,
        arabicText: a.textUthmani,
        page: a.page,
        juz: a.juz,
        translationRu: translationsMap[a.id]?.ru,
        translationUz: translationsMap[a.id]?.uz,
      }));

      memorizationAyahsCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('getAyahsForMemorization SQLite error:', err);
  }

  // Lazy memoized fallback only if DB fails or empty
  try {
    const allBundledAyahs = getFallbackAyahs();
    const allBundledTranslations = getFallbackTranslations();
    const matchingAyahs = allBundledAyahs.filter(
      (a) => a.surahId === sId && a.ayahNumber >= from && a.ayahNumber <= to
    );
    const ayahIds = new Set(matchingAyahs.map((a) => a.id));
    const translationsMap: Record<number, { ru?: string; uz?: string }> = {};
    for (const t of allBundledTranslations) {
      if (ayahIds.has(t.ayahId)) {
        if (!translationsMap[t.ayahId]) translationsMap[t.ayahId] = {};
        if (t.language === 'ru') translationsMap[t.ayahId].ru = t.text;
        else if (t.language === 'uz') translationsMap[t.ayahId].uz = t.text;
      }
    }
    const result: AyahToMemorizeInput[] = matchingAyahs.map((a) => ({
      surahId: a.surahId,
      ayahNumber: a.ayahNumber,
      arabicText: a.textUthmani,
      translationRu: translationsMap[a.id]?.ru,
      translationUz: translationsMap[a.id]?.uz,
    }));
    memorizationAyahsCache.set(cacheKey, result);
    return result;
  } catch {
    return [];
  }
};

const ayahMetaCache = new Map<string, { page: number; juz: number }>();

/**
 * Returns a map of `${surahId}_${ayahNumber}` -> { page, juz } for any list of cards.
 * Cached in-memory for instant lookups.
 */
export const getAyahsPageMap = (
  cards: { surahId: number; ayahNumber: number }[]
): Map<string, { page: number; juz: number }> => {
  const result = new Map<string, { page: number; juz: number }>();
  if (!cards.length) return result;

  const neededSurahs: number[] = [];
  for (const c of cards) {
    const key = `${c.surahId}_${c.ayahNumber}`;
    const cached = ayahMetaCache.get(key);
    if (cached) {
      result.set(key, cached);
    } else if (!neededSurahs.includes(c.surahId)) {
      neededSurahs.push(c.surahId);
    }
  }

  if (neededSurahs.length > 0) {
    try {
      const sqliteDb = getSqliteDb();
      for (const sId of neededSurahs) {
        const rows = sqliteDb.getAllSync<{ ayah_number: number; page: number; juz: number }>(
          'SELECT ayah_number, page, juz FROM ayahs WHERE surah_id = ?;',
          [sId]
        );
        if (rows) {
          for (const r of rows) {
            const item = { page: r.page, juz: r.juz };
            const key = `${sId}_${r.ayah_number}`;
            ayahMetaCache.set(key, item);
            result.set(key, item);
          }
        }
      }
    } catch (err) {
      console.warn('getAyahsPageMap SQLite error:', err);
    }
  }

  return result;
};

