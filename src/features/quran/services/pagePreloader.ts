import { preloadAyahAudio } from '@/features/audio';
import { getAyahTajweedSegments } from './tajweedParser';
import type { Ayah } from '@/db/schema';

export interface PreloadQueueItem {
  surahId: number;
  ayahNumber: number;
  textUthmani?: string;
}

let activePreloadAbortController: AbortController | null = null;

/**
 * Pre-warms Tajweed parser memory cache for all ayahs in the given list.
 * Synchronous and instant (pure string parsing).
 */
export function warmupPagesTajweed(ayahs: Ayah[]): void {
  for (let i = 0; i < ayahs.length; i++) {
    const a = ayahs[i];
    if (a.surahId && a.ayahNumber) {
      try {
        getAyahTajweedSegments(a.surahId, a.ayahNumber, a.textUthmani);
      } catch {}
    }
  }
}

/**
 * Intelligently prioritizes and downloads audio files in the background:
 * 1. Current page (where user stopped / is reading)
 * 2. Next page (direction of forward reading)
 * 3. Previous page (direction of backward reading)
 * 4. Page + 2 & Page - 2 (broader buffer)
 */
export async function preloadMushafPagesAudio(
  surahId: number,
  pages: { pageNumber: number; ayahs: Ayah[] }[],
  currentPageIndex: number,
  reciter: string
): Promise<void> {
  // Cancel any running previous queue if the user flipped to another page
  if (activePreloadAbortController) {
    activePreloadAbortController.abort();
  }

  const abortController = new AbortController();
  activePreloadAbortController = abortController;
  const signal = abortController.signal;

  // Determine prioritized order of page indices: [current, current+1, current-1, current+2, current-2]
  const targetIndices: number[] = [];
  const addIndex = (idx: number) => {
    if (idx >= 0 && idx < pages.length && !targetIndices.includes(idx)) {
      targetIndices.push(idx);
    }
  };

  addIndex(currentPageIndex);
  addIndex(currentPageIndex + 1);
  addIndex(currentPageIndex - 1);
  addIndex(currentPageIndex + 2);
  addIndex(currentPageIndex - 2);

  // 1. Immediately warm up Tajweed for all these pages in memory
  for (const pageIdx of targetIndices) {
    if (signal.aborted) return;
    const page = pages[pageIdx];
    if (page?.ayahs) {
      warmupPagesTajweed(page.ayahs);
    }
  }

  // 2. Build ordered list of ayahs to download
  const audioQueue: { surahId: number; ayahNumber: number }[] = [];
  for (const pageIdx of targetIndices) {
    const page = pages[pageIdx];
    if (page?.ayahs) {
      for (const ayah of page.ayahs) {
        audioQueue.push({ surahId, ayahNumber: ayah.ayahNumber });
      }
    }
  }

  // 3. Download in parallel batches of 2 files at a time to prevent network contention
  const CONCURRENCY = 2;
  let cursor = 0;

  const downloadNext = async (): Promise<void> => {
    while (cursor < audioQueue.length && !signal.aborted) {
      const item = audioQueue[cursor++];
      if (!item) break;
      try {
        await preloadAyahAudio(item.surahId, item.ayahNumber, reciter);
      } catch {
        // Continue silently on transient network errors
      }
    }
  };

  const workers = [];
  for (let w = 0; w < Math.min(CONCURRENCY, audioQueue.length); w++) {
    workers.push(downloadNext());
  }

  await Promise.all(workers);
}
