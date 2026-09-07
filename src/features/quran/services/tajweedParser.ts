import React from 'react';

export type TajweedRuleCode =
  | 'q' // Qalqalah
  | 'g' // Ghunnah
  | 'f' // Ikhfa
  | 'c' // Ikhfa Shafawi
  | 'i' // Iqlab
  | 'a' // Idgham with Ghunnah
  | 'u' // Idgham without Ghunnah
  | 'd' // Idgham Mutajanisayn
  | 'b' // Idgham Mutaqaribayn
  | 'w' // Idgham Shafawi
  | 'm' // Madd Lazim (6)
  | 'o' // Madd Wajib (4-5)
  | 'p' // Madd Ja'iz (2, 4, 6)
  | 'n' // Madd Tabii (2)
  | 'k' // Tafkheem (Heavy letters)
  | 'h' // Hamzat ul Wasl
  | 's' // Silent letter
  | 'l'; // Lam Shamsiyyah

export type TajweedRuleFamily =
  | 'tafkheem'
  | 'qalqalah'
  | 'ghunnah'
  | 'ikhfa'
  | 'idgham'
  | 'iqlab'
  | 'madd'
  | 'silent';

export interface TajweedRuleInfo {
  code: TajweedRuleCode;
  family: TajweedRuleFamily;
  nameAr: string;
  nameRu: string;
  nameUz: string;
  categoryRu: string;
  categoryUz: string;
  descriptionRu: string;
  descriptionUz: string;
  howToReadRu: string;
  howToReadUz: string;
  durationRu?: string;
  durationUz?: string;
  lettersAr?: string;
  lightColor: string;
  darkColor: string;
}

export interface TajweedSegment {
  text: string;
  ruleCode?: TajweedRuleCode;
  rule?: TajweedRuleInfo;
}

export interface TajweedFamilyGuide {
  family: TajweedRuleFamily;
  nameAr: string;
  nameRu: string;
  nameUz: string;
  colorLight: string;
  colorDark: string;
  summaryRu: string;
  summaryUz: string;
  exampleLetters: string;
}

