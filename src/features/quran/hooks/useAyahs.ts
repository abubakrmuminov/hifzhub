import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Ayah, Translation } from '@/db/schema';
import { ayahsQuery, translationsQuery } from '../services/quranRepository';

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

const EMPTY_AYAHS: Ayah[] = [];
const EMPTY_TRANSLATIONS: Translation[] = [];

export function useAyahs({ surahId, language }: UseAyahsParams): UseAyahsResult {
  const ayahResult = useQuery(ayahsQuery(surahId));
  const translationResult = useQuery(translationsQuery(surahId, language));
  const translations = translationResult.data ?? EMPTY_TRANSLATIONS;
  const translationsMap = useMemo(() => Object.fromEntries(
    translations.map((translation) => [translation.ayahId, translation])
  ), [translations]);
  const { refetch: refetchAyahs } = ayahResult;
  const { refetch: refetchTranslations } = translationResult;
  const refetch = useCallback(async () => {
    await Promise.all([refetchAyahs(), refetchTranslations()]);
  }, [refetchAyahs, refetchTranslations]);

  return {
    ayahs: ayahResult.data ?? EMPTY_AYAHS,
    translations,
    translationsMap,
    isLoading: ayahResult.isPending || translationResult.isPending,
    error: ayahResult.error ?? translationResult.error,
    refetch,
  };
}
