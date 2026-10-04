/**
 * Code 128, encoded here rather than brought in.
 *
 * A barcode library is a table and a checksum; the dependency costs more than the code. What
 * follows is the standard's own pattern table, the code-set switching, and the modulo-103
 * check character — nothing is invented, and the pieces that could be mistyped are checked by
 * invariants rather than by eye.
 *
 * **The table is guarded by arithmetic.** Every one of the 106 symbols is six bar-and-space
 * widths that must add up to 11 modules, and the stop pattern is seven widths adding to 13.
 * A single wrong digit breaks that sum, which is what the tests assert — far more reliable
 * than proof-reading 107 six-digit strings.
 */

/**
 * The 107 patterns, as alternating bar and space widths starting with a bar.
 *
 * Index is the symbol value: 0–102 are the data symbols, 103–105 the three start codes, and
 * 106 the stop.
 */
export const PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

export const START_A = 103;
export const START_B = 104;
export const START_C = 105;
export const STOP = 106;

/** Code set B covers printable ASCII from space to delete, at value = code - 32. */
const inSetB = (code: number) => code >= 32 && code <= 126;

/**
 * Where a run of digits long enough to be worth code set C starts, from `at`.
 *
 * The standard's rule: four or more digits at the start or end, six or more in the middle. Two
 * digits per symbol is the only reason C exists, and switching for a shorter run costs more in
 * switch characters than it saves.
 */
function digitRun(text: string, at: number): number {
  let length = 0;
  while (at + length < text.length && text[at + length]! >= '0' && text[at + length]! <= '9') length += 1;
  return length;
}

/**
 * The symbol values for a string, including the start code, any switches, and the check
 * character — everything but the stop.
 *
 * Throws on a character Code 128 cannot carry. Silently dropping it would produce a barcode
 * that scans as something other than what was asked for, which is worse than not producing one.
 */
export function encode(text: string): number[] {
  for (const character of text) {
    const code = character.codePointAt(0)!;
    if (!inSetB(code)) {
      throw new Error(`Code 128 cannot encode ${JSON.stringify(character)}: only ASCII 32 to 126.`);
    }
  }

  const values: number[] = [];
  let index = 0;
  let set: 'B' | 'C' | null = null;

  while (index < text.length) {
    const run = digitRun(text, index);
    const atEdge = index === 0 || index + run === text.length;
    const wantsC = run >= (atEdge ? 4 : 6) && run % 2 === 0;

    if (wantsC) {
      // An odd run would leave a digit over, so only an even prefix of it goes into C.
      const pairs = Math.floor(run / 2);
      if (set === null) values.push(START_C);
      else if (set !== 'C') values.push(99); // Code C
      set = 'C';
      for (let pair = 0; pair < pairs; pair += 1) {
        values.push(Number(text.slice(index + pair * 2, index + pair * 2 + 2)));
      }
      index += pairs * 2;
      continue;
    }

    if (set === null) values.push(START_B);
    else if (set !== 'B') values.push(100); // Code B
    set = 'B';
    values.push(text.codePointAt(index)! - 32);
    index += 1;
  }

  if (values.length === 0) values.push(START_B);

  values.push(checksum(values));
  return values;
}

/**
 * The modulo-103 check character: the start code plus each symbol weighted by its position.
 *
 * The start code counts as position 1 and is *not* weighted again, which is the part everyone
 * gets wrong when writing this from the description.
 */
export function checksum(values: readonly number[]): number {
  const [start = START_B, ...rest] = values;
  const total = rest.reduce((sum, value, i) => sum + value * (i + 1), start);
  return total % 103;
}

/**
 * The bars and spaces as widths, starting with a bar and alternating.
 *
 * The stop pattern already carries the two-module termination bar, so nothing is appended here
 * — a second one would make the symbol unscannable at the right quiet zone.
 */
export function widths(text: string): number[] {
  const values = [...encode(text), STOP];
  return values.flatMap((value) => [...PATTERNS[value]!].map(Number));
}

/** The total width of a symbol in modules, which is what the SVG's viewBox needs. */
export function moduleWidth(text: string): number {
  return widths(text).reduce((sum, width) => sum + width, 0);
}
