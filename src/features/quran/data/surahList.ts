import { SURAHS_DATA } from './surahsData';

export interface SurahListItem {
  id: number;
  name: string;
  arabicName: string;
  ayahCount: number;
  revelationType: 'meccan' | 'medinan';
}

export const SURAH_LIST: SurahListItem[] = SURAHS_DATA.map((s) => {
  let name = '';
  try {
    const parsed = JSON.parse(s.nameTranslation);
    name = parsed.ru || '';
  } catch {
    name = s.nameTranslation;
  }
  return {
    id: s.id,
    name,
    arabicName: s.nameArabic,
    ayahCount: s.ayahCount,
    revelationType: s.revelationType.toLowerCase() as 'meccan' | 'medinan',
  };
});
