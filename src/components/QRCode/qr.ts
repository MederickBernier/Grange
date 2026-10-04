/**
 * A QR encoder, written here rather than brought in.
 *
 * It does byte mode — any string, as UTF-8 — at every error-correction level, up to version 10
 * (57 by 57 modules, 271 bytes at level L). That covers the things people actually put in a QR
 * code: a URL, a ticket id, a Wi-Fi string. Beyond version 10 the numbers keep going and so
 * does the table; the cap is where the honest cost of transcribing more stopped being worth it,
 * and `encode` says so rather than drawing something that will not scan.
 *
 * **Every table here is cross-checked by arithmetic rather than by eye.** The block table's
 * data and error-correction codewords must add up to the version's known capacity, for all
 * forty combinations; the format and version information are *computed* from their BCH
 * generators rather than transcribed. What is left to get wrong is small and tested.
 */
import { remainder } from './galois';

export type EcLevel = 'L' | 'M' | 'Q' | 'H';

/*
 * The total codewords each version holds are 26, 44, 70, 100, 134, 172, 196, 242, 292 and
 * 346. The block table below has to add up to them, and `code.test.tsx` is where that is
 * asserted rather than here — a constant nothing reads is a comment with extra steps.
 */

/**
 * Per version and level: error-correction codewords per block, then the two groups of blocks
 * as [count, data codewords each]. A second group of zero blocks means one group only.
 */
const BLOCKS: Record<EcLevel, ReadonlyArray<readonly [number, number, number, number, number]>> = {
  L: [
    [7, 1, 19, 0, 0],
    [10, 1, 34, 0, 0],
    [15, 1, 55, 0, 0],
    [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0],
    [18, 2, 68, 0, 0],
    [20, 2, 78, 0, 0],
    [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0],
    [18, 2, 68, 2, 69],
  ],
  M: [
    [10, 1, 16, 0, 0],
    [16, 1, 28, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0],
    [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37],
    [26, 4, 43, 1, 44],
  ],
  Q: [
    [13, 1, 13, 0, 0],
    [22, 1, 22, 0, 0],
    [18, 2, 17, 0, 0],
    [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16],
    [24, 4, 19, 0, 0],
    [18, 2, 14, 4, 15],
    [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17],
    [24, 6, 19, 2, 20],
  ],
  H: [
    [17, 1, 9, 0, 0],
    [28, 1, 16, 0, 0],
    [22, 2, 13, 0, 0],
    [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12],
    [28, 4, 15, 0, 0],
    [26, 4, 13, 1, 14],
    [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13],
    [28, 6, 15, 2, 16],
  ],
};

/** Where the alignment patterns' centres go, per version. Version 1 has none. */
const ALIGNMENT: ReadonlyArray<readonly number[]> = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

export const MAX_VERSION = BLOCKS.L.length;

/** How many data **codewords** a version and level can hold. */
export function dataCapacity(version: number, level: EcLevel): number {
  const [, g1, d1, g2, d2] = BLOCKS[level][version - 1]!;
  return g1 * d1 + g2 * d2;
}

/**
 * How many **bytes** of content will fit, which is the smaller number people mean.
 *
 * The mode indicator and the length field come out of the same budget first — twenty bits at
 * version 1, twenty-eight from version 10 — so version 1-L holds seventeen bytes rather than
 * the nineteen codewords it has. Confusing the two is how a picker ends up one version small.
 */
export function byteCapacity(version: number, level: EcLevel): number {
  const lengthBits = version < 10 ? 8 : 16;
  return Math.floor((dataCapacity(version, level) * 8 - 4 - lengthBits) / 8);
}

/** The modules across one side of a symbol. */
export const sizeOf = (version: number) => 17 + 4 * version;

/**
 * Bits, written most significant first, which is the order every field in a QR code goes in.
 */
class Bits {
  readonly bits: number[] = [];

  push(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i -= 1) this.bits.push((value >> i) & 1);
  }

  get length(): number {
    return this.bits.length;
  }
}

/**
 * The smallest version that will hold the data, or null if none up to the cap will.
 *
 * The length field is 8 bits up to version 9 and 16 from version 10, so the needed capacity
 * changes partway up — which is why this walks the versions rather than solving for one.
 */
export function chooseVersion(byteLength: number, level: EcLevel): number | null {
  for (let version = 1; version <= MAX_VERSION; version += 1) {
    const lengthBits = version < 10 ? 8 : 16;
    const needed = 4 + lengthBits + byteLength * 8;
    if (needed <= dataCapacity(version, level) * 8) return version;
  }
  return null;
}

/** The data codewords: mode, length, the bytes, a terminator, and the standard padding. */
function dataCodewords(bytes: Uint8Array, version: number, level: EcLevel): Uint8Array {
  const capacity = dataCapacity(version, level);
  const bits = new Bits();
  bits.push(0b0100, 4); // byte mode
  bits.push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) bits.push(byte, 8);

  // Up to four zero bits of terminator, then zeros to the next whole codeword.
  const terminator = Math.min(4, capacity * 8 - bits.length);
  bits.push(0, terminator);
  while (bits.length % 8 !== 0) bits.push(0, 1);

  const out = new Uint8Array(capacity);
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits.bits[i + j]!;
    out[i / 8] = byte;
  }

  // The two pad bytes the standard names, alternating, until the block is full.
  for (let i = bits.length / 8, pad = 0; i < capacity; i += 1, pad += 1) {
    out[i] = pad % 2 === 0 ? 0xec : 0x11;
  }
  return out;
}

