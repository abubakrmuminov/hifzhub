import { useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import {
  useDownloadStore,
  type DownloadStatus,
  getTotalAudioStorageBytes,
  deleteSurahAudio as storeDeleteSurahAudio,
  clearAllAudio as storeClearAllAudio,
  getSurahAudioSize as storeGetSurahAudioSize,
} from '@/stores/downloadStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  buildTrackUrl,
  getAyahCountForSurah,
  resolveReciterId,
} from '@/features/audio/services/trackPlayer';

export { type DownloadStatus } from '@/stores/downloadStore';

/**
 * Resolves the base audio storage directory in documents.
 * Ensures consistent trailing slash.
 */
export const getBaseAudioDirectory = (): string => {
  if (!FileSystem.documentDirectory) return '';
  return FileSystem.documentDirectory.endsWith('/')
    ? `${FileSystem.documentDirectory}audio/`
    : `${FileSystem.documentDirectory}/audio/`;
};

/**
 * Resolves the folder path for a specific surah and reciter.
 * Format: ${FileSystem.documentDirectory}audio/${reciter}/${surahId}/
 */
export const getSurahAudioDirectory = (surahId: number, reciter: string): string => {
  const base = getBaseAudioDirectory();
  const reciterId = resolveReciterId(reciter);
  return `${base}${reciterId}/${surahId}/`;
};

/**
 * Resolves the local file path for a single ayah MP3.
 * Format: ${FileSystem.documentDirectory}audio/${reciter}/${surahId}/${ayah}.mp3
 */
export const getAyahAudioFilePath = (
  surahId: number,
  ayahNumber: number,
  reciter: string
): string => {
  return `${getSurahAudioDirectory(surahId, reciter)}${ayahNumber}.mp3`;
};

/**
 * Generates the remote download URL for an ayah.
 * Specially routes Yasser Ad-Dawsari (ar.dussary) to EveryAyah CDN:
 * https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${paddedSurah}${paddedAyah}.mp3
 */
export const getEveryAyahAudioUrl = (
  surahId: number,
  ayahNumber: number,
  reciter: string
): string => {
  const reciterId = resolveReciterId(reciter);
  if (
    reciterId === 'ar.dussary' ||
    reciterId === 'dussary' ||
    reciterId.toLowerCase().includes('dussary')
  ) {
    const surahPadded = String(surahId).padStart(3, '0');
    const ayahPadded = String(ayahNumber).padStart(3, '0');
    return `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${surahPadded}${ayahPadded}.mp3`;
  }
  return buildTrackUrl(surahId, ayahNumber, reciterId);
};

// Re-export size & deletion helpers for clean access
export const getSurahAudioSize = async (
  surahId: number,
  reciter?: string
): Promise<number> => {
  return storeGetSurahAudioSize(surahId, reciter ? resolveReciterId(reciter) : undefined);
};

export const calculateTotalAudioSize = async (): Promise<number> => {
  return getTotalAudioStorageBytes();
};

export const deleteSurahAudio = async (
  surahId: number,
  reciter?: string
): Promise<void> => {
  return storeDeleteSurahAudio(surahId, reciter ? resolveReciterId(reciter) : undefined);
};

export const deleteAllAudio = async (): Promise<void> => {
  return storeClearAllAudio();
};

/**
 * Controller to track in-flight concurrent download tasks
 */
interface DownloadTaskController {
  isPaused: boolean;
  isCancelled: boolean;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

const activeDownloadControllers = new Map<number, DownloadTaskController>();

export const pauseSurahDownload = (surahId: number): void => {
  const controller = activeDownloadControllers.get(surahId);
  if (controller) {
    controller.pause();
  }
  useDownloadStore.getState().setDownloadStatus(surahId, 'paused');
};

export const cancelSurahDownload = async (
  surahId: number,
  reciterId?: string
): Promise<void> => {
  const controller = activeDownloadControllers.get(surahId);
  if (controller) {
    controller.cancel();
    activeDownloadControllers.delete(surahId);
  }
  useDownloadStore.getState().setDownloadProgress(surahId, 0);
  useDownloadStore.getState().setDownloadStatus(surahId, 'idle');
  await deleteSurahAudio(surahId, reciterId);
};

/**
 * Downloads all ayahs for a given surah using a concurrent queue (3 at a time).
 * Supports cancel, pause, and resume.
 */
export const startSurahDownload = async (
  surahId: number,
  reciterId?: string,
  ayahCount?: number
): Promise<void> => {
  const defaultReciter = useSettingsStore.getState().defaultReciter;
  const activeReciter = resolveReciterId(reciterId || defaultReciter || 'ar.alafasy');
  const totalAyahs = ayahCount ?? getAyahCountForSurah(surahId);
  if (totalAyahs <= 0) return;

  const existingController = activeDownloadControllers.get(surahId);
  if (existingController && !existingController.isPaused && !existingController.isCancelled) {
    // Already in progress
    return;
  }

  let isPaused = false;
  let isCancelled = false;

  const controller: DownloadTaskController = {
    get isPaused() {
      return isPaused;
    },
    get isCancelled() {
      return isCancelled;
    },
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
    },
    cancel: () => {
      isCancelled = true;
    },
  };
  activeDownloadControllers.set(surahId, controller);

  const dir = getSurahAudioDirectory(surahId, activeReciter);

  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    // 1. Scan existing files to allow resume from exact remaining ayahs
    const pendingAyahs: number[] = [];
    let initialCompletedCount = 0;

