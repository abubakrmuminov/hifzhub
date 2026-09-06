import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const asyncStorage: StateStorage = {
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  getItem: (name: string) => AsyncStorage.getItem(name),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export type DownloadStatus = 'idle' | 'downloading' | 'paused' | 'completed' | 'error';

export interface SurahDownloadInfo {
  surahId: number;
  status: DownloadStatus;
  progress: number;
  filePath?: string;
  error?: string;
  fileSize?: number;
  updatedAt: number;
}

export interface DownloadState {
  downloads: Record<number, SurahDownloadInfo>;

  setDownloadProgress: (surahId: number, progress: number) => void;
  setDownloadStatus: (
    surahId: number,
    status: DownloadStatus,
    filePath?: string,
    error?: string,
    fileSize?: number
  ) => void;
  removeDownload: (surahId: number) => void;
  getDownload: (surahId: number) => SurahDownloadInfo | undefined;
  isSurahDownloaded: (surahId: number) => boolean;
  clearAllDownloads: () => void;
  getTotalAudioStorageBytes: () => Promise<number>;
  calculateTotalAudioSize: () => Promise<number>;
  getSurahAudioSize: (surahId: number, reciterId?: string) => Promise<number>;
  deleteSurahAudio: (surahId: number, reciterId?: string) => Promise<void>;
  clearAllAudio: () => Promise<void>;
  deleteAllAudio: () => Promise<void>;
}

export const getTotalAudioStorageBytes = async (): Promise<number> => {
  if (!FileSystem.documentDirectory) return 0;
  const audioDir = FileSystem.documentDirectory.endsWith('/')
    ? `${FileSystem.documentDirectory}audio/`
    : `${FileSystem.documentDirectory}/audio/`;

  try {
    const dirInfo = await FileSystem.getInfoAsync(audioDir);
    if (!dirInfo.exists || !dirInfo.isDirectory) {
      return 0;
    }

    let totalBytes = 0;
    const stack: string[] = [audioDir];

    while (stack.length > 0) {
      const currentDir = stack.pop()!;
      let entries: string[] = [];
      try {
        entries = await FileSystem.readDirectoryAsync(currentDir);
      } catch {
        continue;
      }

      for (const entry of entries) {
        const fullPath = currentDir.endsWith('/')
          ? `${currentDir}${entry}`
          : `${currentDir}/${entry}`;
        try {
          const info = await FileSystem.getInfoAsync(fullPath);
          if (info.exists) {
            if (info.isDirectory) {
              stack.push(`${fullPath}/`);
            } else if (typeof (info as any).size === 'number') {
              totalBytes += (info as any).size;
            }
          }
        } catch {
          // Ignore individual file error
        }
      }
    }

    return totalBytes;
  } catch (err) {
    console.warn('getTotalAudioStorageBytes error:', err);
    return 0;
  }
};

export const deleteSurahAudio = async (
  surahId: number,
  reciterId?: string
): Promise<void> => {
  if (!FileSystem.documentDirectory) return;
  const baseAudioDir = FileSystem.documentDirectory.endsWith('/')
    ? `${FileSystem.documentDirectory}audio/`
    : `${FileSystem.documentDirectory}/audio/`;

  try {
    if (reciterId) {
      const targetDir = `${baseAudioDir}${reciterId}/${surahId}/`;
      const info = await FileSystem.getInfoAsync(targetDir);
      if (info.exists) {
        await FileSystem.deleteAsync(targetDir, { idempotent: true });
      }
    } else {
      const baseInfo = await FileSystem.getInfoAsync(baseAudioDir);
      if (baseInfo.exists && baseInfo.isDirectory) {
        const reciters = await FileSystem.readDirectoryAsync(baseAudioDir);
        for (const rec of reciters) {
          const targetDir = `${baseAudioDir}${rec}/${surahId}/`;
          const info = await FileSystem.getInfoAsync(targetDir);
          if (info.exists) {
            await FileSystem.deleteAsync(targetDir, { idempotent: true });
          }
        }
      }
    }
  } catch (err) {
    console.warn(`deleteSurahAudio error for surah ${surahId}:`, err);
  }

  useDownloadStore.getState().removeDownload(surahId);
};

export const clearAllAudio = async (): Promise<void> => {
  if (FileSystem.documentDirectory) {
    const audioDir = FileSystem.documentDirectory.endsWith('/')
      ? `${FileSystem.documentDirectory}audio/`
      : `${FileSystem.documentDirectory}/audio/`;
    try {
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(audioDir, { idempotent: true });
      }
    } catch (err) {
      console.warn('clearAllAudio error:', err);
    }
  }

  try {
    const { clearAudioCache } = await import('@/features/audio/services/trackPlayer');
    clearAudioCache();
  } catch {}

  useDownloadStore.getState().clearAllDownloads();
};

