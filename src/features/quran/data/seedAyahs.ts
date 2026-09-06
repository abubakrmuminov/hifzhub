import type { Ayah, Translation } from '@/db/schema';

export interface SeedData {
  ayahs: Ayah[];
  translations: Translation[];
}

export const SEED_AYAHS: Ayah[] = [
  // Surah 1: Al-Fatihah
  { id: 1, surahId: 1, ayahNumber: 1, textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', textTajweed: null, juz: 1, hizb: 1, page: 1 },
  { id: 2, surahId: 1, ayahNumber: 2, textUthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', textTajweed: null, juz: 1, hizb: 1, page: 1 },
  { id: 3, surahId: 1, ayahNumber: 3, textUthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', textTajweed: null, juz: 1, hizb: 1, page: 1 },
  { id: 4, surahId: 1, ayahNumber: 4, textUthmani: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', textTajweed: null, juz: 1, hizb: 1, page: 1 },
  { id: 5, surahId: 1, ayahNumber: 5, textUthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', textTajweed: null, juz: 1, hizb: 1, page: 1 },
  { id: 6, surahId: 1, ayahNumber: 6, textUthmani: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', textTajweed: null, juz: 1, hizb: 1, page: 1 },
  { id: 7, surahId: 1, ayahNumber: 7, textUthmani: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', textTajweed: null, juz: 1, hizb: 1, page: 1 },

  // Surah 112: Al-Ikhlas
  { id: 6222, surahId: 112, ayahNumber: 1, textUthmani: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6223, surahId: 112, ayahNumber: 2, textUthmani: 'ٱللَّهُ ٱلصَّمَدُ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6224, surahId: 112, ayahNumber: 3, textUthmani: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6225, surahId: 112, ayahNumber: 4, textUthmani: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', textTajweed: null, juz: 30, hizb: 60, page: 604 },

  // Surah 113: Al-Falaq
  { id: 6226, surahId: 113, ayahNumber: 1, textUthmani: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6227, surahId: 113, ayahNumber: 2, textUthmani: 'مِن شَرِّ مَا خَلَقَ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6228, surahId: 113, ayahNumber: 3, textUthmani: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6229, surahId: 113, ayahNumber: 4, textUthmani: 'وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6230, surahId: 113, ayahNumber: 5, textUthmani: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', textTajweed: null, juz: 30, hizb: 60, page: 604 },

  // Surah 114: An-Nas
  { id: 6231, surahId: 114, ayahNumber: 1, textUthmani: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6232, surahId: 114, ayahNumber: 2, textUthmani: 'مَلِكِ ٱلنَّاسِ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6233, surahId: 114, ayahNumber: 3, textUthmani: 'إِلَٰهِ ٱلنَّاسِ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6234, surahId: 114, ayahNumber: 4, textUthmani: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6235, surahId: 114, ayahNumber: 5, textUthmani: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
  { id: 6236, surahId: 114, ayahNumber: 6, textUthmani: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ', textTajweed: null, juz: 30, hizb: 60, page: 604 },
];

export const SEED_TRANSLATIONS: Translation[] = [
  // Surah 1 - Russian (Эльмир Кулиев)
  { id: 1, ayahId: 1, language: 'ru', translator: 'Эльмир Кулиев', text: 'Во имя Аллаха, Милостивого, Милосердного!' },
  { id: 2, ayahId: 2, language: 'ru', translator: 'Эльмир Кулиев', text: 'Хвала Аллаху, Господу миров,' },
  { id: 3, ayahId: 3, language: 'ru', translator: 'Эльмир Кулиев', text: 'Милостивому, Милосердному,' },
  { id: 4, ayahId: 4, language: 'ru', translator: 'Эльмир Кулиев', text: 'Властелину Дня воздаяния!' },
  { id: 5, ayahId: 5, language: 'ru', translator: 'Эльмир Кулиев', text: 'Тебе одному мы поклоняемся и Тебя одного молим о помощи.' },
  { id: 6, ayahId: 6, language: 'ru', translator: 'Эльмир Кулиев', text: 'Веди нас прямым путем,' },
  { id: 7, ayahId: 7, language: 'ru', translator: 'Эльмир Кулиев', text: 'путем тех, кого Ты облагодетельствовал, не тех, на кого пал гнев, и не заблудших.' },

  // Surah 1 - Uzbek (Alauddin Mansur)
  { id: 8, ayahId: 1, language: 'uz', translator: 'Alaouddin Mansur', text: 'Mehribon va rahmli Allohning nomi bilan (boshlayman).' },
  { id: 9, ayahId: 2, language: 'uz', translator: 'Alaouddin Mansur', text: 'Hamd butun olamlar parvardigori Allohgadir,' },
  { id: 10, ayahId: 3, language: 'uz', translator: 'Alaouddin Mansur', text: 'U mehribon va rahmlidir,' },
  { id: 11, ayahId: 4, language: 'uz', translator: 'Alaouddin Mansur', text: 'Qiyomat kunining podshosidir.' },
  { id: 12, ayahId: 5, language: 'uz', translator: 'Alaouddin Mansur', text: 'Faqat Sengagina ibodat qilamiz va faqat Sendangina yordam so\'raymiz.' },
  { id: 13, ayahId: 6, language: 'uz', translator: 'Alaouddin Mansur', text: 'Bizni to\'g\'ri yo\'lga hidoyat etgin,' },
  { id: 14, ayahId: 7, language: 'uz', translator: 'Alaouddin Mansur', text: 'O\'zing ne\'mat bergan zotlarning yo\'liga, g\'azabga qolmagan va adashmaganlarning yo\'liga!' },

  // Surah 112 - Russian
  { id: 15, ayahId: 6222, language: 'ru', translator: 'Эльмир Кулиев', text: 'Скажи: «Он — Аллах Единый,' },
  { id: 16, ayahId: 6223, language: 'ru', translator: 'Эльмир Кулиев', text: 'Аллах Самодостаточный.' },
  { id: 17, ayahId: 6224, language: 'ru', translator: 'Эльмир Кулиев', text: 'Он не родил и не был рожден,' },
  { id: 18, ayahId: 6225, language: 'ru', translator: 'Эльмир Кулиев', text: 'и нет никого, равного Ему».' },

  // Surah 112 - Uzbek
  { id: 19, ayahId: 6222, language: 'uz', translator: 'Alaouddin Mansur', text: 'Ayting: «U — Alloh Yagonadir,' },
  { id: 20, ayahId: 6223, language: 'uz', translator: 'Alaouddin Mansur', text: 'Alloh behojatdir (barcha Unga muhtojdir).' },
  { id: 21, ayahId: 6224, language: 'uz', translator: 'Alaouddin Mansur', text: 'U tug\'magan va tug\'ilmagan ham.' },
  { id: 22, ayahId: 6225, language: 'uz', translator: 'Alaouddin Mansur', text: 'Va Unga teng bo\'lgan hech kim yo\'q».' },

  // Surah 113 - Russian
  { id: 23, ayahId: 6226, language: 'ru', translator: 'Эльмир Кулиев', text: 'Скажи: «Ищу убежища у Господа рассвета' },
  { id: 24, ayahId: 6227, language: 'ru', translator: 'Эльмир Кулиев', text: 'от зла того, что Он сотворил,' },
  { id: 25, ayahId: 6228, language: 'ru', translator: 'Эльмир Кулиев', text: 'от зла тьмы, когда она наступает,' },
  { id: 26, ayahId: 6229, language: 'ru', translator: 'Эльмир Кулиев', text: 'от зла колдуний, дующих на узлы,' },
  { id: 27, ayahId: 6230, language: 'ru', translator: 'Эльмир Кулиев', text: 'от зла завистника, когда он завидует».' },

  // Surah 113 - Uzbek
  { id: 28, ayahId: 6226, language: 'uz', translator: 'Alaouddin Mansur', text: 'Ayting: «Tong Robbidan panoh so\'rayman,' },
  { id: 29, ayahId: 6227, language: 'uz', translator: 'Alaouddin Mansur', text: 'yaratgan narsalarining yomonligidan,' },
  { id: 30, ayahId: 6228, language: 'uz', translator: 'Alaouddin Mansur', text: 'zulmatga cho\'mgan tun yomonligidan,' },
  { id: 31, ayahId: 6229, language: 'uz', translator: 'Alaouddin Mansur', text: 'tugunlarga dam uruvchilarning yomonligidan,' },
  { id: 32, ayahId: 6230, language: 'uz', translator: 'Alaouddin Mansur', text: 'va hasad qilayotgan hasadgo\'y yomonligidan».' },

  // Surah 114 - Russian
  { id: 33, ayahId: 6231, language: 'ru', translator: 'Эльмир Кулиев', text: 'Скажи: «Ищу убежища у Господа людей,' },
  { id: 34, ayahId: 6232, language: 'ru', translator: 'Эльмир Кулиев', text: 'Царя людей,' },
  { id: 35, ayahId: 6233, language: 'ru', translator: 'Эльмир Кулиев', text: 'Бога людей,' },
  { id: 36, ayahId: 6234, language: 'ru', translator: 'Эльмир Кулиев', text: 'от зла искусителя, исчезающего при поминании Аллаха,' },
  { id: 37, ayahId: 6235, language: 'ru', translator: 'Эльмир Кулиев', text: 'который наущает в груди людей,' },
  { id: 38, ayahId: 6236, language: 'ru', translator: 'Эльмир Кулиев', text: 'от джиннов и людей».' },

  // Surah 114 - Uzbek
  { id: 39, ayahId: 6231, language: 'uz', translator: 'Alaouddin Mansur', text: 'Ayting: «Odamlar Robbidan panoh so\'rayman,' },
  { id: 40, ayahId: 6232, language: 'uz', translator: 'Alaouddin Mansur', text: 'odamlar Podshosidan,' },
  { id: 41, ayahId: 6233, language: 'uz', translator: 'Alaouddin Mansur', text: 'odamlar Ilohidan,' },
  { id: 42, ayahId: 6234, language: 'uz', translator: 'Alaouddin Mansur', text: 'vasvasa soluvchi, berkilib yuruvchi shayton yomonligidan,' },
  { id: 43, ayahId: 6235, language: 'uz', translator: 'Alaouddin Mansur', text: 'odamlarning dillariga vasvasa soladigan,' },
  { id: 44, ayahId: 6236, language: 'uz', translator: 'Alaouddin Mansur', text: 'jinlar va odamlardan bo\'lgan shayton yomonligidan».' },
];