/**
 * The full codeword stream: the blocks' data interleaved, then their error correction
 * interleaved after it.
 *
 * Interleaving is what makes the error correction worth having. A scratch across the symbol
 * takes one or two codewords out of every block rather than all of one block's, and a block
 * can only repair up to half its own error-correction codewords.
 */
export function codewords(bytes: Uint8Array, version: number, level: EcLevel): Uint8Array {
  const [ecPerBlock, g1, d1, g2, d2] = BLOCKS[level][version - 1]!;
  const data = dataCodewords(bytes, version, level);

  const blocks: Uint8Array[] = [];
  let at = 0;
  for (let i = 0; i < g1; i += 1) {
    blocks.push(data.slice(at, at + d1));
    at += d1;
  }
  for (let i = 0; i < g2; i += 1) {
    blocks.push(data.slice(at, at + d2));
    at += d2;
  }

  const ec = blocks.map((block) => remainder(block, ecPerBlock));
  const out: number[] = [];

  const longest = Math.max(d1, d2);
  for (let i = 0; i < longest; i += 1) {
    for (const block of blocks) if (i < block.length) out.push(block[i]!);
  }
  for (let i = 0; i < ecPerBlock; i += 1) {
    for (const block of ec) out.push(block[i]!);
  }

  return Uint8Array.from(out);
}

type Grid = Int8Array[];

/** -1 is "not written yet", which is what tells the placement where it may go. */
const blank = (size: number): Grid => Array.from({ length: size }, () => new Int8Array(size).fill(-1));

function drawFinder(grid: Grid, row: number, col: number): void {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const y = row + r;
      const x = col + c;
      if (y < 0 || y >= grid.length || x < 0 || x >= grid.length) continue;
      const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
      // The separator is the ring at distance 4, which is always light.
      grid[y]![x] = ring === 2 || ring === 4 ? 0 : 1;
    }
  }
}

function drawFunctionPatterns(grid: Grid, version: number): void {
  const size = grid.length;

  drawFinder(grid, 0, 0);
  drawFinder(grid, 0, size - 7);
  drawFinder(grid, size - 7, 0);

  // Timing: alternating modules along row and column 6, between the finders.
  for (let i = 8; i < size - 8; i += 1) {
    const on = i % 2 === 0 ? 1 : 0;
    grid[6]![i] = on;
    grid[i]![6] = on;
  }

  const centres = ALIGNMENT[version - 1]!;
  for (const row of centres) {
    for (const col of centres) {
      /*
       * Skipped only where a finder already is — not wherever something has been written.
       * From version 7 the middle centre lands on the timing row, and treating "already
       * written" as a collision silently drops that pattern. The symbol still looks like a QR
       * code and does not scan; a round-trip test is what caught it.
       */
      const nearFinder =
        (row <= 8 && col <= 8) || (row <= 8 && col >= size - 9) || (row >= size - 9 && col <= 8);
      if (nearFinder) continue;
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          grid[row + r]![col + c] = Math.max(Math.abs(r), Math.abs(c)) === 1 ? 0 : 1;
        }
      }
    }
  }

  // The dark module, which is always on and is not part of any pattern.
  grid[size - 8]![8] = 1;
}

/** The modules the format and version information will take, reserved so data skips them. */
function reserveInformation(grid: Grid, version: number): void {
  const size = grid.length;
  for (let i = 0; i < 9; i += 1) {
    if (grid[8]![i] === -1) grid[8]![i] = 0;
    if (grid[i]![8] === -1) grid[i]![8] = 0;
  }
  for (let i = 0; i < 8; i += 1) {
    if (grid[8]![size - 1 - i] === -1) grid[8]![size - 1 - i] = 0;
    if (grid[size - 1 - i]![8] === -1) grid[size - 1 - i]![8] = 0;
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        grid[i]![size - 11 + j] = 0;
        grid[size - 11 + j]![i] = 0;
      }
    }
  }
}

/**
 * The 15-bit format information: two bits of level, three of mask, and a BCH(15,5) remainder,
 * the whole thing exclusive-ored with the standard's 0x5412 so an all-zero format is not all
 * light.
 *
 * Computed rather than transcribed, which removes a table that would otherwise be 32 entries
 * of nothing but opportunity for a typo.
 */
export function formatBits(level: EcLevel, mask: number): number {
  const levelBits: Record<EcLevel, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 };
  const data = (levelBits[level] << 3) | mask;
  let rest = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((rest >> i) & 1) rest ^= 0x537 << (i - 10);
  }
  return ((data << 10) | rest) ^ 0x5412;
}

