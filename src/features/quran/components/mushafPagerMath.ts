export type SlotBase = -1 | 0 | 1;

export function clampIndex(index: number, pageCount: number): number {
  if (pageCount <= 0) return 0;
  return Math.max(0, Math.min(index, pageCount - 1));
}

export function pageForBase(
  logical: number,
  base: SlotBase,
  pageCount: number,
  rtl: boolean
): number {
  if (pageCount <= 0) return -1;
  if (base === 0) return logical;
  const goingNext = rtl ? base === -1 : base === 1;
  if (goingNext) {
    return logical + 1 < pageCount ? logical + 1 : -1;
  }
  return logical - 1 >= 0 ? logical - 1 : -1;
}

export function initialBases(): [SlotBase, SlotBase, SlotBase] {
  return [0, -1, 1];
}

export function pagesForLogical(
  logical: number,
  pageCount: number,
  rtl: boolean,
  bases: [SlotBase, SlotBase, SlotBase]
): [number, number, number] {
  return [
    pageForBase(logical, bases[0], pageCount, rtl),
    pageForBase(logical, bases[1], pageCount, rtl),
    pageForBase(logical, bases[2], pageCount, rtl),
  ];
}
