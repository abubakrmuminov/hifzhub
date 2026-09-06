import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// 1. Surahs (Reference Data)
export const surahs = sqliteTable('surahs', {
  id: integer('id').primaryKey(),
  nameArabic: text('name_arabic').notNull(),
  nameTranslation: text('name_translation').notNull(), // JSON string: { ru: string, uz: string }
  revelationType: text('revelation_type').notNull(), // 'Meccan' | 'Medinan'
  ayahCount: integer('ayah_count').notNull(),
  juzStart: integer('juz_start').notNull(),
  pageStart: integer('page_start').notNull(),
});

// 2. Ayahs (Reference Data)
export const ayahs = sqliteTable('ayahs', {
  id: integer('id').primaryKey(),
  surahId: integer('surah_id')
    .notNull()
    .references(() => surahs.id, { onDelete: 'cascade' }),
  ayahNumber: integer('ayah_number').notNull(),
  textUthmani: text('text_uthmani').notNull(),
  textTajweed: text('text_tajweed'),
  juz: integer('juz').notNull(),
  hizb: integer('hizb').notNull(),
  page: integer('page').notNull(),
});

// 3. Words (Reference Data)
export const words = sqliteTable('words', {
  id: integer('id').primaryKey(),
  ayahId: integer('ayah_id')
    .notNull()
    .references(() => ayahs.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  textArabic: text('text_arabic').notNull(),
  transliteration: text('transliteration'),
  translation: text('translation'), // JSON string: { ru: string, uz: string }
});

// 4. Translations (Reference Data)
export const translations = sqliteTable('translations', {
  id: integer('id').primaryKey(),
  ayahId: integer('ayah_id')
    .notNull()
    .references(() => ayahs.id, { onDelete: 'cascade' }),
  language: text('language').notNull(), // 'ru' | 'uz'
  translator: text('translator').notNull(),
  text: text('text').notNull(),
});

// 5. Bookmarks (User Data)
export const bookmarks = sqliteTable('bookmarks', {
  id: text('id').primaryKey(), // Client-generated UUID
  ayahId: integer('ayah_id')
    .notNull()
    .references(() => ayahs.id, { onDelete: 'cascade' }),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'), // Soft delete timestamp
  syncStatus: text('sync_status').notNull().default('pending'), // 'pending' | 'synced' | 'failed'
});

// 6. Reading Progress (User Data)
export const readingProgress = sqliteTable('reading_progress', {
  id: text('id').primaryKey(), // Client-generated UUID
  surahId: integer('surah_id')
    .notNull()
    .references(() => surahs.id, { onDelete: 'cascade' }),
  lastAyah: integer('last_ayah').notNull(),
  completed: integer('completed').notNull().default(0), // 0 = false, 1 = true
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'), // Soft delete timestamp
  syncStatus: text('sync_status').notNull().default('pending'),
});

// 7. Downloaded Audio (Local Cache Metadata)
export const downloadedAudio = sqliteTable('downloaded_audio', {
  id: text('id').primaryKey(),
  surahId: integer('surah_id')
    .notNull()
    .references(() => surahs.id, { onDelete: 'cascade' }),
  reciterId: text('reciter_id').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  downloadedAt: integer('downloaded_at').notNull(),
});

// 8. Memorization Cards (User Data - FSRS Spaced Repetition)
export const memorizationCards = sqliteTable('memorization_cards', {
  id: text('id').primaryKey(), // Client-generated UUID
  surahId: integer('surah_id')
    .notNull()
    .references(() => surahs.id, { onDelete: 'cascade' }),
  ayahStart: integer('ayah_start').notNull(),
  ayahEnd: integer('ayah_end').notNull(),
  difficulty: real('difficulty').notNull(),
  stability: real('stability').notNull(),
  interval: integer('interval').notNull(),
  repetitions: integer('repetitions').notNull(),
  nextReviewAt: integer('next_review_at').notNull(),
  lastReviewedAt: integer('last_reviewed_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'), // Soft delete timestamp
  syncStatus: text('sync_status').notNull().default('pending'),
});

// Type Definitions for Inferred Models
export type Surah = InferSelectModel<typeof surahs>;
export type NewSurah = InferInsertModel<typeof surahs>;

export type Ayah = InferSelectModel<typeof ayahs>;
export type NewAyah = InferInsertModel<typeof ayahs>;

export type Word = InferSelectModel<typeof words>;
export type NewWord = InferInsertModel<typeof words>;

export type Translation = InferSelectModel<typeof translations>;
export type NewTranslation = InferInsertModel<typeof translations>;

export type Bookmark = InferSelectModel<typeof bookmarks>;
export type NewBookmark = InferInsertModel<typeof bookmarks>;

export type ReadingProgress = InferSelectModel<typeof readingProgress>;
export type NewReadingProgress = InferInsertModel<typeof readingProgress>;

export type DownloadedAudio = InferSelectModel<typeof downloadedAudio>;
export type NewDownloadedAudio = InferInsertModel<typeof downloadedAudio>;

export type MemorizationCard = InferSelectModel<typeof memorizationCards>;
export type NewMemorizationCard = InferInsertModel<typeof memorizationCards>;
