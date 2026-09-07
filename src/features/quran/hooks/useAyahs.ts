import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

interface CachedAyahData {
  ayahs: Ayah[];
  translations: Translation[];
  translationsMap: Record<number, Translation>;
}

const ayahsDataCache = new Map<string, CachedAyahData>();

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

  // Lazy memoized fallback only if SQLite returned empty
  try {
    const allAyahs = getFallbackAyahs();
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

  // Lazy memoized fallback only if SQLite returned empty
  try {
    const allAyahs = getFallbackAyahs();
    const allTrans = getFallbackTranslations();
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
  const cacheKey = `${surahId}_${language || 'all'}`;

  const loadData = useCallback((): CachedAyahData => {
    if (!surahId) {
      return { ayahs: [], translations: [], translationsMap: {} };
    }
    const cached = ayahsDataCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const ayahs = fetchAyahsSync(surahId);
    const translations = fetchTranslationsSync(surahId, language);
    const translationsMap: Record<number, Translation> = {};
    for (const t of translations) {
      translationsMap[t.ayahId] = t;
    }
    const result: CachedAyahData = { ayahs, translations, translationsMap };
    ayahsDataCache.set(cacheKey, result);
    return result;
  }, [surahId, language, cacheKey]);

  const [data, setData] = useState<CachedAyahData>(loadData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const prevKeyRef = useRef(cacheKey);

  useEffect(() => {
    if (prevKeyRef.current === cacheKey) {
      return; // Already initialized with loadData in useState! No double query on mount!
    }
    prevKeyRef.current = cacheKey;
    try {
      setData(loadData());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [cacheKey, loadData]);

  const refetch = useCallback(async () => {
    if (!surahId) return;
    try {
      setIsLoading(true);
      setError(null);
      ayahsDataCache.delete(cacheKey);
      setData(loadData());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [surahId, cacheKey, loadData]);

  return {
    ayahs: data.ayahs,
    translations: data.translations,
    translationsMap: data.translationsMap,
    isLoading,
    error,
    refetch,
  };
};
