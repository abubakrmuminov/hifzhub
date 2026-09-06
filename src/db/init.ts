import * as SQLite from 'expo-sqlite';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';

let persistentSqliteDb: SQLite.SQLiteDatabase | null = null;
let initialization: Promise<void> | null = null;

// Never open or seed a database from a component render. The root awaits this promise.
export function getPersistentSqliteDb(): SQLite.SQLiteDatabase {
  if (!persistentSqliteDb) throw new Error('Database is not ready');
  return persistentSqliteDb;
}

export async function initDatabaseTables(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
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

    CREATE TABLE IF NOT EXISTS content_versions (name TEXT PRIMARY KEY, version INTEGER NOT NULL);
  `);
  const version = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM content_versions WHERE name = 'quran'"
  );
  if (version?.version === 1) return;

  // Import/copy in native SQLite, not 18,708 synchronous JS-to-native inserts.
  const seedName = 'quran-content-v1.db';
  await SQLite.importDatabaseFromAssetAsync(seedName, {
    assetId: require('../../assets/data/quran-content-v1.db'),
  });
  const seed = await SQLite.openDatabaseAsync(seedName);
  const seedPath = seed.databasePath;
  await seed.closeAsync();
  await db.runAsync('ATTACH DATABASE ? AS bundled', seedPath);
  try {
    await db.withTransactionAsync(async () => {
      for (const s of SURAHS_DATA) {
        await db.runAsync(
          'INSERT OR IGNORE INTO surahs VALUES (?, ?, ?, ?, ?, ?, ?)',
          s.id, s.nameArabic, s.nameTranslation, s.revelationType, s.ayahCount, s.juzStart, s.pageStart
        );
      }
      // DO NOT REPLACE parent rows: that would cascade-delete bookmarks/progress.
      await db.execAsync(`
        INSERT OR IGNORE INTO ayahs SELECT * FROM bundled.ayahs;
        INSERT OR IGNORE INTO translations SELECT * FROM bundled.translations;
        UPDATE ayahs SET text_tajweed = (
          SELECT text_tajweed FROM bundled.ayahs b WHERE b.id = ayahs.id
        );
        INSERT OR REPLACE INTO content_versions VALUES ('quran', 1);
      `);
    });
  } finally {
    await db.execAsync('DETACH DATABASE bundled');
  }
}

export function initializeDatabase(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    const db = await SQLite.openDatabaseAsync('hifzhub.db');
    try {
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      await initDatabaseTables(db);
      persistentSqliteDb = db;
    } catch (error) {
      await db.closeAsync();
      throw error;
    }
  })().catch((error: unknown) => {
    initialization = null; // A failed initialization must be retryable.
    throw error;
  });
  return initialization;
}
