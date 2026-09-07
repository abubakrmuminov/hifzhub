import * as SQLite from 'expo-sqlite';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import { SEED_AYAHS, SEED_TRANSLATIONS } from '@/features/quran/data/seedAyahs';

let isDbInitialized = false;
let isInitializing = false;

export const initDatabaseTables = (sqliteDb: SQLite.SQLiteDatabase): void => {
  if (isDbInitialized || isInitializing) return;
  isInitializing = true;
  try {

  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS surahs (
      id INTEGER PRIMARY KEY,
      name_arabic TEXT NOT NULL,
      name_translation TEXT NOT NULL,
      revelation_type TEXT NOT NULL,
      ayah_count INTEGER NOT NULL,
      juz_start INTEGER NOT NULL,
      page_start INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ayahs (
      id INTEGER PRIMARY KEY,
      surah_id INTEGER NOT NULL REFERENCES surahs(id) ON DELETE CASCADE,
      ayah_number INTEGER NOT NULL,
      text_uthmani TEXT NOT NULL,
      text_tajweed TEXT,
      juz INTEGER NOT NULL,
      hizb INTEGER NOT NULL,
      page INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY,
      ayah_id INTEGER NOT NULL REFERENCES ayahs(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      text_arabic TEXT NOT NULL,
      transliteration TEXT,
      translation TEXT
    );

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY,
      ayah_id INTEGER NOT NULL REFERENCES ayahs(id) ON DELETE CASCADE,
      language TEXT NOT NULL,
      translator TEXT NOT NULL,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      ayah_id INTEGER NOT NULL REFERENCES ayahs(id) ON DELETE CASCADE,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS reading_progress (
      id TEXT PRIMARY KEY,
      surah_id INTEGER NOT NULL REFERENCES surahs(id) ON DELETE CASCADE,
      last_ayah INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS downloaded_audio (
      id TEXT PRIMARY KEY,
      surah_id INTEGER NOT NULL REFERENCES surahs(id) ON DELETE CASCADE,
      reciter_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      downloaded_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memorization_cards (
      id TEXT PRIMARY KEY,
      surah_id INTEGER NOT NULL REFERENCES surahs(id) ON DELETE CASCADE,
      ayah_start INTEGER NOT NULL,
      ayah_end INTEGER NOT NULL,
      difficulty REAL NOT NULL,
      stability REAL NOT NULL,
      interval INTEGER NOT NULL,
      repetitions INTEGER NOT NULL,
      next_review_at INTEGER NOT NULL,
      last_reviewed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE INDEX IF NOT EXISTS idx_ayahs_surah_id ON ayahs(surah_id);
    CREATE INDEX IF NOT EXISTS idx_ayahs_surah_num ON ayahs(surah_id, ayah_number);
    CREATE INDEX IF NOT EXISTS idx_translations_ayah_lang ON translations(ayah_id, language);
    CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(language);
    CREATE INDEX IF NOT EXISTS idx_ayahs_page ON ayahs(page);
    CREATE INDEX IF NOT EXISTS idx_ayahs_juz ON ayahs(juz);
  `);

  const surahCountResult = sqliteDb.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM surahs;'
  );

  if (!surahCountResult || surahCountResult.count === 0) {
    const tStartSurahs = performance.now();
    sqliteDb.withTransactionSync(() => {
      const BATCH = 50;
      for (let i = 0; i < SURAHS_DATA.length; i += BATCH) {
        const chunk = SURAHS_DATA.slice(i, i + BATCH);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
        const sql = `INSERT OR REPLACE INTO surahs (id, name_arabic, name_translation, revelation_type, ayah_count, juz_start, page_start) VALUES ${placeholders};`;
        const params: any[] = [];
        for (const s of chunk) {
          params.push(
            s.id,
            s.nameArabic,
            s.nameTranslation,
            s.revelationType,
            s.ayahCount,
            s.juzStart,
            s.pageStart
          );
        }
        sqliteDb.runSync(sql, params);
      }
    });
    console.log(`[DB Init] Seeded surahs in ${(performance.now() - tStartSurahs).toFixed(2)} ms`);
  }

  const ayahCountResult = sqliteDb.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM ayahs;'
  );

  if (!ayahCountResult || ayahCountResult.count < 6236) {
    const tStartAyahs = performance.now();
    const fullAyahs = require('../../assets/data/quran-full-ayahs.json');
    const fullTranslations = require('../../assets/data/quran-full-translations.json');

    sqliteDb.withTransactionSync(() => {
      const BATCH = 200;
      for (let i = 0; i < fullAyahs.length; i += BATCH) {
        const chunk = fullAyahs.slice(i, i + BATCH);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const sql = `INSERT OR REPLACE INTO ayahs (id, surah_id, ayah_number, text_uthmani, text_tajweed, juz, hizb, page) VALUES ${placeholders};`;
        const params: any[] = [];
        for (const a of chunk) {
          params.push(
            a.id,
            a.surahId,
            a.ayahNumber,
            a.textUthmani,
            a.textTajweed ?? null,
            a.juz,
            a.hizb,
            a.page
          );
        }
        sqliteDb.runSync(sql, params);
      }

      for (let i = 0; i < fullTranslations.length; i += BATCH) {
        const chunk = fullTranslations.slice(i, i + BATCH);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const sql = `INSERT OR REPLACE INTO translations (id, ayah_id, language, translator, text) VALUES ${placeholders};`;
        const params: any[] = [];
        for (const t of chunk) {
          params.push(t.id, t.ayahId, t.language, t.translator, t.text);
        }
        sqliteDb.runSync(sql, params);
      }
    });
    console.log(`[DB Init] Seeded 6236 ayahs & 12472 translations in ${(performance.now() - tStartAyahs).toFixed(2)} ms`);
  }

  isDbInitialized = true;
  } finally {
    isInitializing = false;
  }
};

let persistentSqliteDb: SQLite.SQLiteDatabase | null = null;

export const getPersistentSqliteDb = (): SQLite.SQLiteDatabase => {
  if (!persistentSqliteDb) {
    persistentSqliteDb = SQLite.openDatabaseSync('hifzhub.db');
    try {
      persistentSqliteDb.execSync('PRAGMA journal_mode = WAL;');
      persistentSqliteDb.execSync('PRAGMA synchronous = NORMAL;');
      persistentSqliteDb.execSync('PRAGMA temp_store = MEMORY;');
      persistentSqliteDb.execSync('PRAGMA cache_size = -64000;');
    } catch {}
    try {
      persistentSqliteDb.execSync('PRAGMA foreign_keys = ON;');
    } catch {}
    initDatabaseTables(persistentSqliteDb);
  }
  return persistentSqliteDb;
};

export const initializeDatabase = async (): Promise<void> => {
  if (isDbInitialized && persistentSqliteDb) return;
  getPersistentSqliteDb();
};
