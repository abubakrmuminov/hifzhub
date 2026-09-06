import { count } from 'drizzle-orm';
import { surahs, ayahs, translations, type NewSurah, type NewAyah, type NewTranslation } from '../schema';
import type { AppDatabase } from '../client';

export interface SeedResult {
  seeded: boolean;
  surahsCount: number;
  ayahsCount: number;
  translationsCount: number;
}

/**
 * Seeds the SQLite database with reference Quran data (surahs, sample ayahs, translations)
 * on first application launch if the database is not already seeded.
 *
 * @param db - Drizzle database instance (Expo SQLite)
 * @returns Result object detailing whether seeding was performed and the record counts.
 */
export const seedDatabase = async (db: AppDatabase): Promise<SeedResult> => {
  try {
    // 1. Check if data is already seeded by querying the count of surahs
    const countResult = await db.select({ value: count() }).from(surahs);
    const existingCount = countResult[0]?.value ?? 0;

    if (existingCount > 0) {
      console.log(`[Seed] Database already seeded (${existingCount} surahs found). Skipping.`);
      return {
        seeded: false,
        surahsCount: existingCount,
        ayahsCount: 0,
        translationsCount: 0,
      };
    }

    console.log('[Seed] Starting database seeding process...');

    // 2. Load JSON data files
    const surahsData = require('../../../assets/data/surahs.json');
    const ayahsData = require('../../../assets/data/quran-text-sample.json');
    const ruTranslationsData = require('../../../assets/data/translations-ru-sample.json');
    const uzTranslationsData = require('../../../assets/data/translations-uz-sample.json');

    // 3. Prepare Surahs rows
    const surahRows: NewSurah[] = surahsData.map((s: any) => ({
      id: s.id,
      nameArabic: s.nameArabic,
      nameTranslation:
        typeof s.nameTranslation === 'string'
          ? s.nameTranslation
          : JSON.stringify(s.nameTranslation),
      revelationType: s.revelationType,
      ayahCount: s.ayahCount,
      juzStart: s.juzStart,
      pageStart: s.pageStart,
    }));

    // Batch insert surahs (in chunks of 50 for safety across SQLite versions)
    console.log(`[Seed] Inserting ${surahRows.length} surahs...`);
    const SURAH_CHUNK_SIZE = 50;
    for (let i = 0; i < surahRows.length; i += SURAH_CHUNK_SIZE) {
      const chunk = surahRows.slice(i, i + SURAH_CHUNK_SIZE);
      await db.insert(surahs).values(chunk);
    }
    console.log(`[Seed] Successfully inserted ${surahRows.length} surahs.`);

    // 4. Prepare Ayahs rows
    const ayahRows: NewAyah[] = ayahsData.map((a: any) => ({
      id: a.id,
      surahId: a.surahId,
      ayahNumber: a.ayahNumber,
      textUthmani: a.textUthmani,
      textTajweed: a.textTajweed ?? '',
      juz: a.juz,
      hizb: a.hizb,
      page: a.page,
    }));

    console.log(`[Seed] Inserting ${ayahRows.length} ayahs...`);
    await db.insert(ayahs).values(ayahRows);
    console.log(`[Seed] Successfully inserted ${ayahRows.length} ayahs.`);

    // 5. Prepare Translations rows
    // Russian translations (Elmir Kuliev)
    const ruRows: NewTranslation[] = ruTranslationsData.map((t: any, index: number) => ({
      id: t.id ?? index + 1,
      ayahId: t.ayahId,
      language: t.language,
      translator: t.translator,
      text: t.text,
    }));

    // Uzbek translations (Alauddin Mansur)
    // Offset IDs by the number of Russian translations to ensure unique primary keys in the translations table
    const uzRows: NewTranslation[] = uzTranslationsData.map((t: any, index: number) => ({
      id: (t.id ?? index + 1) + ruRows.length,
      ayahId: t.ayahId,
      language: t.language,
      translator: t.translator,
      text: t.text,
    }));

    const allTranslations = [...ruRows, ...uzRows];
    console.log(`[Seed] Inserting ${allTranslations.length} translations (${ruRows.length} RU, ${uzRows.length} UZ)...`);
    await db.insert(translations).values(allTranslations);
    console.log(`[Seed] Successfully inserted ${allTranslations.length} translations.`);

    console.log('[Seed] Database seeding completed successfully.');

    return {
      seeded: true,
      surahsCount: surahRows.length,
      ayahsCount: ayahRows.length,
      translationsCount: allTranslations.length,
    };
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    throw error;
  }
};
