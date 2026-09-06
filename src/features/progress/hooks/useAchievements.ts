import { useMemo } from 'react';
import { useProgressStore } from '@/stores/progressStore';
import { useMemorizationStore } from '@/stores/memorizationStore';
import { useLessonStore } from '@/stores/lessonStore';
import { ACHIEVEMENTS_CONFIG } from '../data/achievementsData';
import { JUZ_LIST, isAyahInJuz } from '../data/juzData';
import type { Achievement } from '../types';
import { isAyahMemorized } from './useJuzProgress';

export interface UseAchievementsReturn {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  unlockedPercentage: number;
  getAchievementById: (id: string) => Achievement | undefined;
  getByCategory: (category: Achievement['category']) => Achievement[];
}

export function useAchievements(): UseAchievementsReturn {
  // 1. Progress store (streaks)
  const currentStreak = useProgressStore((state) => state.currentStreak);
  const bestStreak = useProgressStore((state) => state.bestStreak);
  const getEffectiveStreak = useProgressStore((state) => state.getEffectiveStreak);
  const effectiveStreak = useMemo(
    () => (typeof getEffectiveStreak === 'function' ? getEffectiveStreak() : currentStreak),
    [getEffectiveStreak, currentStreak]
  );

  // 2. Memorization store (cards, sessions)
  const cards = useMemorizationStore((state) => state.cards);
  const sessions = useMemorizationStore((state) => state.sessions);
  const currentSession = useMemorizationStore((state) => state.currentSession);

  // 3. Lesson store (lessons, XP, modules)
  const completedLessons = useLessonStore((state) => state.completedLessons);
  const lessonXP = useLessonStore((state) => state.totalXP);
  const unlockedModules = useLessonStore((state) => state.unlockedModules);

  const achievements = useMemo<Achievement[]>(() => {
    const memorizedCards = Object.values(cards).filter(isAyahMemorized);
    const memorizationXP = Object.values(cards).reduce(
      (acc, card) => acc + (card.reviewCount ?? 0) * 10,
      0
    );
    const totalXP = (lessonXP || 0) + memorizationXP;
    const userEffectiveStreak = Math.max(currentStreak, bestStreak, effectiveStreak);

    return ACHIEVEMENTS_CONFIG.map((config) => {
      let isUnlocked = false;
      let progress = 0;
      let unlockedAt: number | undefined = undefined;

      switch (config.condition.type) {
        case 'streak': {
          const target = config.condition.target;
          progress = target > 0 ? Math.min(1, Math.max(0, userEffectiveStreak / target)) : 0;
          isUnlocked = userEffectiveStreak >= target;
          if (isUnlocked) {
            unlockedAt = Date.now();
          }
          break;
        }

        case 'ayahs_count': {
          const target = config.condition.target;
          progress = target > 0 ? Math.min(1, Math.max(0, memorizedCards.length / target)) : 0;
          isUnlocked = memorizedCards.length >= target;
          if (isUnlocked) {
            const sorted = [...memorizedCards].sort(
              (a, b) => (a.lastReviewedAt ?? a.addedAt) - (b.lastReviewedAt ?? b.addedAt)
            );
            const targetCard = sorted[target - 1];
            unlockedAt = targetCard?.lastReviewedAt ?? targetCard?.addedAt ?? Date.now();
          }
          break;
        }

        case 'surah_completed': {
          const targetSurahId = config.condition.targetId ?? 1;
          const target = config.condition.target;
          const surahCards = memorizedCards.filter((c) => c.surahId === targetSurahId);
          progress = target > 0 ? Math.min(1, Math.max(0, surahCards.length / target)) : 0;
          isUnlocked = surahCards.length >= target;
          if (isUnlocked) {
            const latest = Math.max(
              ...surahCards.map((c) => c.lastReviewedAt ?? c.addedAt)
            );
            unlockedAt = latest > 0 ? latest : Date.now();
          }
          break;
        }

        case 'juz_completed': {
          const targetJuzId = config.condition.targetId ?? 30;
          const juzInfo = JUZ_LIST.find((j) => j.id === targetJuzId);
          const target = juzInfo?.totalAyahs ?? config.condition.target;
          const juzCards = juzInfo
            ? memorizedCards.filter((c) => isAyahInJuz(c.surahId, c.ayahNumber, juzInfo))
            : [];
          progress = target > 0 ? Math.min(1, Math.max(0, juzCards.length / target)) : 0;
          isUnlocked = juzCards.length >= target && target > 0;
          if (isUnlocked) {
            const latest = Math.max(...juzCards.map((c) => c.lastReviewedAt ?? c.addedAt));
            unlockedAt = latest > 0 ? latest : Date.now();
          }
          break;
        }

        case 'lessons_count': {
          const target = config.condition.target;
          const targetModuleId = config.condition.targetId;

          if (targetModuleId !== undefined) {
            const moduleLessons = Object.values(completedLessons).filter(
              (l) => l.moduleId === targetModuleId && l.passed
            );
            progress = target > 0 ? Math.min(1, Math.max(0, moduleLessons.length / target)) : 0;
            isUnlocked =
              moduleLessons.length >= target || unlockedModules.includes(targetModuleId + 1);
            if (isUnlocked) {
              const latest = Math.max(...moduleLessons.map((l) => l.completedAt));
              unlockedAt = latest > 0 ? latest : Date.now();
            }
          } else {
            const passedLessons = Object.values(completedLessons).filter((l) => l.passed);
            progress = target > 0 ? Math.min(1, Math.max(0, passedLessons.length / target)) : 0;
            isUnlocked = passedLessons.length >= target;
            if (isUnlocked) {
              const sorted = [...passedLessons].sort((a, b) => a.completedAt - b.completedAt);
              unlockedAt = sorted[target - 1]?.completedAt ?? Date.now();
            }
          }
          break;
        }

        case 'xp_total': {
          const target = config.condition.target;
          progress = target > 0 ? Math.min(1, Math.max(0, totalXP / target)) : 0;
          isUnlocked = totalXP >= target;
          if (isUnlocked) {
            unlockedAt = Date.now();
          }
          break;
        }

        case 'special': {
          if (config.id === 'night_reader') {
            const allSessions = currentSession ? [currentSession, ...sessions] : sessions;
            let nightTimestamp: number | undefined;

            for (const s of allSessions) {
              const h = new Date(s.startedAt).getHours();
              if (h >= 22 || h < 5) {
                nightTimestamp = s.startedAt;
                break;
              }
            }

            if (!nightTimestamp) {
              for (const l of Object.values(completedLessons)) {
                const h = new Date(l.completedAt).getHours();
                if (h >= 22 || h < 5) {
                  nightTimestamp = l.completedAt;
                  break;
                }
              }
            }

            if (nightTimestamp) {
              progress = 1;
              isUnlocked = true;
              unlockedAt = nightTimestamp;
            } else {
              progress = 0;
              isUnlocked = false;
            }
          }
          break;
        }

        default:
          break;
      }

      return {
        ...config,
        isUnlocked,
        progress: Number(progress.toFixed(4)),
        unlockedAt,
      };
    });
  }, [
    cards,
    sessions,
    currentSession,
    completedLessons,
    lessonXP,
    unlockedModules,
    currentStreak,
    bestStreak,
    effectiveStreak,
  ]);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.isUnlocked).length;
  }, [achievements]);

  const totalCount = achievements.length;
  const unlockedPercentage =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    achievements,
    unlockedCount,
    totalCount,
    unlockedPercentage,
    getAchievementById: (id: string) => achievements.find((a) => a.id === id),
    getByCategory: (category: Achievement['category']) =>
      achievements.filter((a) => a.category === category),
  };
}