    for (let ayah = 1; ayah <= totalAyahs; ayah++) {
      const filePath = `${dir}${ayah}.mp3`;
      try {
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists && (info as any).size > 1000) {
          initialCompletedCount++;
        } else {
          pendingAyahs.push(ayah);
        }
      } catch {
        pendingAyahs.push(ayah);
      }
    }

    if (pendingAyahs.length === 0) {
      activeDownloadControllers.delete(surahId);
      useDownloadStore.getState().setDownloadProgress(surahId, 100);
      useDownloadStore.getState().setDownloadStatus(surahId, 'completed', dir);
      return;
    }

    useDownloadStore.getState().setDownloadStatus(surahId, 'downloading');
    const initialProgress = Math.round((initialCompletedCount / totalAyahs) * 100);
    useDownloadStore.getState().setDownloadProgress(surahId, initialProgress);

    // 2. Concurrency queue (3 ayahs at a time)
    const CONCURRENCY = 3;
    let nextAyahIndex = 0;
    let totalCompleted = initialCompletedCount;
    let workerError: Error | null = null;

    const runWorker = async () => {
      while (nextAyahIndex < pendingAyahs.length) {
        if (controller.isCancelled || controller.isPaused) {
          return;
        }

        const taskIndex = nextAyahIndex++;
        if (taskIndex >= pendingAyahs.length) break;

        const ayah = pendingAyahs[taskIndex];
        const filePath = `${dir}${ayah}.mp3`;
        const remoteUrl = getEveryAyahAudioUrl(surahId, ayah, activeReciter);

        try {
          const downloadResult = await FileSystem.downloadAsync(remoteUrl, filePath);
          if (!downloadResult || downloadResult.status !== 200) {
            throw new Error(`Ayah ${ayah} download failed with status ${downloadResult?.status}`);
          }
        } catch (err) {
          if (controller.isCancelled || controller.isPaused) return;
          workerError = err instanceof Error ? err : new Error(String(err));
          return;
        }

        if (controller.isCancelled || controller.isPaused) {
          return;
        }

        totalCompleted++;
        const currentProgress = Math.min(
          100,
          Math.round((totalCompleted / totalAyahs) * 100)
        );
        useDownloadStore.getState().setDownloadProgress(surahId, currentProgress);
      }
    };

    const workerPromises = [];
    const poolSize = Math.min(CONCURRENCY, pendingAyahs.length);
    for (let i = 0; i < poolSize; i++) {
      workerPromises.push(runWorker());
    }

    await Promise.all(workerPromises);

    if (controller.isCancelled) {
      activeDownloadControllers.delete(surahId);
      useDownloadStore.getState().setDownloadProgress(surahId, 0);
      useDownloadStore.getState().setDownloadStatus(surahId, 'idle');
      return;
    }

    if (controller.isPaused) {
      useDownloadStore.getState().setDownloadStatus(surahId, 'paused');
      return;
    }

    if (workerError) {
      throw workerError;
    }

    // Success
    activeDownloadControllers.delete(surahId);
    useDownloadStore.getState().setDownloadProgress(surahId, 100);
    useDownloadStore.getState().setDownloadStatus(surahId, 'completed', dir);
  } catch (err) {
    if (controller.isCancelled) {
      activeDownloadControllers.delete(surahId);
      useDownloadStore.getState().setDownloadProgress(surahId, 0);
      useDownloadStore.getState().setDownloadStatus(surahId, 'idle');
      return;
    }

    if (controller.isPaused) {
      useDownloadStore.getState().setDownloadStatus(surahId, 'paused');
      return;
    }

    activeDownloadControllers.delete(surahId);
    const errorMessage = err instanceof Error ? err.message : 'Download failed';
    useDownloadStore.getState().setDownloadStatus(surahId, 'error', undefined, errorMessage);
  }
};

export const resumeSurahDownload = async (
  surahId: number,
  reciterId?: string,
  ayahCount?: number
): Promise<void> => {
  return startSurahDownload(surahId, reciterId, ayahCount);
};

export interface UseDownloadProps {
  surahId: number;
  reciterId?: string;
  ayahCount?: number;
}

export interface UseDownloadReturn {
  startDownload: () => Promise<void>;
  pauseDownload: () => void;
  resumeDownload: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  progress: number;
  status: DownloadStatus;
  error?: string;
  isDownloaded: boolean;
}

export const useDownload = ({
  surahId,
  reciterId,
  ayahCount,
}: UseDownloadProps): UseDownloadReturn => {
  const defaultReciter = useSettingsStore((s) => s.defaultReciter);
  const activeReciter = resolveReciterId(reciterId || defaultReciter || 'ar.alafasy');
  const totalAyahs = ayahCount ?? getAyahCountForSurah(surahId);

  const existingDownload = useDownloadStore((s) => s.downloads[surahId]);
  const status: DownloadStatus = existingDownload?.status ?? 'idle';
  const progress: number = existingDownload?.progress
    ? existingDownload.progress / 100
    : 0;
  const error = existingDownload?.error;
  const isDownloaded = status === 'completed';

  const start = useCallback(async () => {
    await startSurahDownload(surahId, activeReciter, totalAyahs);
  }, [surahId, activeReciter, totalAyahs]);

  const pause = useCallback(() => {
    pauseSurahDownload(surahId);
  }, [surahId]);

  const resume = useCallback(async () => {
    await resumeSurahDownload(surahId, activeReciter, totalAyahs);
  }, [surahId, activeReciter, totalAyahs]);

  const cancel = useCallback(async () => {
    await cancelSurahDownload(surahId, activeReciter);
  }, [surahId, activeReciter]);

  return {
    startDownload: start,
    pauseDownload: pause,
    resumeDownload: resume,
    cancelDownload: cancel,
    progress,
    status,
    error,
    isDownloaded,
  };
};
