import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '@/shared/storage/mmkvStorage';

export interface BookmarkItem {
  id: number; // ayah id
  surahId: number;
  ayahNumber: number;
  addedAt: number;
}

export interface BookmarkState {
  bookmarks: Record<number, BookmarkItem>;
  toggleBookmark: (ayah: { id: number; surahId: number; ayahNumber: number }) => boolean;
  isBookmarked: (ayahId: number) => boolean;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: {},
      toggleBookmark: (ayah) => {
        const current = get().bookmarks;
        const exists = Boolean(current[ayah.id]);
        const updated = { ...current };

        if (exists) {
          delete updated[ayah.id];
          set({ bookmarks: updated });
          return false;
        } else {
          updated[ayah.id] = {
            id: ayah.id,
            surahId: ayah.surahId,
            ayahNumber: ayah.ayahNumber,
            addedAt: Date.now(),
          };
          set({ bookmarks: updated });
          return true;
        }
      },
      isBookmarked: (ayahId: number) => {
        return Boolean(get().bookmarks[ayahId]);
      },
    }),
    {
      name: 'hifzhub-bookmarks',
      storage: createJSONStorage(() => appStorage),
    }
  )
);