import { describe, expect, it } from 'vitest';
import { circularWavePath, linearWavePath } from './wave';

/** Pulls the coordinate pairs back out of a path so the geometry can be checked numerically. */
function points(path: string): Array<[number, number]> {
  return path
    .replace(/^M /, '')
    .split(' L ')
    .map((pair) => {
      const [x, y] = pair.trim().split(/\s+/).map(Number);
      return [x!, y!] as [number, number];
    });
}

describe('linearWavePath', () => {
  it('starts at the centre line, since sin(0) is 0', () => {
    const [first] = points(linearWavePath({ width: 100, centerY: 5, amplitude: 3, wavelength: 40 }));
    expect(first).toEqual([0, 5]);
  });

  it('swings exactly one amplitude either side and no further', () => {
    const ys = points(linearWavePath({ width: 200, centerY: 5, amplitude: 3, wavelength: 40 })).map(
      ([, y]) => y,
    );
    expect(Math.max(...ys)).toBeCloseTo(8, 1);
    expect(Math.min(...ys)).toBeCloseTo(2, 1);
  });

  it('peaks a quarter wavelength in', () => {
    const path = linearWavePath({ width: 40, centerY: 0, amplitude: 4, wavelength: 40 });
    const atQuarter = points(path).find(([x]) => x === 10);
    expect(atQuarter?.[1]).toBeCloseTo(4, 1);
  });

  it('ends exactly on the requested width, not on the last whole step', () => {
    const path = linearWavePath({ width: 99, centerY: 0, amplitude: 3, wavelength: 40 });
    expect(points(path).at(-1)?.[0]).toBe(99);
  });

  it('draws past the end by the overshoot, so the flow can loop seamlessly', () => {
    const plain = points(linearWavePath({ width: 100, centerY: 0, amplitude: 3, wavelength: 40 }));
    const over = points(
      linearWavePath({ width: 100, centerY: 0, amplitude: 3, wavelength: 40, overshoot: 40 }),
    );
    expect(plain.at(-1)?.[0]).toBe(100);
    expect(over.at(-1)?.[0]).toBe(140);
  });

  it('repeats every wavelength', () => {
    const path = linearWavePath({ width: 120, centerY: 0, amplitude: 3, wavelength: 40 });
    const at = (x: number) => points(path).find((p) => p[0] === x)?.[1];
    expect(at(10)).toBeCloseTo(at(50)!, 2);
    expect(at(10)).toBeCloseTo(at(90)!, 2);
  });

  it('returns nothing for a zero width or wavelength, rather than a broken path', () => {
    expect(linearWavePath({ width: 0, centerY: 0, amplitude: 3, wavelength: 40 })).toBe('');
    expect(linearWavePath({ width: 100, centerY: 0, amplitude: 3, wavelength: 0 })).toBe('');
  });
});

describe('circularWavePath', () => {
  const base = { radius: 20, amplitude: 1.6, wavelength: 15, centerX: 24, centerY: 24 };

  it("starts at twelve o'clock", () => {
    const first = points(circularWavePath({ ...base, sweep: 1 }))[0]!;
    expect(first[0]).toBeCloseTo(24, 1);
    expect(first[1]).toBeCloseTo(4, 1);
  });

  it("runs clockwise, so a quarter sweep ends at three o'clock", () => {
    const last = points(circularWavePath({ ...base, sweep: 0.25 })).at(-1)!;
    expect(last[0]).toBeGreaterThan(base.centerX + 15);
    expect(last[1]).toBeCloseTo(24, 0);
  });

  it('keeps every point within one amplitude of the radius', () => {
    for (const [x, y] of points(circularWavePath({ ...base, sweep: 1 }))) {
      const r = Math.hypot(x - base.centerX, y - base.centerY);
      expect(r).toBeGreaterThanOrEqual(base.radius - base.amplitude - 0.05);
      expect(r).toBeLessThanOrEqual(base.radius + base.amplitude + 0.05);
    }
  });

  it('samples a bigger circle more finely, so the crests stay smooth', () => {
    const small = points(circularWavePath({ ...base, radius: 10, sweep: 1 })).length;
    const large = points(circularWavePath({ ...base, radius: 40, sweep: 1 })).length;
    expect(large).toBeGreaterThan(small * 3);
  });

  it('caps the sweep at a full circle', () => {
    const full = circularWavePath({ ...base, sweep: 1 });
    expect(circularWavePath({ ...base, sweep: 2 })).toBe(full);
  });

  it('returns nothing for a zero sweep or radius', () => {
    expect(circularWavePath({ ...base, sweep: 0 })).toBe('');
    expect(circularWavePath({ ...base, radius: 0, sweep: 1 })).toBe('');
  });
});
