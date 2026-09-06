import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import type { JuzInfo, JuzProgress, JuzStatus, JuzSurahInfo } from '../types';

export const TOTAL_QURAN_VERSES = 6236;

interface RawJuzItem {
  id: number;
  nameArabic: string;
  nameRu: string;
  nameUz: string;
  startSurahId: number;
  startAyah: number;
  endSurahId: number;
  endAyah: number;
  totalAyahs: number;
}

const RAW_JUZ_LIST: RawJuzItem[] = [
  {
    id: 1,
    nameArabic: 'الم',
    nameRu: 'Алиф Лям Мим',
    nameUz: 'Alif Lom Mim',
    startSurahId: 1,
    startAyah: 1,
    endSurahId: 2,
    endAyah: 141,
    totalAyahs: 148,
  },
  {
    id: 2,
    nameArabic: 'سَيَقُولُ',
    nameRu: 'Сайакуль',
    nameUz: 'Sayaqul',
    startSurahId: 2,
    startAyah: 142,
    endSurahId: 2,
    endAyah: 252,
    totalAyahs: 111,
  },
  {
    id: 3,
    nameArabic: 'تِلْكَ الرُّسُلُ',
    nameRu: 'Тилькар-Русуль',
    nameUz: 'Tilkar-Rusul',
    startSurahId: 2,
    startAyah: 253,
    endSurahId: 3,
    endAyah: 92,
    totalAyahs: 126,
  },
  {
    id: 4,
    nameArabic: 'لَنْ تَنَالُوا',
    nameRu: 'Лян Таналю',
    nameUz: 'Lan Tanalu',
    startSurahId: 3,
    startAyah: 93,
    endSurahId: 4,
    endAyah: 23,
    totalAyahs: 131,
  },
  {
    id: 5,
    nameArabic: 'وَالْمُحْصَنَاتُ',
    nameRu: 'Валь-Мухсанат',
    nameUz: 'Val-Muhsanot',
    startSurahId: 4,
    startAyah: 24,
    endSurahId: 4,
    endAyah: 147,
    totalAyahs: 124,
  },
  {
    id: 6,
    nameArabic: 'لَا يُحِبُّ اللَّهُ',
    nameRu: 'Ля Йухиббуллах',
    nameUz: 'La Yuhibbulloh',
    startSurahId: 4,
    startAyah: 148,
    endSurahId: 5,
    endAyah: 81,
    totalAyahs: 110,
  },
  {
    id: 7,
    nameArabic: 'وَإِذَا سَمِعُوا',
    nameRu: 'Ва Иза Самиу',
    nameUz: 'Va Izo Sami‘u',
    startSurahId: 5,
    startAyah: 82,
    endSurahId: 6,
    endAyah: 110,
    totalAyahs: 149,
  },
  {
    id: 8,
    nameArabic: 'وَلَوْ أَنَّنَا',
    nameRu: 'Ва Ляв Аннона',
    nameUz: 'Va Lav Annana',
    startSurahId: 6,
    startAyah: 111,
    endSurahId: 7,
    endAyah: 87,
    totalAyahs: 142,
  },
  {
    id: 9,
    nameArabic: 'قَالَ الْمَلَأُ',
    nameRu: 'Коляль-Мала’у',
    nameUz: 'Qolal-Mala’u',
    startSurahId: 7,
    startAyah: 88,
    endSurahId: 8,
    endAyah: 40,
    totalAyahs: 159,
  },
  {
    id: 10,
    nameArabic: 'وَاعْلَمُوا',
    nameRu: 'Ва’ляму',
    nameUz: 'Va’lamu',
    startSurahId: 8,
    startAyah: 41,
    endSurahId: 9,
    endAyah: 92,
    totalAyahs: 127,
  },
  {
    id: 11,
    nameArabic: 'يَعْتَذِرُونَ',
    nameRu: 'Я’тазирун',
    nameUz: 'Ya’tazirun',
    startSurahId: 9,
    startAyah: 93,
    endSurahId: 11,
    endAyah: 5,
    totalAyahs: 151,
  },
  {
    id: 12,
    nameArabic: 'وَمَا مِنْ دَابَّةٍ',
    nameRu: 'Ва Ма Мин Дабба',
    nameUz: 'Va Ma Min Dabba',
    startSurahId: 11,
    startAyah: 6,
    endSurahId: 12,
    endAyah: 52,
    totalAyahs: 170,
  },
  {
    id: 13,
    nameArabic: 'وَمَا أُبَرِّئُ',
    nameRu: 'Ва Ма Убарри’у',
    nameUz: 'Va Ma Уbarri’u',
    startSurahId: 12,
    startAyah: 53,
    endSurahId: 14,
    endAyah: 52,
    totalAyahs: 154,
  },
  {
    id: 14,
    nameArabic: 'رُبَمَا',
    nameRu: 'Рубама',
    nameUz: 'Rubama',
    startSurahId: 15,
    startAyah: 1,
    endSurahId: 16,
    endAyah: 128,
    totalAyahs: 227,
  },
  {
    id: 15,
    nameArabic: 'سُبْحَانَ الَّذِي',
    nameRu: 'Субханаллязи',
    nameUz: 'Subhanallazi',
    startSurahId: 17,
    startAyah: 1,
    endSurahId: 18,
    endAyah: 74,
    totalAyahs: 185,
  },
  {
    id: 16,
    nameArabic: 'قَالَ أَلَمْ',
    nameRu: 'Коля Алям',
    nameUz: 'Qola Alam',
    startSurahId: 18,
    startAyah: 75,
    endSurahId: 20,
    endAyah: 135,
    totalAyahs: 269,
  },
  {
    id: 17,
    nameArabic: 'اقْتَرَبَ لِلنَّاسِ',
    nameRu: 'Иктараба Лин-Нас',
    nameUz: 'Iqtaraba Lin-Nos',
    startSurahId: 21,
    startAyah: 1,
    endSurahId: 22,
    endAyah: 78,
    totalAyahs: 190,
  },
  {
    id: 18,
    nameArabic: 'قَدْ أَفْلَحَ',
    nameRu: 'Кад Афляха',
    nameUz: 'Qod Aflaha',
    startSurahId: 23,
    startAyah: 1,
    endSurahId: 25,
    endAyah: 20,
    totalAyahs: 202,
  },
  {
    id: 19,
    nameArabic: 'وَقَالَ الَّذِينَ',
    nameRu: 'Ва Коляллязина',
    nameUz: 'Va Qolallazina',
    startSurahId: 25,
    startAyah: 21,
    endSurahId: 27,
    endAyah: 55,
    totalAyahs: 339,
  },
  {
    id: 20,
    nameArabic: 'أَمَّنْ خَلَقَ',
    nameRu: 'Амман Холяка',
    nameUz: 'Amman Xolaqa',
    startSurahId: 27,
    startAyah: 56,
    endSurahId: 29,
    endAyah: 45,
    totalAyahs: 171,
  },
  {
    id: 21,
    nameArabic: 'اتْلُ مَا أُوحِيَ',
    nameRu: 'Утлю Ма Ухия',
    nameUz: 'Utlu Ma Uhiya',
    startSurahId: 29,
    startAyah: 46,
    endSurahId: 33,
    endAyah: 30,
    totalAyahs: 178,
  },
  {
    id: 22,
    nameArabic: 'وَمَنْ يَقْنُتْ',
    nameRu: 'Ва Ман Якнут',
    nameUz: 'Va Man Yaqnut',
    startSurahId: 33,
    startAyah: 31,
    endSurahId: 36,
    endAyah: 27,
    totalAyahs: 169,
  },
  {
    id: 23,
    nameArabic: 'وَمَا لِيَ',
    nameRu: 'Ва Ма Лийа',
    nameUz: 'Va Ma Liya',
    startSurahId: 36,
    startAyah: 28,
    endSurahId: 39,
    endAyah: 31,
    totalAyahs: 357,
  },
  {
    id: 24,
    nameArabic: 'فَمَنْ أَظْلَمُ',
    nameRu: 'Фаман Азляму',
    nameUz: 'Faman Azlamu',
    startSurahId: 39,
    startAyah: 32,
    endSurahId: 41,
    endAyah: 46,
    totalAyahs: 175,
  },
  {
    id: 25,
    nameArabic: 'إِلَيْهِ يُرَدُّ',
    nameRu: 'Иляйхи Юрадду',
    nameUz: 'Ilayhi Yuraddu',
    startSurahId: 41,
    startAyah: 47,
    endSurahId: 45,
    endAyah: 37,
    totalAyahs: 246,
  },
  {
    id: 26,
    nameArabic: 'حم',
    nameRu: 'Ха Мим',
    nameUz: 'Ha Mim',
    startSurahId: 46,
    startAyah: 1,
    endSurahId: 51,
    endAyah: 30,
    totalAyahs: 195,
  },
  {
    id: 27,
    nameArabic: 'قَالَ فَمَا خَطْبُكُمْ',
    nameRu: 'Коля Фама Хотбукум',
    nameUz: 'Qola Fama Xotbukum',
    startSurahId: 51,
    startAyah: 31,
    endSurahId: 57,
    endAyah: 29,
    totalAyahs: 399,
  },
  {
    id: 28,
    nameArabic: 'قَدْ سَمِعَ اللَّهُ',
    nameRu: 'Кад Сами’аллах',
    nameUz: 'Qod Sami’alloh',
    startSurahId: 58,
    startAyah: 1,
    endSurahId: 66,
    endAyah: 12,
    totalAyahs: 137,
  },
  {
    id: 29,
    nameArabic: 'تَبَارَكَ الَّذِي',
    nameRu: 'Табарак',
    nameUz: 'Taborak',
    startSurahId: 67,
    startAyah: 1,
    endSurahId: 77,
    endAyah: 50,
    totalAyahs: 431,
  },
  {
    id: 30,
    nameArabic: 'عَمَّ',
    nameRu: 'Амма',
    nameUz: 'Amma',
    startSurahId: 78,
    startAyah: 1,
    endSurahId: 114,
    endAyah: 6,
    totalAyahs: 564,
  },
];

