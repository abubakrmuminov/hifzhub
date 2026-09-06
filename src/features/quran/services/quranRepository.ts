import { queryOptions } from '@tanstack/react-query';
import { initializeDatabase, getPersistentSqliteDb } from '@/db/init';
import type { Ayah, Translation } from '@/db/schema';

export function validateSurahId(surahId: number): void {
  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
    throw new RangeError('Invalid surah ID');
  }
}

export async function loadSurahAyahs(surahId: number): Promise<Ayah[]> {
  validateSurahId(surahId);
  await initializeDatabase();
  const rows = await getPersistentSqliteDb().getAllAsync<Ayah>(
    `SELECT id, surah_id AS surahId, ayah_number AS ayahNumber,
      text_uthmani AS textUthmani, text_tajweed AS textTajweed, juz, hizb, page
     FROM ayahs WHERE surah_id = ? ORDER BY ayah_number`, surahId
  );
  if (!rows.length) throw new Error('Quran content is missing');
  return rows;
}

export async function loadSurahTranslations(surahId: number, language?: 'ru' | 'uz'): Promise<Translation[]> {
  validateSurahId(surahId);
  await initializeDatabase();
  return getPersistentSqliteDb().getAllAsync<Translation>(
    `SELECT t.id, t.ayah_id AS ayahId, t.language, t.translator, t.text
     FROM ayahs a JOIN translations t ON t.ayah_id = a.id
     WHERE a.surah_id = ? ${language ? 'AND t.language = ?' : ''}
     ORDER BY a.ayah_number, t.id`, language ? [surahId, language] : [surahId]
  );
}

// Immutable content: deduplicate concurrent readers and reuse data on mode changes.
export const ayahsQuery = (surahId: number) => queryOptions({
  queryKey: ['quran', 'ayahs', surahId],
  queryFn: () => loadSurahAyahs(surahId),
  staleTime: Infinity,
  gcTime: 5 * 60 * 1000,
  retry: 1,
});

export const translationsQuery = (surahId: number, language?: 'ru' | 'uz') => queryOptions({
  queryKey: ['quran', 'translations', surahId, language ?? 'all'],
  queryFn: () => loadSurahTranslations(surahId, language),
  staleTime: Infinity,
  gcTime: 5 * 60 * 1000,
  retry: 1,
});
