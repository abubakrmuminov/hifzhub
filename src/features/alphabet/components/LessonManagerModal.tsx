import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';
import { useLessonManager, useLessonModules } from '../hooks/useLessonContent';

export interface LessonManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LessonManagerModal: React.FC<LessonManagerModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDark, colors, spacing, radius } = useTheme();
  const { modules, refresh } = useLessonModules();
  const {
    saveLesson,
    saveModule,
    importPackage,
    exportPackage,
    resetToDefaults,
    isLoading,
  } = useLessonManager();

  const [inputJson, setInputJson] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalLessonsCount = modules.reduce((sum, m) => sum + (m.lessonsCount || 0), 0);

  const handleValidateAndSave = async () => {
    if (!inputJson.trim()) {
      setFeedback({ type: 'error', message: 'Введите JSON урока или пакета модулей' });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    try {
      const parsed = JSON.parse(inputJson);

      // Check if it's a module
      if (parsed.moduleId && parsed.moduleTitle && !parsed.steps) {
        const res = await saveModule(parsed);
        if (res.success) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setFeedback({ type: 'success', message: `Модуль "${parsed.moduleTitle}" успешно сохранён!` });
          setInputJson('');
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFeedback({ type: 'error', message: res.errors.join('\n') });
        }
      }
      // Check if it's a single lesson
      else if (parsed.lessonId && Array.isArray(parsed.steps)) {
        const res = await saveLesson(parsed);
        if (res.success) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setFeedback({ type: 'success', message: `Урок "${parsed.title || parsed.lessonId}" успешно сохранён!` });
          setInputJson('');
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFeedback({ type: 'error', message: res.errors.join('\n') });
        }
      }
      // Check if it's a package or array
      else {
        const res = await importPackage(parsed);
        if (res.success) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setFeedback({
            type: 'success',
            message: `Импортировано: ${res.importedLessons} уроков, ${res.importedModules} модулей`,
          });
          setInputJson('');
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFeedback({ type: 'error', message: res.errors.join('\n') });
        }
      }
    } catch (err: any) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback({ type: 'error', message: `Ошибка парсинга JSON: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      const pkg = await exportPackage();
      const str = JSON.stringify(pkg, null, 2);
      setInputJson(str);
      setFeedback({
        type: 'success',
        message: `Экспортировано ${pkg.lessons.length} уроков и ${pkg.modules.length} модулей в поле ниже`,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setFeedback({ type: 'error', message: `Ошибка экспорта: ${e.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Сбросить к заводским?',
      'Все добавленные и изменённые уроки будут удалены, а контент вернётся к исходному встроенному состоянию.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await resetToDefaults();
              setFeedback({ type: 'success', message: 'Контент сброшен к исходным бандлам!' });
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e: any) {
              setFeedback({ type: 'error', message: `Ошибка сброса: ${e.message}` });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Управление уроками</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Динамическое редактирование и добавление
            </Text>
          </View>
          <AnimatedPressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close-circle" size={30} color={colors.textSecondary} />
          </AnimatedPressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Bar */}
          <GlassView borderRadius={radius.md} style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{modules.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Модулей</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.secondary }]}>{totalLessonsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Уроков</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <AnimatedPressable onPress={() => void refresh()} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={[styles.refreshText, { color: colors.primary }]}>Обновить</Text>
              </AnimatedPressable>
            </View>
          </GlassView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <AnimatedPressable
              onPress={handleExport}
              disabled={isProcessing}
              style={[styles.smallBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EAECEB' }]}
            >
              <Ionicons name="share-outline" size={16} color={colors.text} />
              <Text style={[styles.smallBtnText, { color: colors.text }]}>Экспорт</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={handleReset}
              disabled={isProcessing}
              style={[styles.smallBtn, { backgroundColor: 'rgba(231, 76, 60, 0.12)' }]}
            >
              <Ionicons name="trash-outline" size={16} color="#E74C3C" />
              <Text style={[styles.smallBtnText, { color: "#E74C3C" }]}>Сброс</Text>
            </AnimatedPressable>
          </View>

          {/* Feedback banner */}
          {feedback && (
            <View
              style={[
                styles.feedbackBanner,
                {
                  backgroundColor:
                    feedback.type === 'success'
                      ? 'rgba(39, 174, 96, 0.12)'
                      : 'rgba(231, 76, 60, 0.12)',
                  borderColor:
                    feedback.type === 'success' ? '#27AE60' : '#E74C3C',
                },
              ]}
            >
              <Ionicons
                name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={feedback.type === 'success' ? '#27AE60' : '#E74C3C'}
              />
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedback.type === 'success' ? '#27AE60' : '#E74C3C' },
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* JSON Input Section */}
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Вставьте JSON урока или пакета:
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#1F1F35' : '#FFFFFF',
                color: colors.text,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              },
            ]}
            multiline
            placeholder={'{\n  "lessonId": "m1_l18",\n  "moduleId": 1,\n  "title": "Новый урок",\n  "steps": [...]\n}'}
            placeholderTextColor={colors.textSecondary}
            value={inputJson}
            onChangeText={setInputJson}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Save Button */}
          <AnimatedPressable
            onPress={handleValidateAndSave}
            disabled={isProcessing || isLoading}
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.primary,
                opacity: isProcessing || isLoading ? 0.6 : 1,
              },
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Проверить и сохранить</Text>
              </>
            )}
          </AnimatedPressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  refreshBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  smallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    gap: 6,
  },
  smallBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  textInput: {
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
