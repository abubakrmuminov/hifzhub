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

const verifiedAudioCache = new Map<string, string>();

export const clearAudioCache = (): void => {
  verifiedAudioCache.clear();
};

export const getAyahAudioUri = async (
  surahId: number,
  ayahNumber: number,
  reciter: string
): Promise<string> => {
  const reciterId = resolveReciterId(reciter);
  const cacheKey = `${reciterId}_${surahId}_${ayahNumber}`;
  const memoryUri = verifiedAudioCache.get(cacheKey);
  if (memoryUri) {
    return memoryUri;
  }

  const remoteUrl = buildTrackUrl(surahId, ayahNumber, reciterId);

  if (FileSystem.documentDirectory) {
    const dir = `${FileSystem.documentDirectory}audio/${reciterId}/${surahId}/`;
    const localUri = `${dir}${ayahNumber}.mp3`;
    try {
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists && (info as any).size > 1000) {
        verifiedAudioCache.set(cacheKey, localUri);
        return localUri;
      }

      // Non-blocking background caching: native player streams remoteUrl immediately
      // with zero startup delay while file caches for future offline/replay playback
      void (async () => {
        try {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
          const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
          if (downloadResult && downloadResult.status === 200) {
            verifiedAudioCache.set(cacheKey, downloadResult.uri);
          }
        } catch {}
      })();
    } catch (err) {
      console.warn('Audio caching check error, falling back to remote URL:', err);
    }
  }
  return remoteUrl;
};

/**
 * Preloads and caches an ayah audio file in the background so it starts instantly on tap
 */
export const preloadAyahAudio = async (
  surahId: number,
  ayahNumber: number,
  reciter: string
): Promise<void> => {
  const reciterId = resolveReciterId(reciter);
  const cacheKey = `${reciterId}_${surahId}_${ayahNumber}`;
  if (verifiedAudioCache.has(cacheKey)) return;

  if (FileSystem.documentDirectory) {
    const dir = `${FileSystem.documentDirectory}audio/${reciterId}/${surahId}/`;
    const localUri = `${dir}${ayahNumber}.mp3`;
    try {
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists && (info as any).size > 1000) {
        verifiedAudioCache.set(cacheKey, localUri);
        return;
      }

      const remoteUrl = buildTrackUrl(surahId, ayahNumber, reciterId);
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
      if (downloadResult && downloadResult.status === 200) {
        verifiedAudioCache.set(cacheKey, downloadResult.uri);
      }
    } catch {}
  }
};

let activePlayer: any = null;
let standbyPlayer: any = null;
let standbyKey: string | null = null;
let standbySessionId = 0;
let isAudioConfigured = false;

const applySpeed = (player: any, speed: number): void => {
  if (!player) return;
  try {
    if (typeof player.setPlaybackRate === 'function') {
      player.setPlaybackRate(speed);
    } else {
      player.playbackRate = speed;
    }
  } catch {}
};

const safeReleasePlayer = async (player: any): Promise<void> => {
  if (!player) return;
  try {
    if (!isExpoGo && typeof player.clearLockScreenControls === 'function') {
      player.clearLockScreenControls();
    }
  } catch {}
  try {
    player.pause();
    if (typeof player.remove === 'function') {
      player.remove();
    } else if (typeof player.release === 'function') {
      player.release();
    }
  } catch {}
};

const updateLockScreen = (
  player: any,
  surahId: number,
  ayahNumber: number,
  reciterId: string
): void => {
  if (!isExpoGo && typeof player.setActiveForLockScreen === 'function') {
    try {
      const reciterNames: Record<string, string> = {
        'ar.alafasy': 'Мишари Рашид',
        'ar.dussary': 'Ясир ад-Даусари',
        'ar.abdulbasetmurattal': 'Абдул-Басит',
        'ar.husary': 'Аль-Хусари',
        'ar.abdurrahmaansudais': 'Ас-Судейс',
      };
      const artistName = reciterNames[reciterId] ?? reciterId;

      player.setActiveForLockScreen(true, {
        title: `Сура ${surahId}, Аят ${ayahNumber}`,
        artist: artistName,
        albumTitle: 'HifzHub — Священный Коран',
      });
    } catch {}
  }
};

export const computeNextAyah = (
  surahId: number,
  currentAyah: number,
  total: number
): number | null => {
  const activeLoop = useAudioStore.getState().loopRange;
  if (activeLoop && activeLoop.startAyah && activeLoop.endAyah) {
    if (currentAyah >= activeLoop.endAyah) {
      return activeLoop.startAyah;
    }
    return currentAyah + 1;
  }
  if (currentAyah < total) {
    return currentAyah + 1;
  }
  return null;
};

