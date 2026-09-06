import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  useDownloadStore,
  calculateTotalAudioSize,
  deleteAllAudio,
} from '@/stores/downloadStore';
import { SettingCard } from './SettingCard';

export interface AudioStorageSectionProps {}

interface ReciterOption {
  id: string;
  name: string;
  arabicName: string;
  style: string;
}

const OFFLINE_RECITERS: ReciterOption[] = [
  {
    id: 'ar.alafasy',
    name: 'Mishary Rashid Alafasy',
    arabicName: 'مشاري راشد العفاسي',
    style: 'Murattal',
  },
  {
    id: 'ar.dussary',
    name: 'Yasser Ad-Dawsari',
    arabicName: 'ياسر الدوسري',
    style: 'Murattal',
  },
  {
    id: 'ar.abdulbasitmurattal',
    name: 'Abdul Basit Abdul Samad',
    arabicName: 'عبد الباسط عبد الصمد',
    style: 'Murattal',
  },
  {
    id: 'ar.husary',
    name: 'Mahmoud Khalil Al-Husary',
    arabicName: 'محمود خليل الحصري',
    style: 'Muallim',
  },
  {
    id: 'ar.abdurrahmaansudais',
    name: 'Abdur-Rahman As-Sudais',
    arabicName: 'عبد الرحمن السديس',
    style: 'Murattal',
  },
];

