import { describe, expect, it } from 'vitest';
import { morph, regularPolygon, resample, roundedPath } from './polygon';

const distance = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);

describe('regularPolygon', () => {
  it('puts every corner on the circle of the given radius', () => {
    for (const p of regularPolygon(7, 20)) {
      expect(distance(p)).toBeCloseTo(20, 5);
    }
  });

  it('gives one point per side', () => {
    expect(regularPolygon(3, 10)).toHaveLength(3);
    expect(regularPolygon(12, 10)).toHaveLength(12);
  });

  it("starts at twelve o'clock, so a triangle points up", () => {
    const [first] = regularPolygon(3, 10);
    expect(first!.x).toBeCloseTo(0, 5);
    expect(first!.y).toBeCloseTo(-10, 5);
  });

  it('refuses a shape that is not one', () => {
    expect(regularPolygon(2, 10)).toEqual([]);
    expect(regularPolygon(5, 0)).toEqual([]);
  });
});

describe('resample', () => {
  it('returns exactly the number of points asked for', () => {
    expect(resample(regularPolygon(3, 10), 48)).toHaveLength(48);
    expect(resample(regularPolygon(12, 10), 48)).toHaveLength(48);
  });

  it('keeps every point on the original outline', () => {
    // A square's resampled points sit on its edges, so none is further out than a corner.
    const square = regularPolygon(4, 10);
    for (const p of resample(square, 40)) {
      expect(distance(p)).toBeLessThanOrEqual(10.001);
    }
  });

  it('spreads points evenly rather than bunching them at corners', () => {
    const points = resample(regularPolygon(4, 10), 40);
    const gaps: number[] = [];
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i]!;
      const b = points[(i + 1) % points.length]!;
      gaps.push(Math.hypot(b.x - a.x, b.y - a.y));
    }
    const min = Math.min(...gaps);
    const max = Math.max(...gaps);
    // Even to within a whisker; a corner-based resample would be far lumpier.
    expect(max - min).toBeLessThan(0.5);
  });

  it('gives nothing for a degenerate input', () => {
    expect(resample([], 10)).toEqual([]);
    expect(resample(regularPolygon(4, 10), 2)).toEqual([]);
  });
});

describe('morph', () => {
  const a = resample(regularPolygon(4, 10), 24);
  const b = resample(regularPolygon(3, 10), 24);

  it('returns the start at 0 and the end at 1', () => {
    expect(morph(a, b, 0)).toEqual(a);
    expect(morph(a, b, 1)).toEqual(b);
  });

  it('lands halfway in between at 0.5', () => {
    const mid = morph(a, b, 0.5);
    mid.forEach((p, i) => {
      expect(p.x).toBeCloseTo((a[i]!.x + b[i]!.x) / 2, 5);
      expect(p.y).toBeCloseTo((a[i]!.y + b[i]!.y) / 2, 5);
    });
  });

  it('clamps outside the range rather than overshooting', () => {
    expect(morph(a, b, -1)).toEqual(a);
    expect(morph(a, b, 5)).toEqual(b);
  });

  it('refuses two shapes it cannot pair up, rather than dropping points', () => {
    expect(() => morph(a, b.slice(1), 0.5)).toThrow(/same length/);
  });
});

describe('roundedPath', () => {
  const centre = { x: 24, y: 24 };

  it('closes the path', () => {
    expect(roundedPath(regularPolygon(5, 10), 0.3, centre)).toMatch(/Z$/);
  });

  it('uses straight lines with no rounding and curves with it', () => {
    const square = regularPolygon(4, 10);
    expect(roundedPath(square, 0, centre)).not.toContain('Q');
    expect(roundedPath(square, 0.3, centre)).toContain('Q');
  });

  it('bends one curve per corner', () => {
    const path = roundedPath(regularPolygon(6, 10), 0.3, centre);
    expect(path.match(/Q/g)).toHaveLength(6);
  });

  it('offsets by the centre, so the shape sits in the viewBox', () => {
    const path = roundedPath(regularPolygon(4, 10), 0, centre);
    const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
    // Centred on 24 with a radius of 10, nothing should be negative or past 34.
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(14);
    expect(Math.max(...numbers)).toBeLessThanOrEqual(34);
  });

  it('caps the rounding so a corner cannot eat past the midpoint of its edge', () => {
    // 0.9 would invert the corner; it is clamped to 0.5.
    expect(roundedPath(regularPolygon(4, 10), 0.9, centre)).toBe(
      roundedPath(regularPolygon(4, 10), 0.5, centre),
    );
  });

  it('gives nothing for fewer than three points', () => {
    expect(
      roundedPath(
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        0.3,
        centre,
      ),
    ).toBe('');
  });
});