export const calculateTotalAudioSize = getTotalAudioStorageBytes;

export const getSurahAudioSize = async (
  surahId: number,
  reciterId?: string
): Promise<number> => {
  if (!FileSystem.documentDirectory) return 0;
  const baseAudioDir = FileSystem.documentDirectory.endsWith('/')
    ? `${FileSystem.documentDirectory}audio/`
    : `${FileSystem.documentDirectory}/audio/`;

  try {
    let totalBytes = 0;
    if (reciterId) {
      const targetDir = `${baseAudioDir}${reciterId}/${surahId}/`;
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(targetDir);
        for (const file of files) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(`${targetDir}${file}`);
            if (fileInfo.exists && typeof (fileInfo as any).size === 'number') {
              totalBytes += (fileInfo as any).size;
            }
          } catch {}
        }
      }
    } else {
      const baseInfo = await FileSystem.getInfoAsync(baseAudioDir);
      if (baseInfo.exists && baseInfo.isDirectory) {
        const reciters = await FileSystem.readDirectoryAsync(baseAudioDir);
        for (const rec of reciters) {
          const targetDir = `${baseAudioDir}${rec}/${surahId}/`;
          const dirInfo = await FileSystem.getInfoAsync(targetDir);
          if (dirInfo.exists && dirInfo.isDirectory) {
            const files = await FileSystem.readDirectoryAsync(targetDir);
            for (const file of files) {
              try {
                const fileInfo = await FileSystem.getInfoAsync(`${targetDir}${file}`);
                if (fileInfo.exists && typeof (fileInfo as any).size === 'number') {
                  totalBytes += (fileInfo as any).size;
                }
              } catch {}
            }
          }
        }
      }
    }
    return totalBytes;
  } catch (err) {
    console.warn(`getSurahAudioSize error for surah ${surahId}:`, err);
    return 0;
  }
};

export const deleteAllAudio = clearAllAudio;

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {},

      setDownloadProgress: (surahId, progress) =>
        set((state) => {
          const current = state.downloads[surahId];
          return {
            downloads: {
              ...state.downloads,
              [surahId]: {
                surahId,
                status: 'downloading',
                progress,
                filePath: current?.filePath,
                fileSize: current?.fileSize,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      setDownloadStatus: (surahId, status, filePath, error, fileSize) =>
        set((state) => {
          const current = state.downloads[surahId];
          return {
            downloads: {
              ...state.downloads,
              [surahId]: {
                surahId,
                status,
                progress: status === 'completed' ? 100 : (current?.progress ?? 0),
                filePath: filePath ?? current?.filePath,
                fileSize: fileSize ?? current?.fileSize,
                error,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      removeDownload: (surahId) =>
        set((state) => {
          const next = { ...state.downloads };
          delete next[surahId];
          return { downloads: next };
        }),

      getDownload: (surahId) => get().downloads[surahId],

      isSurahDownloaded: (surahId) =>
        get().downloads[surahId]?.status === 'completed',

      clearAllDownloads: () => set({ downloads: {} }),

      getTotalAudioStorageBytes: () => getTotalAudioStorageBytes(),
      calculateTotalAudioSize: () => getTotalAudioStorageBytes(),
      getSurahAudioSize: (surahId, reciterId) => getSurahAudioSize(surahId, reciterId),
      deleteSurahAudio: (surahId, reciterId) => deleteSurahAudio(surahId, reciterId),
      clearAllAudio: () => clearAllAudio(),
      deleteAllAudio: () => clearAllAudio(),
    }),
    {
      name: 'hifzhub-downloads',
      storage: createJSONStorage(() => asyncStorage),
    }
  )
);

export const downloadStore = useDownloadStore;
