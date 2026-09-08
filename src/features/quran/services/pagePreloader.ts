import { getAyahTajweedSegments } from './tajweedParser';
import type { Ayah } from '@/db/schema';

export interface PreloadQueueItem {
  surahId: number;
  ayahNumber: number;
  textUthmani?: string;
}

/**
 * Pre-warms Tajweed parser memory cache for all ayahs in the given list.
 * Synchronous and instant (pure in-memory string parsing, < 1ms).
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
 * Intelligently pre-warms Tajweed parser memory cache for current and nearby pages.
 * Fully synchronous and in-memory.
 * Zero network requests, zero disk I/O, zero thread blocking.
 */
export function preloadMushafPages(
  pages: { pageNumber: number; ayahs: Ayah[] }[],
  currentPageIndex: number
): void {
  const targetIndices = [
    currentPageIndex,
    currentPageIndex + 1,
    currentPageIndex - 1,
    currentPageIndex + 2,
    currentPageIndex - 2,
  ];

  for (const pageIdx of targetIndices) {
    if (pageIdx >= 0 && pageIdx < pages.length) {
      const page = pages[pageIdx];
      if (page?.ayahs) {
        warmupPagesTajweed(page.ayahs);
      }
    }
  }
}

/**
 * Kept for backwards compatibility.
 * Audio is streamed and buffered on-demand by trackPlayer when actively playing.
 * During reading, background audio downloading is intentionally disabled to avoid
 * saturating mobile bandwidth, disk I/O, and freezing the UI thread.
 */
export async function preloadMushafPagesAudio(
  _surahId: number,
  pages: { pageNumber: number; ayahs: Ayah[] }[],
  currentPageIndex: number,
  _reciter?: string
): Promise<void> {
  preloadMushafPages(pages, currentPageIndex);
}
