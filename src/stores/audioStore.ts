import { create } from 'zustand';

export type RepeatMode = 'none' | 'ayah' | 'surah' | 'range';

export interface CurrentTrack {
  surahId: number;
  ayahNumber: number;
  reciter: string;
  title?: string;
  audioUrl?: string;
}

export interface AudioState {
  isPlaying: boolean;
  currentTrack: CurrentTrack | null;
  playbackPosition: number;
  duration: number;
  repeatMode: RepeatMode;
  playbackSpeed: number;
  repeatCount: number; // 1, 2, 3, 5, 10, Infinity
  currentRepeatIndex: number;
  loopRange: { startAyah: number; endAyah: number } | null;
  sleepTimerMinutes: number | null;
  sleepTimerEndTimestamp: number | null;
  sleepTimerRemainingSeconds: number | null;
  sleepTimerEndTime: number | null;
  isFullScreenPlayerVisible: boolean;
  isFullPlayerVisible: boolean;
  repeatAyahTarget: number;

  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTrack: (track: CurrentTrack | null) => void;
  setPlaybackPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setPlaybackSpeed: (speed: number) => void;
  setRepeatCount: (count: number) => void;
  setCurrentRepeatIndex: (idx: number) => void;
  setLoopRange: (range: { startAyah: number; endAyah: number } | null) => void;
  setFullScreenPlayerVisible: (visible: boolean) => void;
  setFullPlayerVisible: (visible: boolean) => void;
  setSleepTimerMinutes: (mins: number | null) => void;
  setSleepTimerRemainingSeconds: (secs: number | null) => void;
  setSleepTimerEndTime: (time: number | null) => void;
  setSleepTimer: (mins: number | null) => void;
  setRepeatAyahTarget: (target: number) => void;
  resetAudio: () => void;
}

const initialState = {
  isPlaying: false,
  currentTrack: null as CurrentTrack | null,
  playbackPosition: 0,
  duration: 0,
  repeatMode: 'none' as RepeatMode,
  playbackSpeed: 1.0,
  repeatCount: 1,
  currentRepeatIndex: 0,
  loopRange: null as { startAyah: number; endAyah: number } | null,
  sleepTimerMinutes: null as number | null,
  sleepTimerEndTimestamp: null as number | null,
  sleepTimerRemainingSeconds: null as number | null,
  sleepTimerEndTime: null as number | null,
  isFullScreenPlayerVisible: false,
  isFullPlayerVisible: false,
  repeatAyahTarget: 1,
};

export const useAudioStore = create<AudioState>()((set) => ({
  ...initialState,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
  setPlaybackPosition: (playbackPosition) => set({ playbackPosition }),
  setDuration: (duration) => set({ duration }),
  setRepeatMode: (repeatMode) => set({ repeatMode }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setRepeatCount: (repeatCount) =>
    set({ repeatCount, repeatAyahTarget: repeatCount, currentRepeatIndex: 0 }),
  setCurrentRepeatIndex: (currentRepeatIndex) => set({ currentRepeatIndex }),
  setLoopRange: (loopRange) => set({ loopRange }),
  setFullScreenPlayerVisible: (visible) =>
    set({ isFullScreenPlayerVisible: visible, isFullPlayerVisible: visible }),
  setFullPlayerVisible: (visible) =>
    set({ isFullScreenPlayerVisible: visible, isFullPlayerVisible: visible }),
  setSleepTimerMinutes: (sleepTimerMinutes) => set({ sleepTimerMinutes }),
  setSleepTimerRemainingSeconds: (sleepTimerRemainingSeconds) =>
    set({ sleepTimerRemainingSeconds }),
  setSleepTimerEndTime: (sleepTimerEndTime) =>
    set({ sleepTimerEndTime, sleepTimerEndTimestamp: sleepTimerEndTime }),
  setSleepTimer: (mins) => {
    if (mins && mins > 0) {
      const endTime = Date.now() + mins * 60 * 1000;
      set({
        sleepTimerMinutes: mins,
        sleepTimerEndTimestamp: endTime,
        sleepTimerEndTime: endTime,
        sleepTimerRemainingSeconds: mins * 60,
      });
    } else {
      set({
        sleepTimerMinutes: null,
        sleepTimerEndTimestamp: null,
        sleepTimerEndTime: null,
        sleepTimerRemainingSeconds: null,
      });
    }
  },
  setRepeatAyahTarget: (repeatAyahTarget) =>
    set({ repeatAyahTarget, repeatCount: repeatAyahTarget, currentRepeatIndex: 0 }),
  resetAudio: () => set(initialState),
}));

export const audioStore = useAudioStore;