export const TAJWEED_RULES: Record<TajweedRuleCode, TajweedRuleInfo> = {
  // 1. QALQALAH
  q: {
    code: 'q',
    family: 'qalqalah',
    nameAr: 'قَلْقَلَة',
    nameRu: 'Калькаля',
    nameUz: 'Qalqala',
    categoryRu: 'Колебание / Эхо',
    categoryUz: 'Tebranish / Qalqala',
    descriptionRu: 'Сотрясение или отскок звука при сукуне на одной из пяти согласных букв.',
    descriptionUz: 'Besh undosh harfda sukun bo‘lganda tovushning tebranishi va jaranglashi.',
    howToReadRu: 'Произносите звук с чётким эхом и отскоком, не превращая его в огласовку (фатху или кясру).',
    howToReadUz: 'Tovushni harakatga (fatha yoki kasraga) aylantirmasdan, tiniq tebranish bilan o‘qing.',
    durationRu: 'Мгновенный отскок',
    durationUz: 'Tezkor tebranish',
    lettersAr: 'ق ، ط ، ب ، ج ، د  (قُطْبُ جَدّ)',
    lightColor: '#1E88E5',
    darkColor: '#42A5F5',
  },

  // 2. GHUNNAH
  g: {
    code: 'g',
    family: 'ghunnah',
    nameAr: 'غُنَّة مُشَدَّدَة',
    nameRu: 'Гунна (Удвоенная)',
    nameUz: 'G‘unna (Tashdidli)',
    categoryRu: 'Назализация',
    categoryUz: 'Dimog‘ tovushi',
    descriptionRu: 'Глубокий носовой звук, обязательный при удвоении букв Нун (نّ) или Мим (مّ).',
    descriptionUz: 'Tashdidli Nun (نّ) yoki Mim (مّ) harflarida dimog‘dan chiqariladigan ohangdor ovoz.',
    howToReadRu: 'Задержите звучание в носовой полости ровно на 2 счёта (хараката), плавно смыкая звук.',
    howToReadUz: 'Tovushni dimog‘da roppa-rosa 2 ta harakat miqdorida ushlab turib o‘qing.',
    durationRu: '2 счёта (хараката)',
    durationUz: '2 ta harakat',
    lettersAr: 'نّ ، مّ',
    lightColor: '#43A047',
    darkColor: '#66BB6A',
  },

  // 3. IKHFA
  f: {
    code: 'f',
    family: 'ikhfa',
    nameAr: 'إِخْفَاء حَقِيقِيّ',
    nameRu: 'Ихфа (Истинное)',
    nameUz: 'Haqiqiy Ixfo',
    categoryRu: 'Сокрытие звука',
    categoryUz: 'Yashirish / Ixfo',
    descriptionRu: 'Сокрытие звука Нун сакина или танвина при встрече с одной из 15 букв Ихфа.',
    descriptionUz: 'Sukunli Nun yoki tanvin 15 ta ixfo harflaridan biriga yo‘liqqanda n tovushini yashirish.',
    howToReadRu: 'Звук «Н» не произносится отчётливо, а скрывается на уровне кончика языка с удержанием носового призвука (гунны) на 2 счёта.',
    howToReadUz: 'Til uchini qattiq tekkizmasdan, n tovushini dimog‘da 2 harakat miqdorida yashirin holda o‘qing.',
    durationRu: '2 счёта с гунной',
    durationUz: '2 harakat g‘unna bilan',
    lettersAr: 'ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك',
    lightColor: '#2E7D32',
    darkColor: '#4CAF50',
  },
  c: {
    code: 'c',
    family: 'ikhfa',
    nameAr: 'إِخْفَاء شَفَوِيّ',
    nameRu: 'Ихфа Шафави (Губное)',
    nameUz: 'Labiy Ixfo (Shafaviy)',
    categoryRu: 'Сокрытие губами',
    categoryUz: 'Labiy yashirish',
    descriptionRu: 'Сокрытие звука Мим сакина при встрече со следующей буквой Ба (ب).',
    descriptionUz: 'Sukunli Mim harfi o‘zidan keyingi Ba (ب) harfiga yo‘liqqanda yashirib o‘qilishi.',
    howToReadRu: 'Легко сомкните губы без сильного давления и удерживайте носовой звук на 2 счёта перед переходом к букве Ба.',
    howToReadUz: 'Lablarni qattiq qismagan holda, mimni 2 harakat dimog‘ ohangi bilan ushlab Ba harfiga o‘ting.',
    durationRu: '2 счёта с гунной',
    durationUz: '2 harakat g‘unna bilan',
    lettersAr: 'مْ перед ب',
    lightColor: '#388E3C',
    darkColor: '#66BB6A',
  },

  // 4. IQLAB
  i: {
    code: 'i',
    family: 'iqlab',
    nameAr: 'إِقْلَاب',
    nameRu: 'Икляб (Превращение)',
    nameUz: 'Iqlab (O‘zgartirish)',
    categoryRu: 'Превращение звука',
    categoryUz: 'Tovushni o‘zgartirish',
    descriptionRu: 'Превращение Нун сакина или танвина в звук Мим (م) перед буквой Ба (ب).',
    descriptionUz: 'Sukunli Nun yoki tanvin Ba (ب) harfidan oldin kelganda Mim (م) ga aylanishi.',
    howToReadRu: 'Произнесите лёгкий звук «М» вместо «Н» с нежным смыканием губ и удержанием гунны на 2 счёта.',
    howToReadUz: 'N o‘rniga mayin M tovushini aytib, lablarni yengil yopgan holda 2 harakat dimog‘da cho‘zing.',
    durationRu: '2 счёта с гунной',
    durationUz: '2 harakat g‘unna bilan',
    lettersAr: 'نْ / ً ٍ ٌ перед ب',
    lightColor: '#00897B',
    darkColor: '#26A69A',
  },

  // 5. IDGHAM
  a: {
    code: 'a',
    family: 'idgham',
    nameAr: 'إِدْغَام بِغُنَّة',
    nameRu: 'Идгам с гунной',
    nameUz: 'G‘unnali Idg‘om',
    categoryRu: 'Слияние с назализацией',
    categoryUz: 'Dimog‘ bilan qo‘shish',
    descriptionRu: 'Слияние Нун сакина или танвина с последующей буквой из группы ي، ن، م، و.',
    descriptionUz: 'Sukunli Nun yoki tanvinning Ya, Nun, Mim, Vov harflariga dimog‘ tovushi bilan qo‘shilishi.',
    howToReadRu: 'Влейте первый звук во второй, удерживая красивую носовую гунну на 2 счёта.',
    howToReadUz: 'Birinchi harfni keyingisiga qo‘shib, 2 harakat miqdorida dimog‘ ohangi bilan o‘qing.',
    durationRu: '2 счёта с гунной',
    durationUz: '2 harakat g‘unna bilan',
    lettersAr: 'ي ، ن ، م ، و  (يَنْمُو)',
    lightColor: '#8E24AA',
    darkColor: '#BA68C8',
  },
  u: {
    code: 'u',
    family: 'idgham',
    nameAr: 'إِدْغَام بِلَا غُنَّة',
    nameRu: 'Идгам без гунны',
    nameUz: 'G‘unnasiz Idg‘om',
    categoryRu: 'Полное слияние',
    categoryUz: 'To‘liq qo‘shish',
    descriptionRu: 'Полное растворение Нун сакина или танвина в буквах Лям (ل) или Ра (ر).',
    descriptionUz: 'Sukunli Nun yoki tanvinning Lom (ل) yoki Ro (ر) harfiga dimog‘siz to‘liq qo‘shilishi.',
    howToReadRu: 'Полностью перейдите к удвоенной следующей букве без задержки и без носового звука.',
    howToReadUz: 'Nun tovushini butunlay qoldirib, keyingi harfni tashdid bilan darhol o‘qing.',
    durationRu: 'Мгновенный переход',
    durationUz: 'Darhol o‘tish',
    lettersAr: 'ل ، ر',
    lightColor: '#7B1FA2',
    darkColor: '#CE93D8',
  },
  d: {
    code: 'd',
    family: 'idgham',
    nameAr: 'إِدْغَام مُتَجَانِسَيْن',
    nameRu: 'Идгам однородных букв',
    nameUz: 'Mutajonis Idg‘om',
    categoryRu: 'Слияние по махраджу',
    categoryUz: 'Maxraji bir harflar',
    descriptionRu: 'Слияние букв, имеющих общее место образования (махрадж), но разные свойства.',
    descriptionUz: 'Maxraji (chiqish o‘rni) bir, ammo sifatlari turlicha bo‘lgan harflarning qo‘shilishi.',
    howToReadRu: 'Первая буква полностью вливается во вторую с удвоением.',
    howToReadUz: 'Birinchi harf ikkinchisiga to‘liq singib, ikkinchi harf tashdid bilan o‘qiladi.',
    lettersAr: 'ط-ت ، ت-د ، ظ-ذ ، ب-م',
    lightColor: '#9C27B0',
    darkColor: '#BA68C8',
  },
  b: {
    code: 'b',
    family: 'idgham',
    nameAr: 'إِدْغَام مُتَقَارِبَيْن',
    nameRu: 'Идгам близких букв',
    nameUz: 'Mutaqorib Idg‘om',
    categoryRu: 'Слияние близких',
    categoryUz: 'Yaqin harflar qo‘shilishi',
    descriptionRu: 'Слияние букв, близких по месту образования и свойствам.',
    descriptionUz: 'Chiqish o‘rni va sifatlari bir-biriga yaqin bo‘lgan harflarning qo‘shilishi.',
    howToReadRu: 'Первая буква вливается во вторую (например, Каф в Кяф: ق в ك).',
    howToReadUz: 'Birinchi harf ikkinchisiga qo‘shib o‘qiladi (masalan, Qof Kafga).',
    lettersAr: 'ق-ك ، ل-ر',
    lightColor: '#9C27B0',
    darkColor: '#BA68C8',
  },
  w: {
    code: 'w',
    family: 'idgham',
    nameAr: 'إِدْغَام شَفَوِيّ',
    nameRu: 'Идгам Шафави (Губное)',
    nameUz: 'Labiy Idg‘om',
    categoryRu: 'Губное слияние',
    categoryUz: 'Labiy qo‘shilish',
    descriptionRu: 'Слияние Мим сакина со следующей огласованной буквой Мим (م).',
    descriptionUz: 'Sukunli Mim harfining o‘zidan keyingi harakatli Mimga qo‘shilishi.',
    howToReadRu: 'Плавно слейте две буквы Мим в одну удвоенную с гунной на 2 счёта.',
    howToReadUz: 'Ikkala Mim harfini birlashtirib, 2 harakat dimog‘ ohangi bilan o‘qing.',
    durationRu: '2 счёта с гунной',
    durationUz: '2 harakat g‘unna bilan',
    lettersAr: 'مْ + م',
    lightColor: '#8E24AA',
    darkColor: '#BA68C8',
  },

  // 6. MADD (PROLONGATION)
  m: {
    code: 'm',
    family: 'madd',
    nameAr: 'مَدّ لَازِم',
    nameRu: 'Мадд Лазим (Обязательный)',
    nameUz: 'Lozimiy Madd',
    categoryRu: 'Удлинение 6 счётов',
    categoryUz: '6 harakat cho‘zish',
    descriptionRu: 'Самое длинное удлинение в Коране, вызванное постоянным сукуном или шаддой после буквы мадда.',
    descriptionUz: 'Madd harfidan keyin asl sukun yoki tashdid kelganda 6 harakat cho‘zilishi.',
    howToReadRu: 'Обязательно плавно и непрерывно тяните звук ровно на 6 счётов (харакатов).',
    howToReadUz: 'Qiroatda uzmasdan to‘liq 6 harakat (taxminan 3 soniya) cho‘zib o‘qing.',
    durationRu: '6 счётов (строго)',
    durationUz: '6 ta harakat',
    lettersAr: 'Буква мадда + сукун/шадда',
    lightColor: '#D32F2F',
    darkColor: '#EF5350',
  },
  o: {
    code: 'o',
    family: 'madd',
    nameAr: 'مَدّ وَاجِب مُتَّصِل',
    nameRu: 'Мадд Ваджиб (Слитный)',
    nameUz: 'Vojib Madd (Muttasil)',
    categoryRu: 'Удлинение 4–5 счётов',
    categoryUz: '4–5 harakat cho‘zish',
    descriptionRu: 'Удлинение, когда буква мадда и хамза (ء) находятся в одном слове.',
    descriptionUz: 'Bir so‘z ichida madd harfidan keyin hamza (ء) kelganda cho‘zilishi.',
    howToReadRu: 'Тяните звук на 4 или 5 счётов перед чётким произнесением хамзы.',
    howToReadUz: 'Hamzadan oldin tovushni 4 yoki 5 harakat miqdorida ravon cho‘zing.',
    durationRu: '4–5 счётов',
    durationUz: '4–5 ta harakat',
    lettersAr: 'ٓء في كلمة واحدة',
    lightColor: '#E53935',
    darkColor: '#E57373',
  },
  p: {
    code: 'p',
    family: 'madd',
    nameAr: 'مَدّ عَارِض / جَائِز',
    nameRu: 'Мадд Арид / Джаиз',
    nameUz: 'Madd Oriz / Joi’z',
    categoryRu: 'Удлинение 2, 4 или 6 счётов',
    categoryUz: '2, 4 yoki 6 harakat',
    descriptionRu: 'Допустимое удлинение при остановке на конце аята или перед хамзой.',
    descriptionUz: 'Oyat oxirida to‘xtaganda yoki hamzadan oldin kelgan cho‘zish.',
    howToReadRu: 'Тяните на 2, 4 или 6 счётов (при остановке на конце аята).',
    howToReadUz: 'To‘xtashda 2, 4 yoki 6 harakat miqdorida cho‘zib o‘qishingiz mumkin.',
    durationRu: '2, 4 или 6 счётов',
    durationUz: '2, 4 yoki 6 harakat',
    lettersAr: 'ـِيـ ، ـُوـ ، ـَاـ перед последней буквой',
    lightColor: '#FB8C00',
    darkColor: '#FFA726',
  },
  n: {
    code: 'n',
    family: 'madd',
    nameAr: 'مَدّ طَبِيعِيّ',
    nameRu: 'Мадд Таби‘и (Естественный)',
    nameUz: 'Tabiiy Madd',
    categoryRu: 'Удлинение 2 счёта',
    categoryUz: '2 harakat cho‘zish',
    descriptionRu: 'Естественное удлинение гласного звука при наличии алифа, вава или йа.',
    descriptionUz: 'Alif, Vov yoki Yo harflari sababli tabiiy 2 harakat cho‘zilishi.',
    howToReadRu: 'Удлиняйте звук мягко ровно на 2 счёта (в два раза дольше обычной огласовки).',
    howToReadUz: 'Oddiy harakatdan ikki barobar uzun qilib, 2 harakat cho‘zing.',
    durationRu: '2 счёта',
    durationUz: '2 ta harakat',
    lettersAr: 'ـٰ ، ۥ ، ۦ ، ا ، و ، ي',
    lightColor: '#FB8C00',
    darkColor: '#FFA726',
  },
  k: {
    code: 'k',
    family: 'tafkheem',
    nameAr: 'تَفْخِيم',
    nameRu: 'Тафхим (Твёрдые буквы)',
    nameUz: 'Tafxim (Yo‘g‘on harflar)',
    categoryRu: 'Твёрдое чтение',
    categoryUz: 'Yo‘g‘on talaffuz',
    descriptionRu: 'Твёрдое, наполненное чтение букв возвышения (Истигля: خ ص ض غ ط ق ظ) и буквы Ра с фатхой или даммой.',
    descriptionUz: 'Isti’lo harflari (x, s, d, g‘, t, q, z) hamda fatha yoki zammali Ro harfining yo‘g‘on o‘qilishi.',
    howToReadRu: 'Поднимите заднюю часть языка к нёбу для плотного, объёмного звучания звука.',
    howToReadUz: 'Til orqasini tanglayga ko‘tarib, tovushni yo‘g‘on va to‘liq jaranglatib o‘qing.',
    durationRu: 'Твёрдый тембр',
    durationUz: 'Yo‘g‘on tembr',
    lettersAr: 'خ ، ص ، ض ، غ ، ط ، ق ، ظ ، رَ ، رُ',
    lightColor: '#1565C0',
    darkColor: '#42A5F5',
  },

  // 7. SILENT & HAMZAT AL-WASL
  h: {
    code: 'h',
    family: 'silent',
    nameAr: 'هَمْزَةُ الْوَصْل',
    nameRu: 'Хамзатуль-Васль',
    nameUz: 'Vasl Hamzasi',
    categoryRu: 'Соединительная буква',
    categoryUz: 'Ulovchi hamza',
    descriptionRu: 'Соединительная хамза (ٱ), которая читается в начале предложения, но опускается при слитном чтении.',
    descriptionUz: 'Jumla boshida o‘qiladigan, lekin o‘rtasida o‘qilmay o‘tib ketiladigan hamza.',
    howToReadRu: 'При слитном чтении полностью опустите этот звук и сразу переходите к следующей букве.',
    howToReadUz: 'Ulab o‘qiganda bu harf o‘qilmaydi, to‘g‘ridan-to‘g‘ri keyingi harfga o‘tiladi.',
    durationRu: 'Не читается при слитности',
    durationUz: 'Ulab o‘qiganda o‘qilmaydi',
    lettersAr: 'ٱ',
    lightColor: '#9E9E9E',
    darkColor: '#757575',
  },
  s: {
    code: 's',
    family: 'silent',
    nameAr: 'حَرْفٌ صَامِت',
    nameRu: 'Непроизносимая буква',
    nameUz: 'O‘qilmaydigan harf',
    categoryRu: 'Беззвучный знак',
    categoryUz: 'Sukunli tovushsiz harf',
    descriptionRu: 'Буква пишется в священном тексте по правилам письма, но не имеет звука при чтении.',
    descriptionUz: 'Usmoniy yozuvda bor bo‘lgan, ammo tilovat paytida ovoz chiqarilmaydigan harf.',
    howToReadRu: 'Не произносите эту букву — она отмечена серым цветом для наглядности.',
    howToReadUz: 'Bu harfni o‘qimang — u ko‘rgazmali bo‘lishi uchun kulrang belgilangan.',
    durationRu: 'Без звука',
    durationUz: 'Ovozsiz',
    lettersAr: 'اْ ، وْ',
    lightColor: '#BDBDBD',
    darkColor: '#616161',
  },
  l: {
    code: 'l',
    family: 'silent',
    nameAr: 'لَام شَمْسِيَّة',
    nameRu: 'Лям Шамсийя (Солнечная)',
    nameUz: 'Shamsiyya Lomi',
    categoryRu: 'Ассимиляция артикля',
    categoryUz: 'Qo‘shiladigan Lom',
    descriptionRu: 'Буква Лям в определенном артикле «Аль-», которая не произносится перед 14 солнечными буквами.',
    descriptionUz: '«Al-» artiklidagi 14 ta shamsiy harf oldida o‘qilmasdan singib ketadigan Lom harfi.',
    howToReadRu: 'Не произносите звук «Л», а сразу удваивайте следующую за ней солнечную букву.',
    howToReadUz: 'Lom tovushini aytmasdan, undan keyingi quyosh harfini tashdid bilan o‘qing.',
    durationRu: 'Ассимилируется',
    durationUz: 'Keyingi harfga singadi',
    lettersAr: 'ال + ت ث د ذ ر ز س ش ص ض ط ظ ل ن',
    lightColor: '#9E9E9E',
    darkColor: '#757575',
  },
};

