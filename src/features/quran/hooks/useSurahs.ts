import type { Surah } from '@/db/schema';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';

export interface UseSurahsResult {
  surahs: Surah[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useSurahs = (): UseSurahsResult => {
  return {
    surahs: SURAHS_DATA,
    isLoading: false,
    error: null,
    refetch: async () => {},
  };
};