export const setupPlayer = async (): Promise<boolean> => {
  if (isAudioConfigured) return true;
  if (!ExpoAudio) return false;

  try {
    if (ExpoAudio.setAudioModeAsync) {
      await ExpoAudio.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
    }
    if (!isExpoGo && ExpoAudio.requestNotificationPermissionsAsync) {
      try {
        await ExpoAudio.requestNotificationPermissionsAsync();
      } catch {}
    }
    isAudioConfigured = true;
    return true;
  } catch (err) {
    console.warn('Failed to configure audio mode:', err);
    return false;
  }
};

export const isPlayerReady = (): boolean => activePlayer != null;

export const playAudio = async (): Promise<void> => {
  if (activePlayer) {
    try {
      activePlayer.play();
      useAudioStore.getState().setIsPlaying(true);
    } catch (err) {
      console.warn('playAudio error:', err);
    }
  }
};

export const pauseAudio = async (): Promise<void> => {
  if (activePlayer) {
    try {
      activePlayer.pause();
      useAudioStore.getState().setIsPlaying(false);
    } catch (err) {
      console.warn('pauseAudio error:', err);
    }
  }
};

export const setPlaybackSpeed = async (speed: number): Promise<void> => {
  useAudioStore.getState().setPlaybackSpeed(speed);
  applySpeed(activePlayer, speed);
  applySpeed(standbyPlayer, speed);
};

