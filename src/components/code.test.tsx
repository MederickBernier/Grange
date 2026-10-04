import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Barcode,
  GrangeProvider,
  MASKS,
  MAX_VERSION,
  PATTERNS,
  QRCode,
  checksum,
  chooseVersion,
  codewords,
  dataCapacity,
  encodeCode128,
  encodeQR,
  formatBits,
  generator,
  gfMul,
  moduleWidth,
  remainder,
  sizeOf,
  versionBits,
  widths,
  type EcLevel,
} from '../index';

const LEVELS: EcLevel[] = ['L', 'M', 'Q', 'H'];

describe('the Code 128 table', () => {
  /*
   * Checked by arithmetic rather than by proof-reading 107 six-digit strings: every symbol is
   * six bar and space widths adding to eleven modules, and the stop is seven adding to
   * thirteen. A single mistyped digit breaks the sum.
   */
  it('has 107 patterns, each adding up to its module count', () => {
    expect(PATTERNS).toHaveLength(107);
    PATTERNS.forEach((pattern, value) => {
      const sum = [...pattern].reduce((total, digit) => total + Number(digit), 0);
      if (value === 106) {
        expect(`${value}:${pattern.length}:${sum}`).toBe(`${value}:7:13`);
      } else {
        expect(`${value}:${pattern.length}:${sum}`).toBe(`${value}:6:11`);
      }
    });
  });

  it('has no two symbols the same', () => {
    expect(new Set(PATTERNS).size).toBe(PATTERNS.length);
  });
});

describe('Code 128 encoding', () => {
  it('starts in set B for text, and checks out', () => {
    // Start B is 104 and 'A' is 33; the check is (104 + 33 × 1) mod 103 = 34.
    expect(encodeCode128('A')).toEqual([104, 33, 34]);
  });

  it('uses set C for a long run of digits, two to a symbol', () => {
    // Start C is 105, then the pairs, then (105 + 1 + 23×2 + 45×3 + 67×4 + 89×5) mod 103 = 73.
    expect(encodeCode128('0123456789')).toEqual([105, 1, 23, 45, 67, 89, 73]);
  });

  it('leaves a short run of digits in set B, where it is cheaper', () => {
    // Switching for two digits costs more in switch characters than the pairing saves.
    expect(encodeCode128('12')[0]).toBe(104);
  });

  it('switches back to B after a digit run', () => {
    const values = encodeCode128('12345678X');
    expect(values[0]).toBe(105);
    // Code B is 100, and the letter follows it.
    expect(values).toContain(100);
  });

  it('weights the start code once rather than twice', () => {
    // The position weighting starts at 1 for the symbol after the start code.
    expect(checksum([104, 33])).toBe(34);
  });

  it('refuses a character it cannot carry, rather than dropping it', () => {
    // A silently dropped character means a barcode that scans as something else.
    expect(() => encodeCode128('café')).toThrow(/cannot encode/);
  });

  it('alternates bars and spaces, starting and ending with a bar', () => {
    const bars = widths('ABC123');
    // The stop pattern is seven widths, so the whole symbol has an odd count: bar last.
    expect(bars.length % 2).toBe(1);
    expect(moduleWidth('ABC123')).toBe(bars.reduce((sum, width) => sum + width, 0));
  });
});

describe('GF(256) and Reed-Solomon', () => {
  it('multiplies in the field the standard specifies', () => {
    expect(gfMul(3, 7)).toBe(9);
    expect(gfMul(0, 5)).toBe(0);
  });

  it('builds the generator polynomial the standard publishes', () => {
    // The seven-codeword generator, highest power first.
    expect([...generator(7)]).toEqual([1, 127, 122, 154, 164, 11, 68, 117]);
  });

  it('produces the published remainder for a known block', () => {
    /*
     * The data codewords of "HELLO WORLD" at version 1-M, and the ten error-correction
     * codewords the standard's own worked example gives for them. This is the one check here
     * that is not self-referential.
     */
    const data = Uint8Array.from([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17]);
    expect([...remainder(data, 10)]).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
  });
});

