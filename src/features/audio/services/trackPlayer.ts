import * as FileSystem from 'expo-file-system/legacy';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAudioStore } from '@/stores/audioStore';
import { useProgressStore } from '@/stores/progressStore';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safe loader for expo-audio to prevent crashes in any environment
let ExpoAudio: typeof import('expo-audio') | null = null;
try {
  ExpoAudio = require('expo-audio');
} catch {
  console.warn('expo-audio could not be loaded');
}

export const RECITERS = {
  alafasy: 'ar.alafasy',
  dussary: 'ar.dussary',
  abdulbasit: 'ar.abdulbasetmurattal',
  husary: 'ar.husary',
  sudais: 'ar.abdurrahmaansudais',
} as const;

export type ReciterKey = keyof typeof RECITERS;
export type ReciterId = (typeof RECITERS)[ReciterKey] | string;

export const SURAH_AYAH_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  5, 4, 5, 6,
];

export const resolveReciterId = (reciter: string): string => {
  if (reciter in RECITERS) {
    return RECITERS[reciter as ReciterKey];
  }
  return reciter;
};

export const getAyahCountForSurah = (surahId: number): number => {
  if (surahId < 1 || surahId > 114) return 0;
  return SURAH_AYAH_COUNTS[surahId - 1] ?? 0;
};

export const getAbsoluteAyahNumber = (surahId: number, ayahNumber: number): number => {
  if (surahId < 1 || surahId > 114) return ayahNumber;
  let count = 0;
  for (let i = 0; i < surahId - 1; i++) {
    count += SURAH_AYAH_COUNTS[i] ?? 0;
  }
  return count + ayahNumber;
};

