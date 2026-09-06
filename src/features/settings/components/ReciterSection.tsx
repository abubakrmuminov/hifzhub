import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useSettingsStore } from '@/stores/settingsStore';
import { SettingCard } from './SettingCard';

export interface ReciterSectionProps {}

interface ReciterOption {
  id: string;
  name: string;
  arabicName: string;
  style: string;
}

const RECITERS: ReciterOption[] = [
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
    id: 'ar.shatri',
    name: 'Abu Bakr Al-Shatri',
    arabicName: 'أبو بكر الشاطري',
    style: 'Murattal',
  },
  {
    id: 'ar.abdurrahmaansudais',
    name: 'Abdur-Rahman As-Sudais',
    arabicName: 'عبد الرحمن السديس',
    style: 'Murattal',
  },
];

export const ReciterSection: React.FC<ReciterSectionProps> = () => {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const defaultReciter = useSettingsStore((state) => state.defaultReciter);
  const setDefaultReciter = useSettingsStore((state) => state.setDefaultReciter);

  const activeReciter =
    RECITERS.find((r) => r.id === defaultReciter) ?? RECITERS[0];

  const handleSelectReciter = (id: string) => {
    setDefaultReciter(id);
    setIsPickerVisible(false);
  };

  return (
    <>
      <SettingCard
        title={t('settings.reciter')}
        icon={<Feather name="mic" size={18} color={colors.primary} />}
      >
        <View style={styles.reciterRow}>
          <View style={styles.info}>
            <Text style={[styles.reciterName, { color: colors.text }]}>
              {activeReciter.name}
            </Text>
            <Text style={[styles.arabicName, { color: colors.secondaryDark }]}>
              {activeReciter.arabicName}
            </Text>
          </View>

          <AnimatedPressable
            onPress={() => setIsPickerVisible(true)}
            accessibilityLabel={t('settings.changeReciter')}
            style={[
              styles.changeButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text style={styles.changeButtonText}>
              {t('settings.changeReciter')}
            </Text>
          </AnimatedPressable>
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
                {t('settings.changeReciter')}
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
              {RECITERS.map((reciter) => {
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
                          { color: colors.textSecondary },
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
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  info: {
    flex: 1,
    marginEnd: 12,
  },
  reciterName: {
    fontSize: 15,
    fontWeight: '700',
  },
  arabicName: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  changeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButtonText: {
    color: '#FFFFFF',
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
    fontSize: 18,
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
