import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import { playAyah } from '../services/trackPlayer';
import { reciterPickerStyles as styles } from './reciterPickerStyles';

export interface ReciterPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect?: (reciterId: string) => void;
}

export interface ReciterItem {
  id: string;
  nameKey: string;
  englishName: string;
  russianName: string;
  uzbekName: string;
  arabicName: string;
  descriptionRu: string;
  descriptionUz: string;
}

export const RECITERS_LIST: ReciterItem[] = [
  {
    id: 'ar.alafasy',
    nameKey: 'reciters.alafasy',
    englishName: 'Mishary Rashid Alafasy',
    russianName: 'Мишари Рашид аль-Афаси',
    uzbekName: 'Mishariy Roshid al-Afasiy',
    arabicName: 'مشاري راشد العفاسي',
    descriptionRu: 'Всемирно известный чтец • Мелодичное и ясное чтение',
    descriptionUz: 'Mashhur qori • Ohangdor va ravon qiroat',
  },
  {
    id: 'ar.dussary',
    nameKey: 'reciters.dussary',
    englishName: 'Yasser Ad-Dawsari',
    russianName: 'Ясир ад-Даусари',
    uzbekName: 'Yosir ad-Davsariy',
    arabicName: 'ياسر الدوسري',
    descriptionRu: 'Имам Заповедной мечети в Мекке • Эмоциональное чтение',
    descriptionUz: "Masjidul Harom imomi • Ta'sirli va jo'shqin qiroat",
  },
  {
    id: 'ar.abdulbasetmurattal',
    nameKey: 'reciters.abdulbasit',
    englishName: 'Abdul Basit Abdus Samad',
    russianName: 'Абдуль-Басит Абдус-Самад',
    uzbekName: 'Abdulbosit Abdussamad',
    arabicName: 'عبد الباسط عبد الصمد',
    descriptionRu: 'Легендарный египетский чтец • Классический муратталь',
    descriptionUz: 'Afsonaviy Misr qorisi • Klassik murattal uslubi',
  },
  {
    id: 'ar.husary',
    nameKey: 'reciters.husary',
    englishName: 'Mahmoud Khalil Al-Husary',
    russianName: 'Махмуд Халиль аль-Хусари',
    uzbekName: 'Mahmud Xalil al-Husoriy',
    arabicName: 'محمود خليل الحصري',
    descriptionRu: 'Эталон правильного таджвида • Академическое чтение',
    descriptionUz: 'Tajvid qoidalarining oliy standarti • Muallim qiroat',
  },
  {
    id: 'ar.abdurrahmaansudais',
    nameKey: 'reciters.sudais',
    englishName: 'Abdur-Rahman As-Sudais',
    russianName: 'Абдуррахман ас-Судейс',
    uzbekName: 'Abdurahmon as-Sudays',
    arabicName: 'عبد الرحمن السديس',
    descriptionRu: 'Главный имам Заповедной мечети в Мекке • Торжественный тон',
    descriptionUz: 'Masjidul Harom bosh imomi • Tantanali va viqorli ohang',
  },
];

export const ReciterPicker: React.FC<ReciterPickerProps> = ({
  isVisible,
  onClose,
  onSelect,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isDark, colors, fontFamilies, shadows } = useTheme();

  const defaultReciter = useSettingsStore((s) => s.defaultReciter);
  const setDefaultReciter = useSettingsStore((s) => s.setDefaultReciter);
  const language = useSettingsStore((s) => s.language);

  const handleSelect = useCallback(
    async (reciterId: string) => {
      setDefaultReciter(reciterId);
      onSelect?.(reciterId);

      // Seamlessly switch reciter on the fly if track is loaded or playing
      const { currentTrack, isPlaying } = useAudioStore.getState();
      if (currentTrack) {
        if (isPlaying) {
          await playAyah(currentTrack.surahId, currentTrack.ayahNumber, reciterId);
        } else {
          useAudioStore.getState().setCurrentTrack({
            ...currentTrack,
            reciter: reciterId,
          });
        }
      }

      onClose();
    },
    [setDefaultReciter, onSelect, onClose]
  );

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(160)}
      style={styles.overlay}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        entering={SlideInDown.springify().damping(22).stiffness(120)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.sheetBackground,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderTopWidth: isDark ? 1 : 0,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            maxHeight: '82%',
          },
          shadows.strong,
        ]}
      >
        <View style={styles.container}>
          {/* Drag Pill Handle */}
          <View style={{ alignItems: 'center', paddingTop: 2, paddingBottom: 10 }}>
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.22)'
                  : 'rgba(0, 0, 0, 0.15)',
              }}
            />
          </View>

          <View
            style={[
              styles.headerRow,
              {
                borderBottomColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            ]}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('reciters.select', {
                defaultValue: language === 'uz' ? 'Qorini tanlash' : 'Выбрать чтеца',
              })}
            </Text>
            <AnimatedPressable
              onPress={onClose}
              haptic="light"
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </AnimatedPressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            overScrollMode="never"
          >
            {RECITERS_LIST.map((reciter) => {
              const isSelected =
                defaultReciter === reciter.id ||
                defaultReciter === reciter.id.replace('ar.', '');

              const displayName =
                t(reciter.nameKey, {
                  defaultValue:
                    language === 'uz'
                      ? reciter.uzbekName
                      : language === 'ru'
                      ? reciter.russianName
                      : reciter.englishName,
                });

              return (
                <AnimatedPressable
                  key={reciter.id}
                  onPress={() => void handleSelect(reciter.id)}
                  haptic="light"
                  style={[
                    styles.reciterRow,
                    isSelected && {
                      backgroundColor: isDark
                        ? 'rgba(13, 107, 78, 0.22)'
                        : 'rgba(13, 107, 78, 0.08)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: isSelected
                          ? colors.primary
                          : isDark
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(0,0,0,0.2)',
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.reciterInfoCol}>
                    <View style={styles.reciterTopRow}>
                      <Text
                        style={[
                          styles.reciterName,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {displayName}
                      </Text>
                      <Text
                        style={[
                          styles.reciterArabic,
                          {
                            color: isSelected
                              ? colors.primaryLight
                              : colors.textSecondary,
                            fontFamily: fontFamilies.arabic,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {reciter.arabicName}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.reciterDesc,
                        { color: isSelected ? colors.primary : colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {language === 'uz' ? reciter.descriptionUz : reciter.descriptionRu}
                    </Text>
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </Animated.View>
  );
};