describe('the QR tables', () => {
  /** The total codewords each version holds, which the block table has to add up to. */
  const CAPACITY = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

  it('matches the published byte-mode capacities', () => {
    // If a block count or a codeword count were mistyped, these would not line up.
    expect(LEVELS.map((level) => dataCapacity(1, level))).toEqual([19, 16, 13, 9]);
    expect(LEVELS.map((level) => dataCapacity(10, level))).toEqual([274, 216, 154, 122]);
  });

  it('never claims more data than a version can hold', () => {
    for (let version = 1; version <= MAX_VERSION; version += 1) {
      for (const level of LEVELS) {
        expect(dataCapacity(version, level)).toBeLessThan(CAPACITY[version - 1]!);
      }
    }
  });

  it('computes format information rather than transcribing it', () => {
    expect(formatBits('L', 0).toString(2).padStart(15, '0')).toBe('111011111000100');
    expect(formatBits('M', 0).toString(2).padStart(15, '0')).toBe('101010000010010');
  });

  it('keeps the BCH minimum distance of seven between every format code', () => {
    /*
     * The property the code exists for: any two format codes differ in at least seven bits, so
     * a damaged one can still be read. It is also a complete check on the arithmetic — a wrong
     * generator or mask would collapse it.
     */
    const all = LEVELS.flatMap((level) => MASKS.map((_, mask) => formatBits(level, mask)));
    expect(new Set(all).size).toBe(32);

    let min = Infinity;
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        let x = all[i]! ^ all[j]!;
        let bits = 0;
        while (x) {
          bits += x & 1;
          x >>= 1;
        }
        min = Math.min(min, bits);
      }
    }
    expect(min).toBe(7);
  });

  it('computes the version information the standard publishes', () => {
    expect(versionBits(7).toString(2).padStart(18, '0')).toBe('000111110010010100');
  });

  it('picks the smallest version that will hold the data', () => {
    /*
     * 19 is version 1-L's data *codewords*, not its byte capacity: the mode and the length
     * field take twenty bits before any of the string does, which leaves seventeen bytes.
     * Confusing the two is how a picker ends up one version too small.
     */
    expect(chooseVersion(1, 'L')).toBe(1);
    expect(chooseVersion(17, 'L')).toBe(1);
    expect(chooseVersion(18, 'L')).toBe(2);
    expect(chooseVersion(9999, 'L')).toBeNull();
  });
});

describe('the finished QR grid', () => {
  /*
   * The real test: read the codewords back out of the symbol the way a scanner would — find
   * the mask in the format information, unmask, walk the same zigzag — and check they are the
   * ones that went in. It caught an alignment pattern being dropped from version 7 upwards,
   * which produced a symbol that looked like a QR code and scanned as nothing.
   */
  const roundTrip = (text: string, level: EcLevel) => {
    const grid = encodeQR(text, level);
    const size = grid.length;
    const version = (size - 17) / 4;
    const expected = [...codewords(new TextEncoder().encode(text), version, level)];

    let format = 0;
    for (let i = 0; i <= 5; i += 1) format |= grid[8]![i]! << i;
    format |= grid[8]![7]! << 6;
    format |= grid[8]![8]! << 7;
    format |= grid[7]![8]! << 8;
    for (let i = 9; i <= 14; i += 1) format |= grid[14 - i]![8]! << i;
    const mask = ((format ^ 0x5412) >> 10) & 0b111;

    const functional = functionMap(version);
    const bits: number[] = [];
    let upward = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let step = 0; step < size; step += 1) {
        const row = upward ? size - 1 - step : step;
        for (const col of [right, right - 1]) {
          if (functional[row]![col]) continue;
          bits.push(grid[row]![col]! ^ (MASKS[mask]!(row, col) ? 1 : 0));
        }
      }
      upward = !upward;
    }

    const read: number[] = [];
    for (let i = 0; i + 8 <= bits.length && read.length < expected.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j]!;
      read.push(byte);
    }
    return { read, expected, version, size };
  };

  it('reads back what was encoded, at every version it supports', () => {
    for (const [text, level] of [
      ['HELLO WORLD', 'M'],
      ['https://example.com/x?y=1', 'Q'],
      ['z'.repeat(120), 'L'],
      ['q'.repeat(230), 'L'],
      ['w'.repeat(150), 'Q'],
    ] as const) {
      const { read, expected, version, size } = roundTrip(text, level);
      expect(`v${version}:${size}`).toBe(`v${version}:${sizeOf(version)}`);
      expect(read).toEqual(expected);
    }
  });

  it('puts the three finders and the dark module where they belong', () => {
    const grid = encodeQR('x', 'M');
    const size = grid.length;
    for (const [row, col] of [[0, 0], [0, size - 7], [size - 7, 0]] as const) {
      // Dark 3x3 core, a light ring around it, then the dark 7x7 border.
      expect(grid[row + 3]![col + 3]).toBe(1);
      expect(grid[row + 1]![col + 3]).toBe(0);
      expect(grid[row]![col]).toBe(1);
    }
    expect(grid[size - 8]![8]).toBe(1);
  });

  it('refuses what will not fit rather than truncating it', () => {
    // A QR code holding half a URL is worse than none: it looks like it worked.
    expect(() => encodeQR('x'.repeat(5000), 'H')).toThrow(/more than a version/);
  });

  it('is bigger at a higher error-correction level, for the same string', () => {
    expect(encodeQR('x'.repeat(100), 'H').length).toBeGreaterThan(encodeQR('x'.repeat(100), 'L').length);
  });

  it('encodes any string, because byte mode is UTF-8', () => {
    expect(() => encodeQR('café ☕ 日本語', 'M')).not.toThrow();
  });
});

