import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import {
  searchQuran,
  type QuranSearchResults,
} from '@/features/quran/services/quranSearchService';

const RECENT_SEARCHES_KEY = '@hifzhub_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export type SearchFilterType = 'all' | 'surahs' | 'ayahs';

const emptyResults: QuranSearchResults = {
  query: '',
  referenceMatch: null,
  surahs: [],
  ayahs: [],
  totalMatches: 0,
};

export interface UseQuranSearchResult {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;
  activeFilter: SearchFilterType;
  setActiveFilter: (filter: SearchFilterType) => void;
  results: QuranSearchResults;
  isSearching: boolean;
  recentSearches: string[];
  addRecentSearch: (searchTerm: string) => void;
  removeRecentSearch: (searchTerm: string) => void;
  clearRecentSearches: () => void;
}

export const useQuranSearch = (): UseQuranSearchResult => {
  const { i18n } = useTranslation();
  const language = (i18n.language === 'uz' ? 'uz' : 'ru') as 'ru' | 'uz';

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');
  const [results, setResults] = useState<QuranSearchResults>(emptyResults);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
          }
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveRecentSearches = useCallback(async (list: string[]) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    } catch {}
  }, []);

  const addRecentSearch = useCallback(
    (searchTerm: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed || trimmed.length < 2) return;

      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (s) => s.toLowerCase() !== trimmed.toLowerCase()
        );
        const next = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        void saveRecentSearches(next);
        return next;
      });
    },
    [saveRecentSearches]
  );

  const removeRecentSearch = useCallback(
    (searchTerm: string) => {
      setRecentSearches((prev) => {
        const next = prev.filter((s) => s !== searchTerm);
        void saveRecentSearches(next);
        return next;
      });
    },
    [saveRecentSearches]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    void saveRecentSearches([]);
  }, [saveRecentSearches]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setResults(emptyResults);
    setIsSearching(false);
  }, []);

  // Debounced search runner
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(emptyResults);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const res = searchQuran(trimmed, language, { limit: 40 });
        setResults(res);
      } catch (err) {
        console.warn('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 120);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, language]);

  return {
    query,
    setQuery,
    clearQuery,
    activeFilter,
    setActiveFilter,
    results,
    isSearching,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
};
