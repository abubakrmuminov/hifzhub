import type { AyahToMemorizeInput } from '../types';
import { getPersistentSqliteDb, initializeDatabase } from '@/db/init';
import { validateSurahId } from '@/features/quran/services/quranRepository';

/** A range-scoped native query; never evaluate whole-Quran JSON on a tap. */
export async function getAyahsForMemorization(
  surahId: number, fromAyah: number, toAyah: number
): Promise<AyahToMemorizeInput[]> {
  validateSurahId(surahId);
  if (!Number.isInteger(fromAyah) || !Number.isInteger(toAyah) || fromAyah < 1 || toAyah < fromAyah) {
    throw new RangeError('Invalid ayah range');
  }
  await initializeDatabase();
  const rows = await getPersistentSqliteDb().getAllAsync<AyahToMemorizeInput>(
    `SELECT a.surah_id AS surahId, a.ayah_number AS ayahNumber, a.text_uthmani AS arabicText,
      (SELECT text FROM translations WHERE ayah_id = a.id AND language = 'ru' LIMIT 1) AS translationRu,
      (SELECT text FROM translations WHERE ayah_id = a.id AND language = 'uz' LIMIT 1) AS translationUz
     FROM ayahs a WHERE surah_id = ? AND ayah_number BETWEEN ? AND ? ORDER BY ayah_number`,
    surahId, fromAyah, toAyah
  );
  if (rows.length !== toAyah - fromAyah + 1) throw new Error('Incomplete ayah range');
  return rows;
}
