import {
  clampIndex,
  initialBases,
  pageForBase,
  pagesForLogical,
} from './mushafPagerMath';

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(clampIndex(-2, 10), 0, 'clamp low');
assertEqual(clampIndex(99, 10), 9, 'clamp high');
assertEqual(clampIndex(3, 0), 0, 'clamp empty');

assertEqual(pageForBase(0, 0, 48, true), 0, 'rtl current');
assertEqual(pageForBase(0, -1, 48, true), 1, 'rtl next');
assertEqual(pageForBase(0, 1, 48, true), -1, 'rtl prev at start');
assertEqual(pageForBase(47, -1, 48, true), -1, 'rtl next at end');
assertEqual(pageForBase(5, 1, 48, true), 4, 'rtl prev');

assertEqual(pageForBase(0, 1, 10, false), 1, 'ltr next');
assertEqual(pageForBase(0, -1, 10, false), -1, 'ltr prev at start');

const startWindow = pagesForLogical(0, 48, true, initialBases());
assertEqual(startWindow[0], 0, 'start center');
assertEqual(startWindow[1], 1, 'start next (rtl left slot)');
assertEqual(startWindow[2], -1, 'start prev empty (rtl right slot)');

const mid = pagesForLogical(10, 48, true, initialBases());
assertEqual(mid[0], 10, 'mid center');
assertEqual(mid[1], 11, 'mid next');
assertEqual(mid[2], 9, 'mid prev');

console.log('mushafPagerMath ok');