export const seekAudio = async (positionSeconds: number): Promise<void> => {
  if (activePlayer) {
    try {
      if (activePlayer.seekTo) {
        await activePlayer.seekTo(positionSeconds);
      }
      useAudioStore.getState().setPlaybackPosition(positionSeconds);
    } catch (err) {
      console.warn('seekAudio error:', err);
    }
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

export const releaseStandbyPlayer = async (): Promise<void> => {
  if (standbyPlayer) {
    const p = standbyPlayer;
    standbyPlayer = null;
    standbyKey = null;
    await safeReleasePlayer(p);
  }
};

export const releaseActivePlayer = async (): Promise<void> => {
  if (activePlayer) {
    const p = activePlayer;
    activePlayer = null;
    await safeReleasePlayer(p);
  }
};

export const stopAudio = async (): Promise<void> => {
  standbySessionId++;
  await releaseStandbyPlayer();
  await releaseActivePlayer();
  useAudioStore.getState().setIsPlaying(false);
  useAudioStore.getState().setPlaybackPosition(0);
  useAudioStore.getState().setCurrentRepeatIndex(0);
  useAudioStore.getState().setCurrentTrack(null);
};

export interface PlayAyahOptions {
  ayahCount?: number;
  autoPlayNext?: boolean;
}

/**
 * Pre-buffers the standby player in native memory ahead of time so the next
 * ayah starts with 0ms micro-pause transition.
 */
const scheduleStandby = async (
  surahId: number,
  currentAyah: number,
  reciterId: string,
  total: number
): Promise<void> => {
  if (!ExpoAudio || !ExpoAudio.createAudioPlayer) return;

  const nextAyah = computeNextAyah(surahId, currentAyah, total);
  if (nextAyah === null) {
    await releaseStandbyPlayer();
    return;
  }

  const nextKey = `${reciterId}_${surahId}_${nextAyah}`;
  if (standbyKey === nextKey && standbyPlayer) {
    return;
  }

  const sessionId = ++standbySessionId;

  // Background download to disk cache
  void preloadAyahAudio(surahId, nextAyah, reciterId);

  try {
    const audioUri = await getAyahAudioUri(surahId, nextAyah, reciterId);
    if (sessionId !== standbySessionId) return;

    if (standbyPlayer && standbyKey !== nextKey) {
      await releaseStandbyPlayer();
    }
    if (sessionId !== standbySessionId) return;

    const player = ExpoAudio.createAudioPlayer(audioUri, {
      updateInterval: 250,
      keepAudioSessionActive: true,
      preferredForwardBufferDuration: 15,
    });

    applySpeed(player, useAudioStore.getState().playbackSpeed);

    standbyPlayer = player;
    standbyKey = nextKey;
  } catch (err) {
    // Non-fatal, fallback to live load on finish
  }
};

/**
 * Instantly promotes the pre-buffered standby player to active player with 0ms delay.
 */
const promoteStandbyToActive = (
  surahId: number,
  targetAyah: number,
  reciterId: string,
  total: number,
  autoPlayNext: boolean
): void => {
  if (!standbyPlayer) return;

  const nextPlayer = standbyPlayer;
  const oldPlayer = activePlayer;

  standbyPlayer = null;
  standbyKey = null;

  // Apply current speed
  applySpeed(nextPlayer, useAudioStore.getState().playbackSpeed);

  // Play INSTANTLY - 0ms gap!
  try {
    nextPlayer.play();
  } catch (err) {
    console.warn('promoteStandbyToActive play error:', err);
  }

  activePlayer = nextPlayer;

  // Update store immediately so UI reflects new ayah with zero latency
  const store = useAudioStore.getState();
  const audioUri = verifiedAudioCache.get(`${reciterId}_${surahId}_${targetAyah}`) ?? '';
  store.setCurrentRepeatIndex(0);
  store.setCurrentTrack({
    surahId,
    ayahNumber: targetAyah,
    reciter: reciterId,
    title: `Surah ${surahId}, Ayah ${targetAyah}`,
    audioUrl: audioUri,
  });
  store.setIsPlaying(true);
  store.setPlaybackPosition(0);

  try {
    const pStore = useProgressStore.getState();
    pStore.recordAyahRead(1);
    pStore.recordDailyActivity('listenedAudio');
    if (store.repeatCount > 1 || store.repeatMode === 'ayah') {
      pStore.recordDailyActivity('usedRepeat');
    }
    if (store.loopRange) {
      pStore.recordDailyActivity('usedRangeLoop');
    }
  } catch {}

  // Asynchronously release old player without delaying new playback
  void safeReleasePlayer(oldPlayer);

  // Configure lock screen and events for new active player
  updateLockScreen(nextPlayer, surahId, targetAyah, reciterId);
  attachPlayerEvents(nextPlayer, surahId, targetAyah, reciterId, total, autoPlayNext);

  // Immediately start preparing the NEXT standby player in the background
  if (autoPlayNext) {
    void scheduleStandby(surahId, targetAyah, reciterId, total);
  }
};

/**
 * Handles repeat counter or smooth handoff when an ayah finishes.
 */
const handleAyahFinish = (
  surahId: number,
  ayahNumber: number,
  reciterId: string,
  total: number,
  autoPlayNext: boolean
): void => {
  const currentStore = useAudioStore.getState();
  const repeatCount = currentStore.repeatCount ?? 1;
  const currentRep = currentStore.currentRepeatIndex ?? 0;

  if (currentRep < repeatCount - 1) {
    // Replay current ayah (instant seek & play)
    currentStore.setCurrentRepeatIndex(currentRep + 1);
    if (activePlayer) {
      try {
        if (activePlayer.seekTo) {
          activePlayer.seekTo(0);
        }
        activePlayer.play();
        currentStore.setIsPlaying(true);
        currentStore.setPlaybackPosition(0);
      } catch (err) {
        console.warn('Replay repeat error:', err);
      }
    }
    return;
  }

  // Finished all repeats for this ayah
  currentStore.setCurrentRepeatIndex(0);

  if (!autoPlayNext) {
    useAudioStore.getState().setIsPlaying(false);
    useAudioStore.getState().setPlaybackPosition(0);
    return;
  }

  const nextAyah = computeNextAyah(surahId, ayahNumber, total);
  if (nextAyah === null) {
    useAudioStore.getState().setIsPlaying(false);
    useAudioStore.getState().setPlaybackPosition(0);
    return;
  }

  const nextKey = `${reciterId}_${surahId}_${nextAyah}`;
  if (standbyPlayer && standbyKey === nextKey) {
    // ZERO-LATENCY INSTANT TRANSITION!
    promoteStandbyToActive(surahId, nextAyah, reciterId, total, autoPlayNext);
  } else {
    // Graceful fallback path
    void playAyah(surahId, nextAyah, reciterId, {
      ayahCount: total,
      autoPlayNext: true,
    });
  }
};

/**
 * Attaches real-time listeners and completion handler to the active player.
 */
const attachPlayerEvents = (
  player: any,
  surahId: number,
  ayahNumber: number,
  reciterId: string,
  total: number,
  autoPlayNext: boolean
): void => {
  if (!player || !player.addListener) return;

  let lastReportedPosition = -1;

  player.addListener('playbackStatusUpdate', (status: any) => {
    if (!status) return;

    // Discard callbacks from previous players
    if (player !== activePlayer) return;

    if (typeof status.playing === 'boolean') {
      useAudioStore.getState().setIsPlaying(status.playing);
    }

    if (typeof status.currentTime === 'number') {
      if (
        lastReportedPosition < 0 ||
        Math.abs(status.currentTime - lastReportedPosition) >= 0.25 ||
        status.didJustFinish
      ) {
        lastReportedPosition = status.currentTime;
        useAudioStore.getState().setPlaybackPosition(status.currentTime);
      }
    }

    if (typeof status.duration === 'number' && status.duration > 0) {
      useAudioStore.getState().setDuration(status.duration);

      // Verify standby player is active 2s before end if not already prepared
      if (
        autoPlayNext &&
        typeof status.currentTime === 'number' &&
        status.duration - status.currentTime <= 2 &&
        status.duration - status.currentTime > 0
      ) {
        const nextAyah = computeNextAyah(surahId, ayahNumber, total);
        if (nextAyah !== null) {
          const nextKey = `${reciterId}_${surahId}_${nextAyah}`;
          if (!standbyPlayer || standbyKey !== nextKey) {
            void scheduleStandby(surahId, ayahNumber, reciterId, total);
          }
        }
      }
    }

    if (status.didJustFinish) {
      handleAyahFinish(surahId, ayahNumber, reciterId, total, autoPlayNext);
    }
  });
};

export const playAyah = async (
  surahId: number,
  ayahNumber: number,
  reciterId: string,
  optionsOrAyahCount?: number | PlayAyahOptions
): Promise<void> => {
  await setupPlayer();
  const options: PlayAyahOptions =
    typeof optionsOrAyahCount === 'number'
      ? { ayahCount: optionsOrAyahCount, autoPlayNext: true }
      : { autoPlayNext: true, ...optionsOrAyahCount };

  const autoPlayNext = options.autoPlayNext ?? true;
  const ayahCount = options.ayahCount;

  const resolvedReciter = resolveReciterId(reciterId);
  const total = ayahCount ?? getAyahCountForSurah(surahId);

  // Fast path 1: if the requested ayah is already loaded in activePlayer, seek to 0 and play instantly (0ms delay)
  const store = useAudioStore.getState();
  const currentTrack = store.currentTrack;
  if (
    activePlayer &&
    currentTrack?.surahId === surahId &&
    currentTrack?.ayahNumber === ayahNumber &&
    currentTrack?.reciter === resolvedReciter
  ) {
    try {
      if (activePlayer.seekTo) {
        await activePlayer.seekTo(0);
      }
      activePlayer.play();
      store.setIsPlaying(true);
      store.setPlaybackPosition(0);
      store.setCurrentRepeatIndex(0);
      if (autoPlayNext) {
        void scheduleStandby(surahId, ayahNumber, resolvedReciter, total);
      }
      return;
    } catch {
      // Fall through to standard loading if seek/play failed
    }
  }

  // Fast path 2: if requested ayah is already pre-buffered in standbyPlayer, promote immediately (0ms delay)
  const reqKey = `${resolvedReciter}_${surahId}_${ayahNumber}`;
  if (standbyPlayer && standbyKey === reqKey) {
    promoteStandbyToActive(surahId, ayahNumber, resolvedReciter, total, autoPlayNext);
    return;
  }

  // Full initialization path
  standbySessionId++;
  void releaseStandbyPlayer();

  const audioUri = await getAyahAudioUri(surahId, ayahNumber, resolvedReciter);

  await releaseActivePlayer();

  store.setCurrentRepeatIndex(0);
  store.setCurrentTrack({
    surahId,
    ayahNumber,
    reciter: resolvedReciter,
    title: `Surah ${surahId}, Ayah ${ayahNumber}`,
    audioUrl: audioUri,
  });
  store.setIsPlaying(true);
  try {
    const pStore = useProgressStore.getState();
    pStore.recordAyahRead(1);
    pStore.recordDailyActivity('listenedAudio');
    if (store.repeatCount > 1 || store.repeatMode === 'ayah') {
      pStore.recordDailyActivity('usedRepeat');
    }
    if (store.loopRange) {
      pStore.recordDailyActivity('usedRangeLoop');
    }
  } catch {}

  if (!ExpoAudio || !ExpoAudio.createAudioPlayer) {
    return;
  }

  try {
    const player = ExpoAudio.createAudioPlayer(audioUri, {
      updateInterval: 250,
      keepAudioSessionActive: true,
      preferredForwardBufferDuration: 15,
    });
    activePlayer = player;

    applySpeed(player, store.playbackSpeed);
    updateLockScreen(player, surahId, ayahNumber, resolvedReciter);
    attachPlayerEvents(player, surahId, ayahNumber, resolvedReciter, total, autoPlayNext);

    player.play();

    // Immediately pre-buffer next ayah in native memory
    if (autoPlayNext) {
      void scheduleStandby(surahId, ayahNumber, resolvedReciter, total);
    }
  } catch (err) {
    console.warn('Failed to play ayah audio:', err);
    useAudioStore.getState().setIsPlaying(false);
  }
};