export const TAJWEED_FAMILY_GUIDES: TajweedFamilyGuide[] = [
  {
    family: 'tafkheem',
    nameAr: 'تَفْخِيم',
    nameRu: 'Тафхим (Твёрдые буквы)',
    nameUz: 'Tafxim (Yo‘g‘on harflar)',
    colorLight: '#1565C0',
    colorDark: '#42A5F5',
    summaryRu: 'Твёрдое чтение букв خ ص ض غ ط ق ظ и буквы Ра с фатхой/даммой',
    summaryUz: 'Isti’lo harflari va fatha/zammali Ro harfining yo‘g‘on o‘qilishi',
    exampleLetters: 'خ ، ص ، ض ، غ ، ط ، ق ، ظ ، رَ',
  },
  {
    family: 'qalqalah',
    nameAr: 'قَلْقَلَة',
    nameRu: 'Калькаля (Отскок)',
    nameUz: 'Qalqala (Tebranish)',
    colorLight: '#1E88E5',
    colorDark: '#42A5F5',
    summaryRu: 'Чёткое эхо и колебание звука при сукуне',
    summaryUz: 'Sukun holatida tovushning jarangdor tebranishi',
    exampleLetters: 'ق ، ط ، ب ، ج ، د',
  },
  {
    family: 'ghunnah',
    nameAr: 'غُنَّة',
    nameRu: 'Гунна (Носовой звук)',
    nameUz: 'G‘unna (Dimog‘ tovushi)',
    colorLight: '#43A047',
    colorDark: '#66BB6A',
    summaryRu: 'Удержание носового звука на 2 счёта в نّ и مّ',
    summaryUz: 'Tashdidli Nun va Mimda 2 harakat dimog‘ ohangi',
    exampleLetters: 'نّ ، مّ',
  },
  {
    family: 'ikhfa',
    nameAr: 'إِخْفَاء',
    nameRu: 'Ихфа (Сокрытие)',
    nameUz: 'Ixfo (Yashirish)',
    colorLight: '#2E7D32',
    colorDark: '#4CAF50',
    summaryRu: 'Мягкое сокрытие Нун сакина перед 15 буквами',
    summaryUz: 'Sukunli Nunni 15 harf oldida yashirib o‘qish',
    exampleLetters: 'ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك',
  },
  {
    family: 'idgham',
    nameAr: 'إِدْغَام',
    nameRu: 'Идгам (Слияние)',
    nameUz: 'Idg‘om (Singdirish)',
    colorLight: '#8E24AA',
    colorDark: '#BA68C8',
    summaryRu: 'Вливание первой буквы во вторую (с гунной или без)',
    summaryUz: 'Birinchi harfni ikkinchisiga to‘liq yoki dimog‘ bilan qo‘shish',
    exampleLetters: 'ي ، ر ، م ، ل ، و ، ن',
  },
  {
    family: 'iqlab',
    nameAr: 'إِقْلَاب',
    nameRu: 'Икляб (Превращение)',
    nameUz: 'Iqlab (Aylantirish)',
    colorLight: '#00897B',
    colorDark: '#26A69A',
    summaryRu: 'Превращение Нун в мягкий Мим перед буквой Ба',
    summaryUz: 'Ba harfi oldidan kelgan Nunni Mimga aylantirish',
    exampleLetters: 'نْ + ب ➔ م',
  },
  {
    family: 'madd',
    nameAr: 'مَدّ',
    nameRu: 'Мадд (Удлинения)',
    nameUz: 'Madd (Cho‘zish)',
    colorLight: '#D32F2F',
    colorDark: '#EF5350',
    summaryRu: 'Удлинение гласных звуков от 2 до 6 счётов',
    summaryUz: 'Unli tovushlarni 2 dan 6 harakatgacha cho‘zish',
    exampleLetters: 'ا ، و ، ي (2, 4, 5, 6 счётов)',
  },
  {
    family: 'silent',
    nameAr: 'حُرُوف صَامِتَة',
    nameRu: 'Непроизносимые буквы',
    nameUz: 'O‘qilmaydigan harflar',
    colorLight: '#9E9E9E',
    colorDark: '#757575',
    summaryRu: 'Буквы вязи, опускаемые при слитном чтении',
    summaryUz: 'Yozuvda bor bo‘lib, tilovatda o‘qilmaydigan belgilar',
    exampleLetters: 'ٱ ، ل شمسية ، اْ',
  },
];

