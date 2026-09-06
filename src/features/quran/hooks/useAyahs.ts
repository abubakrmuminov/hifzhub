import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSqliteDb } from '@/db/client';
import type { Ayah, Translation } from '@/db/schema';

export interface UseAyahsParams {
  surahId: number;
  language?: 'ru' | 'uz';
}

export interface UseAyahsResult {
  ayahs: Ayah[];
  translations: Translation[];
  translationsMap: Record<number, Translation>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const fetchAyahsSync = (surahId: number): Ayah[] => {
  if (!surahId) return [];
  try {
    const sqliteDb = getSqliteDb();
    const rows = sqliteDb.getAllSync<Ayah>(
      `SELECT id, surah_id AS surahId, ayah_number AS ayahNumber, text_uthmani AS textUthmani, text_tajweed AS textTajweed, juz, hizb, page 
       FROM ayahs 
       WHERE surah_id = ? 
       ORDER BY ayah_number ASC;`,
      [surahId]
    );
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn('SQLite fetchAyahsSync error:', err);
  }

  // Lazy fallback only if SQLite returned empty
  try {
    const allAyahs: Ayah[] = require('../../../../assets/data/quran-full-ayahs.json');
    return allAyahs.filter((a) => a.surahId === surahId);
  } catch (jsonErr) {
    console.warn('Fallback JSON load failed:', jsonErr);
    return [];
  }
};

const fetchTranslationsSync = (
  surahId: number,
  language?: 'ru' | 'uz'
): Translation[] => {
  if (!surahId) return [];
  try {
    const sqliteDb = getSqliteDb();
    const query = language
      ? `SELECT t.id, t.ayah_id AS ayahId, t.language, t.translator, t.text 
         FROM translations t 
         INNER JOIN ayahs a ON t.ayah_id = a.id 
         WHERE a.surah_id = ? AND t.language = ? 
         ORDER BY a.ayah_number ASC;`
      : `SELECT t.id, t.ayah_id AS ayahId, t.language, t.translator, t.text 
         FROM translations t 
         INNER JOIN ayahs a ON t.ayah_id = a.id 
         WHERE a.surah_id = ? 
         ORDER BY a.ayah_number ASC;`;
    const params = language ? [surahId, language] : [surahId];
    const rows = sqliteDb.getAllSync<Translation>(query, params);
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn('SQLite fetchTranslationsSync error:', err);
  }

  // Lazy fallback only if SQLite returned empty
  try {
    const allAyahs: Ayah[] = require('../../../../assets/data/quran-full-ayahs.json');
    const allTrans: Translation[] = require('../../../../assets/data/quran-full-translations.json');
    const targetAyahs = allAyahs.filter((a) => a.surahId === surahId);
    const ayahIds = new Set(targetAyahs.map((a) => a.id));
    return allTrans.filter(
      (t) => ayahIds.has(t.ayahId) && (!language || t.language === language)
    );
  } catch (jsonErr) {
    console.warn('Fallback JSON translations failed:', jsonErr);
    return [];
  }
};

export const useAyahs = ({
  surahId,
  language,
}: UseAyahsParams): UseAyahsResult => {
  const [ayahs, setAyahs] = useState<Ayah[]>(() => fetchAyahsSync(surahId));
  const [translations, setTranslations] = useState<Translation[]>(() =>
    fetchTranslationsSync(surahId, language)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const loadedAyahs = fetchAyahsSync(surahId);
      const loadedTrans = fetchTranslationsSync(surahId, language);
      setAyahs(loadedAyahs);
      setTranslations(loadedTrans);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [surahId, language]);

  const refetch = useCallback(async () => {
    if (!surahId) return;
    try {
      setIsLoading(true);
      setError(null);
      const loadedAyahs = fetchAyahsSync(surahId);
      const loadedTrans = fetchTranslationsSync(surahId, language);
      setAyahs(loadedAyahs);
      setTranslations(loadedTrans);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [surahId, language]);

  const translationsMap = useMemo(() => {
    const map: Record<number, Translation> = {};
    for (const t of translations) {
      map[t.ayahId] = t;
    }
    return map;
  }, [translations]);

  return {
    ayahs,
    translations,
    translationsMap,
    isLoading,
    error,
    refetch,
  };
};