function getSurahsForJuz(
  startSurahId: number,
  startAyah: number,
  endSurahId: number,
  endAyah: number
): JuzSurahInfo[] {
  const result: JuzSurahInfo[] = [];
  for (let sId = startSurahId; sId <= endSurahId; sId++) {
    const s = SURAHS_DATA.find((item) => item.id === sId);
    if (!s) continue;
    let nameRu = '';
    let nameUz = '';
    try {
      const parsed = JSON.parse(s.nameTranslation);
      nameRu = parsed.ru || '';
      nameUz = parsed.uz || '';
    } catch {
      nameRu = s.nameTranslation;
    }
    const sStart = sId === startSurahId ? startAyah : 1;
    const sEnd = sId === endSurahId ? endAyah : s.ayahCount;
    const count = sEnd - sStart + 1;
    result.push({
      id: s.id,
      nameRu,
      nameUz,
      nameArabic: s.nameArabic,
      startAyah: sStart,
      endAyah: sEnd,
      totalAyahs: count,
      ayahCount: count,
    });
  }
  return result;
}

export const JUZ_LIST: JuzInfo[] = RAW_JUZ_LIST.map((raw) => ({
  ...raw,
  juzNumber: raw.id,
  nameTransliteration: raw.nameRu,
  surahs: getSurahsForJuz(raw.startSurahId, raw.startAyah, raw.endSurahId, raw.endAyah),
}));

