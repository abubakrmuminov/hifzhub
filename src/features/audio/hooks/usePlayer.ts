import { useCallback, useEffect } from 'react';
import { useAudioStore, type CurrentTrack } from '@/stores/audioStore';
import {
  setupPlayer,
  playAudio,
  pauseAudio,
  seekAudio,
  playAyah as playAyahService,
  getAyahCountForSurah,
  setPlaybackSpeed as setPlaybackSpeedService,
  setSleepTimer as setSleepTimerService,
  isPlayerReady,
} from '@/features/audio/services/trackPlayer';

export const SPEED_PRESETS = [1.0, 1.25, 1.5, 0.75] as const;
export const REPEAT_PRESETS = [1, 2, 3, 5, 10, Infinity] as const;

export interface UsePlayerReturn {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  isPlaying: boolean;
  position: number;
  duration: number;
  currentTrack: CurrentTrack | null;
  speed: number;
  setSpeed: (speed: number) => Promise<void>;
  cycleSpeed: () => Promise<void>;
  repeatCount: number;
  repeatAyahTarget: number;
  currentRepeatIndex: number;
  setRepeatCount: (count: number) => void;
  setRepeatAyahTarget: (target: number) => void;
  cycleRepeatCount: () => void;
  loopRange: { startAyah: number; endAyah: number } | null;
  setLoopRange: (range: { startAyah: number; endAyah: number } | null) => void;
  sleepTimerMinutes: number | null;
  sleepTimerEndTimestamp: number | null;
  setSleepTimer: (minutes: number | null) => void;
  isFullScreenPlayerVisible: boolean;
  setFullScreenPlayerVisible: (visible: boolean) => void;
  isFullPlayerVisible: boolean;
  setFullPlayerVisible: (visible: boolean) => void;
  isReady: boolean;
  playAyah: (surahId: number, ayahNumber: number, reciterId?: string) => Promise<void>;
}

export const usePlayer = (): UsePlayerReturn => {
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const position = useAudioStore((s) => s.playbackPosition);
  const duration = useAudioStore((s) => s.duration);
  const speed = useAudioStore((s) => s.playbackSpeed);
  const repeatCount = useAudioStore((s) => s.repeatCount);
  const currentRepeatIndex = useAudioStore((s) => s.currentRepeatIndex);
  const loopRange = useAudioStore((s) => s.loopRange);
  const sleepTimerMinutes = useAudioStore((s) => s.sleepTimerMinutes);
  const sleepTimerEndTimestamp = useAudioStore((s) => s.sleepTimerEndTimestamp);
  const isFullScreenPlayerVisible = useAudioStore((s) => s.isFullScreenPlayerVisible);
  const isFullPlayerVisible = useAudioStore((s) => s.isFullPlayerVisible);

  useEffect(() => {
    void setupPlayer();
  }, []);

  const play = useCallback(async () => {
    if (isPlayerReady()) {
      await playAudio();
    } else if (currentTrack) {
      await playAyahService(
        currentTrack.surahId,
        currentTrack.ayahNumber,
        currentTrack.reciter
      );
    }
  }, [currentTrack]);

  const pause = useCallback(async () => {
    await pauseAudio();
  }, []);

  const next = useCallback(async () => {
    if (currentTrack) {
      const activeLoop = useAudioStore.getState().loopRange;
      if (activeLoop && currentTrack.ayahNumber >= activeLoop.endAyah) {
        await playAyahService(
          currentTrack.surahId,
          activeLoop.startAyah,
          currentTrack.reciter
        );
        return;
      }
      const total = getAyahCountForSurah(currentTrack.surahId);
      if (currentTrack.ayahNumber < total) {
        await playAyahService(
          currentTrack.surahId,
          currentTrack.ayahNumber + 1,
          currentTrack.reciter,
          total
        );
      }
    }
  }, [currentTrack]);

  const previous = useCallback(async () => {
    if (currentTrack) {
      if (position > 2) {
        await seekAudio(0);
      } else {
        const activeLoop = useAudioStore.getState().loopRange;
        if (activeLoop && currentTrack.ayahNumber <= activeLoop.startAyah) {
          await playAyahService(
            currentTrack.surahId,
            activeLoop.endAyah,
            currentTrack.reciter
          );
          return;
        }
        if (currentTrack.ayahNumber > 1) {
          await playAyahService(
            currentTrack.surahId,
            currentTrack.ayahNumber - 1,
            currentTrack.reciter
          );
        }
      }
    }
  }, [currentTrack, position]);

  const seekTo = useCallback(async (pos: number) => {
    await seekAudio(pos);
  }, []);

  const setSpeed = useCallback(async (newSpeed: number) => {
    await setPlaybackSpeedService(newSpeed);
  }, []);

  const cycleSpeed = useCallback(async () => {
    const currentIndex = SPEED_PRESETS.indexOf(speed as (typeof SPEED_PRESETS)[number]);
    const nextIndex = (currentIndex + 1) % SPEED_PRESETS.length;
    await setPlaybackSpeedService(SPEED_PRESETS[nextIndex]);
  }, [speed]);

  const setRepeatCount = useCallback((count: number) => {
    useAudioStore.getState().setRepeatCount(count);
  }, []);

  const cycleRepeatCount = useCallback(() => {
    const currentIndex = REPEAT_PRESETS.indexOf(
      repeatCount as (typeof REPEAT_PRESETS)[number]
    );
    const nextIndex = (currentIndex + 1) % REPEAT_PRESETS.length;
    useAudioStore.getState().setRepeatCount(REPEAT_PRESETS[nextIndex]);
  }, [repeatCount]);

  const setLoopRange = useCallback(
    (range: { startAyah: number; endAyah: number } | null) => {
      useAudioStore.getState().setLoopRange(range);
    },
    []
  );

  const setSleepTimer = useCallback((minutes: number | null) => {
    setSleepTimerService(minutes);
  }, []);

  const setFullScreenPlayerVisible = useCallback((visible: boolean) => {
    useAudioStore.getState().setFullScreenPlayerVisible(visible);
  }, []);

  const setFullPlayerVisible = useCallback((visible: boolean) => {
    useAudioStore.getState().setFullPlayerVisible(visible);
  }, []);

  const playAyah = useCallback(
    async (surahId: number, ayahNumber: number, reciterId?: string) => {
      const activeReciter = reciterId || currentTrack?.reciter || 'ar.alafasy';
      await playAyahService(surahId, ayahNumber, activeReciter);
    },
    [currentTrack?.reciter]
  );

  return {
    play,
    pause,
    next,
    previous,
    seekTo,
    isPlaying,
    position,
    duration,
    currentTrack,
    speed,
    setSpeed,
    cycleSpeed,
    repeatCount,
    repeatAyahTarget: repeatCount,
    currentRepeatIndex,
    setRepeatCount,
    setRepeatAyahTarget: setRepeatCount,
    cycleRepeatCount,
    loopRange,
    setLoopRange,
    sleepTimerMinutes,
    sleepTimerEndTimestamp,
    setSleepTimer,
    isFullScreenPlayerVisible,
    setFullScreenPlayerVisible,
    isFullPlayerVisible,
    setFullPlayerVisible,
    isReady: isPlayerReady(),
    playAyah,
  };
};