// Lazy cached dataset
let tajweedCache: Record<string, string> | null = null;

export function getTajweedDataset(): Record<string, string> {
  if (!tajweedCache) {
    try {
      tajweedCache = require('../../../../assets/data/quran-tajweed.json');
    } catch (e) {
      console.warn('Failed to load quran-tajweed.json dataset:', e);
      tajweedCache = {};
    }
  }
  return tajweedCache || {};
}

/**
 * Retrieves the raw tagged Tajweed text for a specific surah and ayah.
 */
export function getTajweedForAyah(surahId: number, ayahNumber: number): string | null {
  const dataset = getTajweedDataset();
  const key = `${surahId}_${ayahNumber}`;
  return dataset[key] || null;
}

const IS_COMBINING_MARK = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/;
const TAFKHEEM_LETTERS = new Set(['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ']);
const NON_FORWARD_CONNECTORS = new Set(['ا', 'أ', 'إ', 'آ', 'ٱ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة', 'ء']);

function isTafkheemRa(followingDiacritics: string): boolean {
  return followingDiacritics.includes('\u064E') || followingDiacritics.includes('\u064F');
}

// In-memory caches for high-performance zero-lag rendering
const tajweedTextSegmentsCache = new Map<string, TajweedSegment[]>();
const tajweedWordCache = new Map<string, TajweedWord>();
const tajweedWordsCache = new Map<string, TajweedWord[]>();