export const JUZ_DATA = JUZ_LIST;

/**
 * Checks whether a given ayah (surahId, ayahNumber) falls within the boundary of a Juz.
 */
export function isAyahInJuz(surahId: number, ayahNumber: number, juz: {
  startSurahId: number;
  startAyah: number;
  endSurahId: number;
  endAyah: number;
}): boolean {
  if (surahId < juz.startSurahId || surahId > juz.endSurahId) {
    return false;
  }
  if (surahId === juz.startSurahId && ayahNumber < juz.startAyah) {
    return false;
  }
  if (surahId === juz.endSurahId && ayahNumber > juz.endAyah) {
    return false;
  }
  return true;
}

/**
 * Finds which Juz a given ayah belongs to.
 */
export function getJuzForAyah(surahId: number, ayahNumber: number): JuzInfo | undefined {
  return JUZ_LIST.find((juz) => isAyahInJuz(surahId, ayahNumber, juz));
}

/**
 * Calculates progress for a single Juz based on number of memorized ayahs.
 */
export function calculateJuzProgress(juz: JuzInfo, memorizedCount: number): JuzProgress {
  const memorized = Math.min(juz.totalAyahs, Math.max(0, memorizedCount));
  const percentage =
    juz.totalAyahs > 0 ? Math.min(100, Math.round((memorized / juz.totalAyahs) * 100)) : 0;
  const isCompleted = memorized >= juz.totalAyahs && juz.totalAyahs > 0;
  let status: JuzStatus = 'not_started';
  if (isCompleted) {
    status = 'completed';
  } else if (memorized > 0) {
    status = 'in_progress';
  }

  return {
    ...juz,
    memorizedAyahs: memorized,
    percentage,
    isCompleted,
    status,
    totalVerses: juz.totalAyahs,
    memorizedVerses: memorized,
  };
}