describe('Barcode', () => {
  it('reads its own value out, so no scanner is needed to know what it says', () => {
    render(<Barcode value="ABC-123" />);
    expect(screen.getByRole('img', { name: 'ABC-123' })).not.toBeNull();
  });

  it('carries its quiet zone inside the picture, where a layout cannot crop it', () => {
    const { container } = render(<Barcode value="A" quietZone={10} showValue={false} />);
    const svg = container.querySelector('svg')!;
    // Ten modules either side of the symbol itself.
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${moduleWidth('A') + 20} 32`);
  });

  it('prints the human-readable line, and can be told not to', () => {
    const { container, rerender } = render(<Barcode value="A1" />);
    expect(container.querySelector('text')!.textContent).toBe('A1');

    rerender(<Barcode value="A1" showValue={false} />);
    expect(container.querySelector('text')).toBeNull();
  });

  it('takes its size from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Barcode: { moduleSize: 4, height: 32 } }}>
        <Barcode value="A" showValue={false} />
      </GrangeProvider>,
    );
    expect(container.querySelector('svg')!.getAttribute('height')).toBe('32');
  });
});

describe('QRCode', () => {
  it('reads its own value out', () => {
    render(<QRCode value="https://example.com" />);
    expect(screen.getByRole('img', { name: 'https://example.com' })).not.toBeNull();
  });

  it('draws every module in one path rather than a thousand elements', () => {
    const { container } = render(<QRCode value="https://example.com" />);
    // A version 10 symbol is over three thousand modules; a rect each is a DOM nobody needs.
    expect(container.querySelectorAll('path')).toHaveLength(1);
    expect(container.querySelectorAll('rect')).toHaveLength(1);
  });

  it('carries the standard\'s four-module quiet zone', () => {
    const { container } = render(<QRCode value="x" level="M" />);
    const modules = encodeQR('x', 'M').length;
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe(`0 0 ${modules + 8} ${modules + 8}`);
  });

  it('takes its level from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ QRCode: { level: 'H', moduleSize: 2 } }}>
        <QRCode value={'x'.repeat(100)} />
      </GrangeProvider>,
    );
    const size = encodeQR('x'.repeat(100), 'H').length + 8;
    expect(container.querySelector('svg')!.getAttribute('width')).toBe(String(size * 2));
  });
});

/** Which modules are function patterns, worked out independently of the encoder. */
function functionMap(version: number): boolean[][] {
  const size = sizeOf(version);
  const map: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const mark = (r: number, c: number) => {
    if (r >= 0 && r < size && c >= 0 && c < size) map[r]![c] = true;
  };

  for (const [row, col] of [[0, 0], [0, size - 7], [size - 7, 0]] as const) {
    for (let r = -1; r <= 7; r += 1) for (let c = -1; c <= 7; c += 1) mark(row + r, col + c);
  }
  for (let i = 0; i < size; i += 1) {
    mark(6, i);
    mark(i, 6);
  }
  const centres: number[][] = [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  ];
  for (const row of centres[version - 1]!) {
    for (const col of centres[version - 1]!) {
      const nearFinder =
        (row <= 8 && col <= 8) || (row <= 8 && col >= size - 9) || (row >= size - 9 && col <= 8);
      if (nearFinder) continue;
      for (let r = -2; r <= 2; r += 1) for (let c = -2; c <= 2; c += 1) mark(row + r, col + c);
    }
  }
  for (let i = 0; i < 9; i += 1) {
    mark(8, i);
    mark(i, 8);
  }
  for (let i = 0; i < 8; i += 1) {
    mark(8, size - 1 - i);
    mark(size - 1 - i, 8);
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i += 1)
      for (let j = 0; j < 3; j += 1) {
        mark(i, size - 11 + j);
        mark(size - 11 + j, i);
      }
  }
  return map;
}