export const AudioStorageSection: React.FC<AudioStorageSectionProps> = () => {
  const { t } = useTranslation();
  const { colors, spacing, radius, fontFamilies, isDark } = useTheme();

  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState<boolean>(false);

  const defaultReciter = useSettingsStore((state) => state.defaultReciter);
  const setDefaultReciter = useSettingsStore((state) => state.setDefaultReciter);
  const language = useSettingsStore((state) => state.language);

  const downloads = useDownloadStore((s) => s.downloads);

  const refreshStorageSize = useCallback(async () => {
    try {
      const bytes = await calculateTotalAudioSize();
      setStorageBytes(bytes);
    } catch {
      setStorageBytes(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStorageSize();
  }, [refreshStorageSize, downloads]);

  const downloadedSurahsCount = Object.values(downloads).filter(
    (d) => d.status === 'completed'
  ).length;

  const storageMb = (storageBytes / (1024 * 1024)).toFixed(1);
  const hasStorage = storageBytes > 0 || downloadedSurahsCount > 0;

  const activeReciter =
    OFFLINE_RECITERS.find((r) => r.id === defaultReciter) ?? OFFLINE_RECITERS[0];

  const handleSelectReciter = (id: string) => {
    setDefaultReciter(id);
    setIsPickerVisible(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleClearPress = () => {
    Alert.alert(
      t('settings.clearCache', {
        defaultValue: language === 'uz' ? 'Keshni tozalash' : 'Очистить аудиокэш',
      }),
      t('settings.clearCacheConfirm', {
        defaultValue:
          language === 'uz'
            ? 'Barcha yuklangan suralarni o\'chirishga ishonchingiz komilmi?'
            : 'Вы уверены, что хотите удалить все скачанные суры?',
      }),
      [
        {
          text: t('common.cancel', { defaultValue: 'Отмена' }),
          style: 'cancel',
        },
        {
          text: t('settings.clearCache', {
            defaultValue: language === 'uz' ? 'Keshni tozalash' : 'Очистить аудиокэш',
          }),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await deleteAllAudio();
              await refreshStorageSize();
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              setToastMessage(
                t('settings.cacheCleared', {
                  defaultValue: language === 'uz' ? 'Kesh tozalandi' : 'Кэш очищен',
                })
              );
              setTimeout(() => {
                setToastMessage(null);
              }, 3000);
            } catch {
              Alert.alert(
                t('common.error', { defaultValue: 'Ошибка' }),
                t('errors.tryAgain', { defaultValue: 'Попробуйте еще раз' })
              );
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const storageUsedText =
    language === 'uz'
      ? `Band qilingan: ${storageMb} MB`
      : `Занято: ${storageMb} МБ`;

  return (
    <>
      <SettingCard
        title={t('settings.storage', {
          defaultValue: language === 'uz' ? 'Xotira va yuklamalar' : 'Память и загрузки',
        })}
        icon={<Feather name="hard-drive" size={18} color={colors.primary} />}
      >
        <View style={styles.contentContainer}>
          {/* Storage status display */}
          <View style={styles.statsRow}>
            <View style={styles.infoCol}>
              <Text style={[styles.sizeText, { color: colors.text }]}>
                {isLoading ? '...' : `${storageMb} ${language === 'uz' ? 'MB' : 'МБ'}`}
              </Text>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>
                {hasStorage
                  ? `${storageUsedText} • ${downloadedSurahsCount} ${
                      language === 'uz' ? 'ta sura' : 'сур'
                    }`
                  : t('settings.noAudioDownloaded', {
                      defaultValue: 'Нет скачанных аудиофайлов',
                    })}
              </Text>
            </View>

            {isLoading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {/* Preferred offline reciter row */}
          <View
            style={[
              styles.reciterRow,
              {
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <View style={styles.reciterInfo}>
              <Text style={[styles.reciterLabel, { color: colors.textSecondary }]}>
                {t('settings.offlineReciter', {
                  defaultValue:
                    language === 'uz'
                      ? 'Yuklab olish uchun qori'
                      : 'Чтец для загрузок',
                })}
              </Text>
              <Text style={[styles.reciterValue, { color: colors.text }]}>
                {activeReciter.name}
              </Text>
            </View>

            <AnimatedPressable
              onPress={() => setIsPickerVisible(true)}
              haptic="light"
              accessibilityLabel={t('settings.changeReciter')}
              style={[
                styles.changeReciterBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(13, 107, 78, 0.25)'
                    : 'rgba(13, 107, 78, 0.1)',
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text style={[styles.changeReciterBtnText, { color: colors.primary }]}>
                {t('settings.changeReciter', { defaultValue: 'Выбрать' })}
              </Text>
            </AnimatedPressable>
          </View>

          {/* Inline Toast Notification Banner */}
          {toastMessage && (
            <View
              style={[
                styles.toastBanner,
                {
                  backgroundColor: 'rgba(13, 107, 78, 0.12)',
                  borderColor: 'rgba(13, 107, 78, 0.3)',
                  borderRadius: radius.md,
                },
              ]}
            >
              <Feather name="check-circle" size={16} color={colors.primary} />
              <Text style={[styles.toastText, { color: colors.primary }]}>
                {toastMessage}
              </Text>
            </View>
          )}

          {/* Clear storage button */}
          <View style={styles.actionRow}>
            <AnimatedPressable
              onPress={handleClearPress}
              disabled={!hasStorage || isClearing}
              haptic="medium"
              accessibilityLabel={t('settings.clearCache', {
                defaultValue: language === 'uz' ? 'Keshni tozalash' : 'Очистить аудиокэш',
              })}
              style={[
                styles.clearButton,
                {
                  backgroundColor: hasStorage
                    ? 'rgba(231, 76, 60, 0.1)'
                    : 'rgba(128, 128, 128, 0.08)',
                  borderColor: hasStorage
                    ? 'rgba(231, 76, 60, 0.3)'
                    : 'transparent',
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Feather
                name="trash-2"
                size={15}
                color={hasStorage ? colors.error : colors.textTertiary}
              />
              <Text
                style={[
                  styles.clearButtonText,
                  {
                    color: hasStorage ? colors.error : colors.textTertiary,
                  },
                ]}
              >
                {isClearing
                  ? t('common.loading', { defaultValue: 'Загрузка...' })
                  : t('settings.clearCache', {
                      defaultValue:
                        language === 'uz' ? 'Keshni tozalash' : 'Очистить аудиокэш',
                    })}
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </SettingCard>

      {/* Reciter Picker Modal */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.md,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('settings.offlineReciter', {
                  defaultValue:
                    language === 'uz'
                      ? 'Yuklab olish uchun qori'
                      : 'Чтец для загрузок',
                })}
              </Text>
              <AnimatedPressable
                onPress={() => setIsPickerVisible(false)}
                accessibilityLabel={t('common.close')}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </AnimatedPressable>
            </View>

            <View style={styles.modalList}>
              {OFFLINE_RECITERS.map((reciter) => {
                const isSelected = reciter.id === defaultReciter;
                return (
                  <AnimatedPressable
                    key={reciter.id}
                    onPress={() => handleSelectReciter(reciter.id)}
                    style={[
                      styles.reciterItem,
                      {
                        borderRadius: radius.md,
                        backgroundColor: isSelected
                          ? 'rgba(13, 107, 78, 0.1)'
                          : 'transparent',
                        padding: spacing.sm,
                        marginVertical: 4,
                      },
                    ]}
                  >
                    <View style={styles.itemTextContainer}>
                      <Text
                        style={[
                          styles.itemName,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {reciter.name}
                      </Text>
                      <Text
                        style={[
                          styles.itemMeta,
                          {
                            color: colors.textSecondary,
                            fontFamily: fontFamilies.arabic,
                          },
                        ]}
                      >
                        {reciter.arabicName} • {reciter.style}
                      </Text>
                    </View>

                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primary}
                      />
                    ) : null}
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    marginTop: 4,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  sizeText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  descText: {
    fontSize: 13,
    marginTop: 2,
  },
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  reciterInfo: {
    flex: 1,
    marginEnd: 8,
  },
  reciterLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  reciterValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  changeReciterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeReciterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    marginTop: 4,
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTextContainer: {
    flex: 1,
    marginEnd: 8,
  },
  itemName: {
    fontSize: 15,
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});