export const buildTrackUrl = (
  surahId: number,
  ayahNumber: number,
  reciter: string
): string => {
  const reciterId = resolveReciterId(reciter);
  if (reciterId === 'ar.dussary' || reciterId === 'dussary') {
    const surahPadded = String(surahId).padStart(3, '0');
    const ayahPadded = String(ayahNumber).padStart(3, '0');
    return `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${surahPadded}${ayahPadded}.mp3`;
  }
  const absoluteAyahNumber = getAbsoluteAyahNumber(surahId, ayahNumber);
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${absoluteAyahNumber}.mp3`;
};

// Playback resolves a local file or streams; it never waits for a download.
export const getAyahAudioUri = async (
  surahId: number, ayahNumber: number, reciter: string
): Promise<string> => {
  const reciterId = resolveReciterId(reciter);
  if (FileSystem.documentDirectory) {
    const uri = `${FileSystem.documentDirectory}audio/${reciterId}/${surahId}/${ayahNumber}.mp3`;
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && !info.isDirectory && info.size > 1000) return uri;
    } catch { /* Streaming remains available when storage is inaccessible. */ }
  }
  return buildTrackUrl(surahId, ayahNumber, reciterId);
};

const preloads = new Map<string, Promise<void>>();
let preloadGeneration = 0;
let activePreloads = 0;

export const clearAudioCache = (): void => { preloadGeneration += 1; };

export const preloadAyahAudio = (
  surahId: number, ayahNumber: number, reciter: string
): Promise<void> => {
  const key = `${resolveReciterId(reciter)}_${surahId}_${ayahNumber}`;
  const existing = preloads.get(key);
  if (existing) return existing;
  // Speculative work is expendable; never queue a whole surah on the playback path.
  if (activePreloads >= 2 || !FileSystem.documentDirectory) return Promise.resolve();
  const generation = preloadGeneration;
  activePreloads += 1;
  const task = (async () => {
    const uri = await getAyahAudioUri(surahId, ayahNumber, reciter);
    if (!uri.startsWith('http') || generation !== preloadGeneration) return;
    const dir = `${FileSystem.documentDirectory}audio/${resolveReciterId(reciter)}/${surahId}/`;
    const temporary = `${dir}${ayahNumber}.prefetch.mp3`;
    try {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const download = await FileSystem.downloadAsync(uri, temporary);
      const info = await FileSystem.getInfoAsync(temporary);
      if (generation === preloadGeneration && download.status === 200 &&
          info.exists && !info.isDirectory && info.size > 1000) {
        await FileSystem.moveAsync({ from: temporary, to: `${dir}${ayahNumber}.mp3` });
      }
    } finally {
      await FileSystem.deleteAsync(temporary, { idempotent: true }).catch(() => {});
    }
  })().catch((error: unknown) => {
    console.warn('Audio prefetch failed:', error);
  }).finally(() => {
    activePreloads -= 1;
    preloads.delete(key);
  });
  preloads.set(key, task);
  return task;
};

let activePlayer: import('expo-audio').AudioPlayer | null = null;
let statusSubscription: { remove(): void } | null = null;
let configuration: Promise<boolean> | null = null;
let playbackRequest = 0;
let requestedNotificationPermission = false;

export const setupPlayer = (): Promise<boolean> => {
  if (!ExpoAudio) return Promise.resolve(false);
  if (!configuration) {
    configuration = ExpoAudio.setAudioModeAsync({
      playsInSilentMode: true, shouldPlayInBackground: true,
    }).then(() => true).catch((error: unknown) => {
      configuration = null;
      console.warn('Audio setup failed:', error);
      return false;
    });
  }
  return configuration;
};

export const isPlayerReady = (): boolean => activePlayer !== null;
export const playAudio = async (): Promise<void> => { activePlayer?.play(); };
export const pauseAudio = async (): Promise<void> => {
  // Cancel pending replacements, but retain the loaded player's completion listener.
  pendingRequest = ++playbackRequest;
  activePlayer?.pause();
  useAudioStore.getState().setIsPlaying(false);
};
let pendingRequest = 0;

export const setPlaybackSpeed = async (speed: number): Promise<void> => {
  useAudioStore.getState().setPlaybackSpeed(speed);
  activePlayer?.setPlaybackRate(speed);
};

export const seekAudio = async (positionSeconds: number): Promise<void> => {
  if (activePlayer) {
    await activePlayer.seekTo(positionSeconds);
    useAudioStore.getState().setPlaybackPosition(positionSeconds);
  }
};

let sleepTimerInterval: ReturnType<typeof setInterval> | null = null;
let sleepTimerTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSleepTimerEnd: number | null = null;

// React to sleep timer changes in audioStore
useAudioStore.subscribe((state) => {
  if (state.sleepTimerEndTimestamp !== lastSleepTimerEnd) {
    lastSleepTimerEnd = state.sleepTimerEndTimestamp;
    if (!state.sleepTimerEndTimestamp) {
      if (sleepTimerTimeout) {
        clearTimeout(sleepTimerTimeout);
        sleepTimerTimeout = null;
      }
      if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
      }
    } else {
      if (sleepTimerTimeout) clearTimeout(sleepTimerTimeout);
      if (sleepTimerInterval) clearInterval(sleepTimerInterval);

      const remainingMs = Math.max(0, state.sleepTimerEndTimestamp - Date.now());
      sleepTimerTimeout = setTimeout(() => {
        if (sleepTimerTimeout) {
          clearTimeout(sleepTimerTimeout);
          sleepTimerTimeout = null;
        }
        if (sleepTimerInterval) {
          clearInterval(sleepTimerInterval);
          sleepTimerInterval = null;
        }
        useAudioStore.getState().setSleepTimer(null);
        void stopAudio();
      }, remainingMs);

      let remaining = Math.round(remainingMs / 1000);
      sleepTimerInterval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (sleepTimerInterval) {
            clearInterval(sleepTimerInterval);
            sleepTimerInterval = null;
          }
        } else {
          useAudioStore.getState().setSleepTimerRemainingSeconds(remaining);
        }
      }, 1000);
    }
  }
});

export const cancelSleepTimer = (): void => {
  useAudioStore.getState().setSleepTimer(null);
};

export const setSleepTimer = (minutes: number | null): void => {
  useAudioStore.getState().setSleepTimer(minutes);
};

export const releaseActivePlayer = async (): Promise<void> => {
  pendingRequest = ++playbackRequest;
  statusSubscription?.remove();
  statusSubscription = null;
  const player = activePlayer;
  activePlayer = null;
  if (player) {
    try {
      if (!isExpoGo) player.clearLockScreenControls();
      player.pause();
    } finally {
      player.remove(); // expo-audio uses remove(), not release().
    }
  }
};

export const stopAudio = async (): Promise<void> => {
  await releaseActivePlayer();
  useAudioStore.setState({
    isPlaying: false, currentTrack: null, playbackPosition: 0, duration: 0, currentRepeatIndex: 0,
  });
};

export interface PlayAyahOptions {
  ayahCount?: number;
  autoPlayNext?: boolean;
}

export const playAyah = async (
  surahId: number, ayahNumber: number, reciterId: string,
  optionsOrAyahCount?: number | PlayAyahOptions
): Promise<void> => {
  const request = ++playbackRequest;
  pendingRequest = request;
  const options = typeof optionsOrAyahCount === 'number'
    ? { ayahCount: optionsOrAyahCount, autoPlayNext: true } : optionsOrAyahCount;
  const total = options?.ayahCount ?? getAyahCountForSurah(surahId);
  if (!Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > total) return;
  const reciter = resolveReciterId(reciterId);
  try {
    const [ready, uri] = await Promise.all([setupPlayer(), getAyahAudioUri(surahId, ayahNumber, reciter)]);
    if (!ready || !ExpoAudio || pendingRequest !== request) return;
    statusSubscription?.remove();
    const player = activePlayer ?? ExpoAudio.createAudioPlayer(null, { updateInterval: 250 });
    activePlayer = player;
    player.pause();
    player.replace(uri);
    player.setPlaybackRate(useAudioStore.getState().playbackSpeed);
    useAudioStore.setState({
      currentTrack: { surahId, ayahNumber, reciter, audioUrl: uri, title: `Surah ${surahId}, Ayah ${ayahNumber}` },
      isPlaying: false, playbackPosition: 0, duration: 0, currentRepeatIndex: 0,
    });
    let finishing = false;
    statusSubscription = player.addListener('playbackStatusUpdate', (status) => {
      if (activePlayer !== player || useAudioStore.getState().currentTrack?.audioUrl !== uri) return;
      const state = useAudioStore.getState();
      // One notification per native event, not three independent store broadcasts.
      const position = Math.floor(status.currentTime * 4) / 4;
      if (state.isPlaying !== status.playing || state.playbackPosition !== position || state.duration !== status.duration) {
        useAudioStore.setState({ isPlaying: status.playing, playbackPosition: position, duration: status.duration });
      }
      if (!status.didJustFinish || finishing) return;
      finishing = true;
      if (state.currentRepeatIndex < state.repeatCount - 1) {
        state.setCurrentRepeatIndex(state.currentRepeatIndex + 1);
        void player.seekTo(0).then(() => {
          if (activePlayer === player && pendingRequest === request) player.play();
        }).catch((error: unknown) => console.warn('Audio repeat failed:', error)).finally(() => { finishing = false; });
      } else if (options?.autoPlayNext !== false) {
        const loop = state.loopRange;
        const next = loop && ayahNumber >= loop.endAyah ? loop.startAyah : ayahNumber + 1;
        if (next <= total) void playAyah(surahId, next, reciter, { ayahCount: total, autoPlayNext: true });
      }
    });
    player.play();
    // Optional OS controls and downloads are not prerequisites for local playback.
    if (!isExpoGo) {
      try {
        player.setActiveForLockScreen(true, { title: `Surah ${surahId}, Ayah ${ayahNumber}`, artist: reciter });
      } catch (error) { console.warn('Lock screen controls unavailable:', error); }
      if (!requestedNotificationPermission) {
        requestedNotificationPermission = true;
        void ExpoAudio.requestNotificationPermissionsAsync?.().catch(() => {});
      }
    }
    useProgressStore.getState().recordAyahRead(1);
    void preloadAyahAudio(surahId, ayahNumber, reciter);
    if (options?.autoPlayNext !== false && ayahNumber < total) {
      void preloadAyahAudio(surahId, ayahNumber + 1, reciter);
    }
  } catch (error) {
    if (pendingRequest === request) useAudioStore.getState().setIsPlaying(false);
    console.warn('Audio playback failed:', error);
  }
};