/** The 18-bit version information, for version 7 and up. Also computed, from its own generator. */
export function versionBits(version: number): number {
  let rest = version << 12;
  for (let i = 17; i >= 12; i -= 1) {
    if ((rest >> i) & 1) rest ^= 0x1f25 << (i - 12);
  }
  return (version << 12) | rest;
}

/** The eight mask patterns, by rule number. True means "flip this module". */
export const MASKS: ReadonlyArray<(row: number, col: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/**
 * The penalty score the standard uses to pick a mask: runs of the same colour, solid blocks,
 * anything that looks like a finder, and an imbalance of dark to light.
 *
 * Lower is better. The rules exist to keep a symbol from containing shapes a scanner would
 * mistake for structure, which is why the finder-lookalike rule is worth so much.
 */
export function penalty(grid: Grid): number {
  const size = grid.length;
  let score = 0;

  // Rule 1: five or more of the same colour in a row, in both directions.
  for (const vertical of [false, true]) {
    for (let a = 0; a < size; a += 1) {
      let run = 1;
      for (let b = 1; b < size; b += 1) {
        const here = vertical ? grid[b]![a]! : grid[a]![b]!;
        const before = vertical ? grid[b - 1]![a]! : grid[a]![b - 1]!;
        if (here === before) {
          run += 1;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else run = 1;
      }
    }
  }

  // Rule 2: every two-by-two block of one colour.
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const v = grid[r]![c]!;
      if (v === grid[r]![c + 1] && v === grid[r + 1]![c] && v === grid[r + 1]![c + 1]) score += 3;
    }
  }

  // Rule 3: the finder's own 1:1:3:1:1 signature, with four light modules on either side.
  const target = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const reversed = [...target].reverse();
  for (const vertical of [false, true]) {
    for (let a = 0; a < size; a += 1) {
      for (let b = 0; b + 11 <= size; b += 1) {
        const run = Array.from({ length: 11 }, (_, i) => (vertical ? grid[b + i]![a]! : grid[a]![b + i]!));
        if (run.every((v, i) => v === target[i]) || run.every((v, i) => v === reversed[i])) score += 40;
      }
    }
  }

  // Rule 4: how far the proportion of dark modules is from half.
  let dark = 0;
  for (const row of grid) for (const value of row) if (value === 1) dark += 1;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/**
 * The finished module grid: 1 for dark, 0 for light.
 *
 * Throws when the data will not fit in any supported version, rather than truncating. A QR
 * code that encodes half a URL is worse than no QR code, because it looks like it worked.
 */
export function encode(text: string, level: EcLevel = 'M'): number[][] {
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length, level);
  if (version == null) {
    throw new Error(
      `${bytes.length} bytes is more than a version ${MAX_VERSION} QR code at level ${level} can hold (${byteCapacity(MAX_VERSION, level)} bytes).`,
    );
  }

  const size = sizeOf(version);
  const base = blank(size);
  drawFunctionPatterns(base, version);
  reserveInformation(base, version);

  const stream = codewords(bytes, version, level);
  const bits: number[] = [];
  for (const byte of stream) for (let i = 7; i >= 0; i -= 1) bits.push((byte >> i) & 1);

  // The zigzag: two columns at a time from the right, upwards then downwards, skipping the
  // timing column entirely rather than stepping over it.
  const grid = base.map((row) => Int8Array.from(row));
  let bit = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (const col of [right, right - 1]) {
        if (grid[row]![col] !== -1) continue;
        grid[row]![col] = bit < bits.length ? bits[bit]! : 0;
        bit += 1;
      }
    }
    upward = !upward;
  }

  // Each mask is scored on a finished symbol, format information included, because the format
  // modules count towards the penalty like any others.
  let best: Int8Array[] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < MASKS.length; mask += 1) {
    const candidate = grid.map((row, r) =>
      Int8Array.from(row, (value, c) => (base[r]![c] === -1 && MASKS[mask]!(r, c) ? value ^ 1 : value)),
    );
    writeFormat(candidate, level, mask);
    if (version >= 7) writeVersion(candidate, version);
    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best!.map((row) => [...row]);
}

function writeFormat(grid: Int8Array[], level: EcLevel, mask: number): void {
  const size = grid.length;
  const bits = formatBits(level, mask);
  const at = (i: number) => (bits >> i) & 1;

  for (let i = 0; i <= 5; i += 1) grid[8]![i] = at(i);
  grid[8]![7] = at(6);
  grid[8]![8] = at(7);
  grid[7]![8] = at(8);
  for (let i = 9; i <= 14; i += 1) grid[14 - i]![8] = at(i);

  for (let i = 0; i <= 7; i += 1) grid[size - 1 - i]![8] = at(i);
  for (let i = 8; i <= 14; i += 1) grid[8]![size - 15 + i] = at(i);
}

function writeVersion(grid: Int8Array[], version: number): void {
  const size = grid.length;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i += 1) {
    const bit = (bits >> i) & 1;
    const row = Math.floor(i / 3);
    const col = (i % 3) + size - 11;
    grid[row]![col] = bit;
    grid[col]![row] = bit;
  }
}
