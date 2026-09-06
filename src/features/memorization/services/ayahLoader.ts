import type { AyahToMemorizeInput } from '../types';
import { getSqliteDb } from '@/db/client';
import type { Ayah, Translation } from '@/db/schema';

/**
 * Loads ayahs from SQLite (with fallback) for the given surah and ayah range.
 */
export const getAyahsForMemorization = (
  surahId: number,
  fromAyah: number,
  toAyah: number
): AyahToMemorizeInput[] => {
  const sId = Number(surahId) || 1;
  const from = Number(fromAyah) || 1;
  const to = Math.max(from, Number(toAyah) || from);

  try {
    const sqliteDb = getSqliteDb();
    const ayahs = sqliteDb.getAllSync<Ayah>(
      `SELECT id, surah_id AS surahId, ayah_number AS ayahNumber, text_uthmani AS textUthmani
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

      return ayahs.map((a) => ({
        surahId: a.surahId,
        ayahNumber: a.ayahNumber,
        arabicText: a.textUthmani,
        translationRu: translationsMap[a.id]?.ru,
        translationUz: translationsMap[a.id]?.uz,
      }));
    }
  } catch (err) {
    console.warn('getAyahsForMemorization SQLite error:', err);
  }

  // Lazy fallback only if DB fails or empty
  try {
    const allBundledAyahs: Ayah[] = require('../../../../assets/data/quran-full-ayahs.json');
    const allBundledTranslations: Translation[] = require('../../../../assets/data/quran-full-translations.json');
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
    return matchingAyahs.map((a) => ({
      surahId: a.surahId,
      ayahNumber: a.ayahNumber,
      arabicText: a.textUthmani,
      translationRu: translationsMap[a.id]?.ru,
      translationUz: translationsMap[a.id]?.uz,
    }));
  } catch {
    return [];
  }
};
