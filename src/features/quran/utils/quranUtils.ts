const nameCache = new Map<string, string>();

export const getSurahName = (nameTranslationJson: string, lang: string): string => {
  const cacheKey = `${lang}_${nameTranslationJson}`;
  const cached = nameCache.get(cacheKey);
  if (cached) return cached;

  try {
    const parsed = JSON.parse(nameTranslationJson);
    const name = parsed[lang] || parsed.ru || parsed.uz || nameTranslationJson;
    nameCache.set(cacheKey, name);
    return name;
  } catch {
    nameCache.set(cacheKey, nameTranslationJson);
    return nameTranslationJson;
  }
};

export const toArabicDigits = (num: number): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((char) => {
      const digit = parseInt(char, 10);
      return isNaN(digit) ? char : arabicDigits[digit];
    })
    .join('');
};
