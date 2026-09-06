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

      // Ensure directory exists
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});

      // Download and cache locally so subsequent playback has 0 latency
      const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
      if (downloadResult && downloadResult.status === 200) {
        verifiedAudioCache.set(cacheKey, downloadResult.uri);
        return downloadResult.uri;
      }
    } catch (err) {
      console.warn('Audio caching error, falling back to remote URL:', err);
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
  try {
    await getAyahAudioUri(surahId, ayahNumber, reciter);
  } catch {}
};

let activePlayer: any = null;
let isAudioConfigured = false;

export const setupPlayer = async (): Promise<boolean> => {
  if (isAudioConfigured) return true;
  if (!ExpoAudio) return false;

  try {
    if (ExpoAudio.setAudioModeAsync) {
      await ExpoAudio.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
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
  if (activePlayer) {
    try {
      if (typeof activePlayer.setPlaybackRate === 'function') {
        activePlayer.setPlaybackRate(speed);
      } else {
        activePlayer.playbackRate = speed;
      }
    } catch (err) {
      console.warn('setPlaybackRate error:', err);
    }
  }
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

export const releaseActivePlayer = async (): Promise<void> => {
  if (activePlayer) {
    try {
      if (!isExpoGo && typeof activePlayer.clearLockScreenControls === 'function') {
        activePlayer.clearLockScreenControls();
      }
    } catch {}
    try {
      activePlayer.pause();
      if (activePlayer.release) {
        activePlayer.release();
      }
    } catch {}
    activePlayer = null;
  }
};

export const stopAudio = async (): Promise<void> => {
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

  const getNextAyah = (): number | null => {
    const activeLoop = useAudioStore.getState().loopRange;
    if (activeLoop && activeLoop.startAyah && activeLoop.endAyah) {
      if (ayahNumber >= activeLoop.endAyah) {
        return activeLoop.startAyah;
      }
      return ayahNumber + 1;
    }
    if (ayahNumber < total) {
      return ayahNumber + 1;
    }
    return null;
  };

  // Preload next ayah right when current starts so next ayah starts instantly with 0ms gap
  const nextAyah = getNextAyah();
  if (nextAyah !== null) {
    void preloadAyahAudio(surahId, nextAyah, resolvedReciter);
  }

  // Fast path: if the requested ayah is already loaded in activePlayer, seek to 0 and play instantly (0ms delay!)
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
      return;
    } catch {
      // Fall through to full initialization if seek/play failed
    }
  }

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
    useProgressStore.getState().recordAyahRead(1);
  } catch {}

  if (!ExpoAudio || !ExpoAudio.createAudioPlayer) {
    return;
  }

  try {
    const player = ExpoAudio.createAudioPlayer(audioUri);
    activePlayer = player;

    // Apply speed setting
    try {
      if (typeof player.setPlaybackRate === 'function') {
        player.setPlaybackRate(store.playbackSpeed);
      } else {
        player.playbackRate = store.playbackSpeed;
      }
    } catch {}

    // Lock screen media controls (enabled in dev client & production builds, disabled in Expo Go)
    if (!isExpoGo && typeof player.setActiveForLockScreen === 'function') {
      try {
        const reciterNames: Record<string, string> = {
          'ar.alafasy': 'Мишари Рашид',
          'ar.dussary': 'Ясир ад-Даусари',
          'ar.abdulbasetmurattal': 'Абдул-Басит',
          'ar.husary': 'Аль-Хусари',
          'ar.abdurrahmaansudais': 'Ас-Судейс',
        };
        const artistName = reciterNames[resolvedReciter] ?? resolvedReciter;

        player.setActiveForLockScreen(true, {
          title: `Сура ${surahId}, Аят ${ayahNumber}`,
          artist: artistName,
          albumTitle: 'HifzHub — Священный Коран',
        });
      } catch (e) {
        // Ignored
      }
    }

    if (player.addListener) {
      player.addListener('playbackStatusUpdate', (status: any) => {
        if (!status) return;

        if (typeof status.playing === 'boolean') {
          useAudioStore.getState().setIsPlaying(status.playing);
        }
        if (typeof status.currentTime === 'number') {
          useAudioStore.getState().setPlaybackPosition(status.currentTime);
        }
        if (typeof status.duration === 'number' && status.duration > 0) {
          useAudioStore.getState().setDuration(status.duration);

          // Preload next ayah 2 seconds before end
          if (
            typeof status.currentTime === 'number' &&
            status.duration - status.currentTime <= 2 &&
            status.duration - status.currentTime > 0
          ) {
            const next = getNextAyah();
            if (next !== null) {
              void preloadAyahAudio(surahId, next, resolvedReciter);
            }
          }
        }

        if (status.didJustFinish) {
          const currentStore = useAudioStore.getState();
          const repeatCount = currentStore.repeatCount ?? 1;
          const currentRep = currentStore.currentRepeatIndex ?? 0;

          if (currentRep < repeatCount - 1) {
            // Replay current ayah and increment currentRepeatIndex
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
          } else {
            // Finished all repeats, reset currentRepeatIndex to 0 and proceed to next ayah
            currentStore.setCurrentRepeatIndex(0);

            if (!autoPlayNext) {
              useAudioStore.getState().setIsPlaying(false);
              useAudioStore.getState().setPlaybackPosition(0);
              return;
            }

            const activeLoop = currentStore.loopRange;
            if (activeLoop && activeLoop.startAyah && activeLoop.endAyah) {
              if (ayahNumber >= activeLoop.endAyah) {
                // Loop back to startAyah!
                void playAyah(surahId, activeLoop.startAyah, resolvedReciter, {
                  ayahCount: total,
                  autoPlayNext: true,
                });
                return;
              } else {
                void playAyah(surahId, ayahNumber + 1, resolvedReciter, {
                  ayahCount: total,
                  autoPlayNext: true,
                });
                return;
              }
            }

            if (ayahNumber < total) {
              void playAyah(surahId, ayahNumber + 1, resolvedReciter, {
                ayahCount: total,
                autoPlayNext: true,
              });
            } else {
              useAudioStore.getState().setIsPlaying(false);
              useAudioStore.getState().setPlaybackPosition(0);
            }
          }
        }
      });
    }

    player.play();
  } catch (err) {
    console.warn('Failed to play ayah audio:', err);
    useAudioStore.getState().setIsPlaying(false);
  }
};