/**
 * Parses raw tagged Tajweed text into structured segments with rule metadata.
 * Normalizes obsolete glyphs (U+0672 -> U+0670), fixes orphan combining diacritics,
 * detects Tafkheem (heavy letters) matching Quran.com standard, and applies ZWJ
 * to guarantee seamless cursive joining across color boundaries on Android and iOS.
 */
export function parseTajweedText(rawText: string): TajweedSegment[] {
  if (!rawText) return [];
  const cached = tajweedTextSegmentsCache.get(rawText);
  if (cached) return cached;

  // 1. Normalize obsolete or problematic glyphs:
  // - U+0672 (wavy alef rendered as orange emoji circle on Android) -> U+0670 (standard dagger alef)
  // - U+0640 + U+0670 (tatweel + dagger alef) -> U+0670
  // - Remove zero-width artifacts
  const normalized = rawText
    .replace(/\u0672/g, '\u0670')
    .replace(/\u0640\u0670/g, '\u0670')
    .replace(/[\u200c\u200d]/g, '');

  const rawSegments: TajweedSegment[] = [];
  const stack: TajweedRuleCode[] = [];
  let currentText = '';
  let i = 0;

  while (i < normalized.length) {
    if (normalized[i] === '[') {
      const match = normalized.slice(i).match(/^\[([a-z])(?::\d+)?\[/);
      if (match) {
        if (currentText) {
          const activeRuleCode = stack[stack.length - 1];
          rawSegments.push({
            text: currentText,
            ruleCode: activeRuleCode,
            rule: activeRuleCode ? TAJWEED_RULES[activeRuleCode] : undefined,
          });
          currentText = '';
        }
        stack.push(match[1] as TajweedRuleCode);
        i += match[0].length;
        continue;
      }
      i++;
      continue;
    }

    if (normalized[i] === ']') {
      if (stack.length > 0) {
        const ruleCode = stack.pop();
        // If immediately followed by combining marks (shaddah, harakat, maddah), attach them
        let trailingMarks = '';
        while (i + 1 < normalized.length && IS_COMBINING_MARK.test(normalized[i + 1])) {
          trailingMarks += normalized[i + 1];
          i++;
        }
        const fullText = currentText + trailingMarks;
        if (fullText) {
          rawSegments.push({
            text: fullText,
            ruleCode,
            rule: ruleCode ? TAJWEED_RULES[ruleCode] : undefined,
          });
          currentText = '';
        }
      }
      i++;
      continue;
    }

    currentText += normalized[i];
    i++;
  }

  if (currentText) {
    const activeRuleCode = stack[stack.length - 1];
    rawSegments.push({
      text: currentText,
      ruleCode: activeRuleCode,
      rule: activeRuleCode ? TAJWEED_RULES[activeRuleCode] : undefined,
    });
  }

  // 2. Post-process: ensure NO segment starts with an orphan combining diacritic!
  // Any leading combining mark must be attached to the previous segment.
  const cleaned: TajweedSegment[] = [];
  for (let s = 0; s < rawSegments.length; s++) {
    const seg = { ...rawSegments[s] };
    if (!seg.text) continue;

    let leadingMarks = '';
    let startIdx = 0;
    while (startIdx < seg.text.length && IS_COMBINING_MARK.test(seg.text[startIdx])) {
      leadingMarks += seg.text[startIdx];
      startIdx++;
    }

    if (leadingMarks && cleaned.length > 0) {
      cleaned[cleaned.length - 1].text += leadingMarks;
      seg.text = seg.text.slice(startIdx);
    }

    if (seg.text) {
      cleaned.push(seg);
    }
  }

  // 3. Extract Tafkheem (heavy letters) from untagged segments, matching Quran.com
  const withTafkheem: TajweedSegment[] = [];
  for (const seg of cleaned) {
    if (seg.ruleCode != null) {
      withTafkheem.push(seg);
      continue;
    }

    let text = seg.text;
    let idx = 0;
    let untaggedBuf = '';

    while (idx < text.length) {
      const ch = text[idx];
      let isTaf = false;

      if (TAFKHEEM_LETTERS.has(ch)) {
        isTaf = true;
      } else if (ch === 'ر') {
        let d = '';
        let k = idx + 1;
        while (k < text.length && IS_COMBINING_MARK.test(text[k])) {
          d += text[k];
          k++;
        }
        if (isTafkheemRa(d)) {
          isTaf = true;
        }
      }

      if (isTaf) {
        if (untaggedBuf) {
          withTafkheem.push({ text: untaggedBuf, ruleCode: undefined, rule: undefined });
          untaggedBuf = '';
        }
        let tafText = ch;
        idx++;
        while (idx < text.length && IS_COMBINING_MARK.test(text[idx])) {
          tafText += text[idx];
          idx++;
        }
        withTafkheem.push({
          text: tafText,
          ruleCode: 'k',
          rule: TAJWEED_RULES['k'],
        });
      } else {
        untaggedBuf += ch;
        idx++;
      }
    }

    if (untaggedBuf) {
      withTafkheem.push({ text: untaggedBuf, ruleCode: undefined, rule: undefined });
    }
  }

  // 4. Merge consecutive segments with identical ruleCode
  const merged: TajweedSegment[] = [];
  for (const seg of withTafkheem) {
    if (merged.length > 0 && merged[merged.length - 1].ruleCode === seg.ruleCode) {
      merged[merged.length - 1].text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  // 5. Apply ZWJ across intra-word segment boundaries to preserve seamless cursive ligatures
  const segments: TajweedSegment[] = merged.map((seg, idx) => {
    let text = seg.text;
    const prevSeg = merged[idx - 1];
    const nextSeg = merged[idx + 1];

    // Check if we should connect backward to previous segment in same word
    if (prevSeg && !prevSeg.text.endsWith(' ') && !text.startsWith(' ')) {
      const prevBase = prevSeg.text
        .replace(new RegExp(IS_COMBINING_MARK.source, 'g'), '')
        .replace(/\u200D/g, '');
      const lastBaseChar = prevBase[prevBase.length - 1];
      if (lastBaseChar && !NON_FORWARD_CONNECTORS.has(lastBaseChar)) {
        if (!text.startsWith('\u200D')) {
          text = '\u200D' + text;
        }
      }
    }

    // Check if we should connect forward to next segment in same word
    if (nextSeg && !text.endsWith(' ') && !nextSeg.text.startsWith(' ')) {
      const currBase = text
        .replace(new RegExp(IS_COMBINING_MARK.source, 'g'), '')
        .replace(/\u200D/g, '');
      const lastBaseChar = currBase[currBase.length - 1];
      if (lastBaseChar && !NON_FORWARD_CONNECTORS.has(lastBaseChar)) {
        if (!text.endsWith('\u200D')) {
          text = text + '\u200D';
        }
      }
    }

    return { ...seg, text };
  });

  tajweedTextSegmentsCache.set(rawText, segments);
  return segments;
}

/**
 * Convenience helper to get parsed segments for an ayah, falling back to plain text.
 */
export function getAyahTajweedSegments(
  surahId: number,
  ayahNumber: number,
  fallbackUthmani?: string
): TajweedSegment[] {
  const taggedText = getTajweedForAyah(surahId, ayahNumber);
  if (taggedText) {
    return parseTajweedText(taggedText);
  }
  return fallbackUthmani ? [{ text: fallbackUthmani }] : [];
}

/**
 * Returns the theme-aware color for a given Tajweed rule.
 */
export function getTajweedRuleColor(rule: TajweedRuleInfo, isDark: boolean): string {
  return isDark ? rule.darkColor : rule.lightColor;
}

export interface TajweedFragment {
  text: string;
  ruleCode?: TajweedRuleCode | null;
  rule?: TajweedRuleInfo | null;
}

export interface TajweedWord {
  text: string;
  ruleCode?: TajweedRuleCode | null;
  rule?: TajweedRuleInfo | null;
  allRules?: TajweedRuleInfo[];
  fragments: TajweedFragment[];
}

export const RULE_PRIORITY: Record<TajweedRuleCode, number> = {
  m: 10, // Madd Lazim (6) - Red
  o: 9,  // Madd Wajib (4-5) - Red
  q: 8,  // Qalqalah - Blue
  g: 7,  // Ghunnah - Orange
  i: 6,  // Iqlab - Teal
  f: 5,  // Ikhfa - Green
  c: 5,  // Ikhfa Shafawi - Green
  a: 4,  // Idgham with Ghunnah - Purple
  u: 4,  // Idgham without Ghunnah - Purple
  d: 4,  // Idgham Mutajanisayn - Purple
  w: 4,  // Idgham Shafawi - Purple
  b: 4,  // Idgham Mutaqaribayn - Purple
  p: 3,  // Madd Arid li-s-sukun (waqf / ayah ends, 2-4-6 counts) - Cyan
  k: 2,  // Tafkheem (Heavy letters: kh, s, d, gh, t, q, z, Ra) - Deep Blue
  n: 0,  // Madd Tabii (standard speech / dagger alefs) - default text color
  h: 0,  // Wasl - default text color
  s: 0,  // Silent - default text color
  l: 0,  // Lam Shamsiyyah - default text color
};

export const ACTIVE_TAJWEED_RULES = new Set<TajweedRuleCode>([
  'm',
  'o',
  'p',
  'q',
  'g',
  'f',
  'c',
  'i',
  'a',
  'u',
  'd',
  'w',
  'b',
  'k',
]);

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/;

/**
 * Normalizes raw Arabic word by stripping tags, replacing obsolete glyphs,
 * removing tatweels before dagger alef, and removing zero-width artifacts.
 */
export function cleanTajweedWord(rawWord: string): string {
  return rawWord
    .replace(/\[[a-z](?::\d+)?\[/g, '')
    .replace(/\]/g, '')
    .replace(/\u0672/g, '\u0670') // Replace obsolete wavy alef with standard dagger alef
    .replace(/\u0640\u0670/g, '\u0670') // Replace tatweel + dagger alef with just dagger alef
    .replace(/[\u200c\u200d]/g, '') // Strip zero-width joiners/non-joiners
    .trim();
}

/**
 * Parses a single tagged Arabic word into indivisible letter/sub-word fragments.
 * Retains whole word text for seamless HarfBuzz shaping and tap targets, while
 * providing precise letter-level fragments matching physical Tajweed mushafs.
 */
export function parseTajweedWord(rawWord: string): TajweedWord {
  const cached = tajweedWordCache.get(rawWord);
  if (cached) return cached;

  const cleanWord = cleanTajweedWord(rawWord);
  if (!rawWord.includes('[')) {
    const plainResult: TajweedWord = {
      text: cleanWord,
      ruleCode: null,
      rule: null,
      allRules: [],
      fragments: [{ text: cleanWord, ruleCode: null, rule: null }],
    };
    tajweedWordCache.set(rawWord, plainResult);
    return plainResult;
  }

  const normalized = rawWord
    .replace(/\u0672/g, '\u0670')
    .replace(/\u0640\u0670/g, '\u0670')
    .replace(/[\u200c\u200d]/g, '');

  interface RawFrag {
    text: string;
    ruleCode: TajweedRuleCode | null;
  }

  const rawFragments: RawFrag[] = [];
  const stack: TajweedRuleCode[] = [];
  const activeCodesInWord: TajweedRuleCode[] = [];
  let currentText = '';
  let i = 0;

  while (i < normalized.length) {
    if (normalized[i] === '[') {
      const match = normalized.slice(i).match(/^\[([a-z])(?::\d+)?\[/);
      if (match) {
        if (currentText) {
          const topCode = stack[stack.length - 1];
          const activeCode = (topCode && ACTIVE_TAJWEED_RULES.has(topCode)) ? topCode : null;
          rawFragments.push({ text: currentText, ruleCode: activeCode });
          currentText = '';
        }
        const newCode = match[1] as TajweedRuleCode;
        stack.push(newCode);
        if (ACTIVE_TAJWEED_RULES.has(newCode)) {
          activeCodesInWord.push(newCode);
        }
        i += match[0].length;
        continue;
      }
      i++;
      continue;
    }

    if (normalized[i] === ']') {
      if (stack.length > 0) {
        const topCode = stack.pop();
        const activeCode = (topCode && ACTIVE_TAJWEED_RULES.has(topCode)) ? topCode : null;

        // If immediately followed by combining marks (like maddah ٓ or shaddah ّ), attach them
        let trailingMarks = '';
        while (i + 1 < normalized.length && ARABIC_DIACRITICS.test(normalized[i + 1])) {
          trailingMarks += normalized[i + 1];
          i++;
        }

        const fullText = currentText + trailingMarks;
        if (fullText) {
          rawFragments.push({ text: fullText, ruleCode: activeCode });
          currentText = '';
        }
      }
      i++;
      continue;
    }

    currentText += normalized[i];
    i++;
  }

  if (currentText) {
    const topCode = stack[stack.length - 1];
    const activeCode = (topCode && ACTIVE_TAJWEED_RULES.has(topCode)) ? topCode : null;
    rawFragments.push({ text: currentText, ruleCode: activeCode });
  }

  // Merge consecutive fragments with identical ruleCode
  const fragments: TajweedFragment[] = [];
  for (const f of rawFragments) {
    if (!f.text) continue;
    const ruleInfo = f.ruleCode ? TAJWEED_RULES[f.ruleCode] || null : null;
    if (fragments.length > 0 && fragments[fragments.length - 1].ruleCode === f.ruleCode) {
      fragments[fragments.length - 1].text += f.text;
    } else {
      fragments.push({
        text: f.text,
        ruleCode: f.ruleCode,
        rule: ruleInfo,
      });
    }
  }

  // Determine top priority rule for the entire word
  let topRuleCode: TajweedRuleCode | null = null;
  if (activeCodesInWord.length > 0) {
    activeCodesInWord.sort((a, b) => (RULE_PRIORITY[b] || 0) - (RULE_PRIORITY[a] || 0));
    topRuleCode = activeCodesInWord[0];
  }

  const primaryRule = topRuleCode ? TAJWEED_RULES[topRuleCode] || null : null;
  const uniqueActiveCodes = Array.from(new Set(activeCodesInWord));
  const allRules = uniqueActiveCodes.map((c) => TAJWEED_RULES[c]).filter(Boolean);

  const wordResult: TajweedWord = {
    text: cleanWord,
    ruleCode: topRuleCode,
    rule: primaryRule,
    allRules,
    fragments,
  };
  tajweedWordCache.set(rawWord, wordResult);
  return wordResult;
}

/**
 * Parses raw tagged text into words with precise letter-level Tajweed rule fragments.
 */
export function parseTajweedWords(rawText: string): TajweedWord[] {
  if (!rawText) return [];
  const cached = tajweedWordsCache.get(rawText);
  if (cached) return cached;
  const rawWords = rawText.trim().split(/\s+/);
  const result = rawWords.map((rawWord) => parseTajweedWord(rawWord));
  tajweedWordsCache.set(rawText, result);
  return result;
}

/**
 * Retrieves parsed Tajweed words for an ayah, falling back to clean words from fallbackUthmani.
 */
export function getAyahTajweedWords(
  surahId: number,
  ayahNumber: number,
  fallbackUthmani?: string
): TajweedWord[] {
  const taggedText = getTajweedForAyah(surahId, ayahNumber);
  if (taggedText) {
    return parseTajweedWords(taggedText);
  }
  if (fallbackUthmani) {
    return fallbackUthmani.trim().split(/\s+/).map((word) => ({
      text: word,
      ruleCode: null,
      rule: null,
      allRules: [],
      fragments: [{ text: word, ruleCode: null, rule: null }],
    }));
  }
  return [];
}

