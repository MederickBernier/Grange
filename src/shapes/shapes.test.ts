import { describe, expect, it } from 'vitest';
import { bounds, type Point } from './geometry';
import { circle, normalized, rectangle, regularPolygon, roundedPolygon, star } from './polygon';
import { buildShape, shape, shapeDescriptors, shapeNames, type ShapeName } from './library';
import type { ShapeDescriptor } from './descriptor';
import { flatten, pointOn, polylinePath, shapePath } from './path';

const centre: Point = { x: 0.5, y: 0.5 };
const radiiFrom = (points: readonly Point[], from: Point) =>
  points.map((p) => Math.hypot(p.x - from.x, p.y - from.y));

/** A point reflected in the line through `about` at `angle` radians. */
function reflect(point: Point, about: Point, angle: number): Point {
  const x = point.x - about.x;
  const y = point.y - about.y;
  const cos = Math.cos(2 * angle);
  const sin = Math.sin(2 * angle);
  return { x: about.x + x * cos + y * sin, y: about.y + x * sin - y * cos };
}

/** Every curve has to start exactly where the one before it ended, or the fill shows a seam. */
function isContiguous(cubics: ReturnType<typeof shape>['cubics'], tolerance = 1e-6) {
  return cubics.every((c, i) => {
    const next = cubics[(i + 1) % cubics.length]!;
    return (
      Math.abs(c.anchor1.x - next.anchor0.x) < tolerance && Math.abs(c.anchor1.y - next.anchor0.y) < tolerance
    );
  });
}

describe('the captured library', () => {
  it('has all 35 of the shapes Google publishes', () => {
    expect(shapeNames).toHaveLength(35);
    // A few by name, including one of each kind the capture distinguishes.
    expect(shapeNames).toContain('Circle');
    expect(shapeNames).toContain('Heart');
    expect(shapeNames).toContain('PixelTriangle');
    expect(shapeNames).toContain('Cookie12Sided');
  });

  it('keeps the descriptors the source gives, rather than numbers typed in here', () => {
    // Straight out of MaterialShapes.kt: a 10-vertex circle and a 0.3-rounded unit square.
    expect(shapeDescriptors.Circle).toEqual({ kind: 'circle', numVertices: 10 });
    expect(shapeDescriptors.Square).toEqual({
      kind: 'rectangle',
      width: 1,
      height: 1,
      rounding: { radius: 0.3 },
    });
    // The arch is a square with two corners fully rounded, turned to stand on its flat side.
    expect(shapeDescriptors.Arch).toEqual({
      kind: 'regular',
      numVertices: 4,
      perVertexRounding: [{ radius: 1 }, { radius: 1 }, { radius: 0.2 }, { radius: 0.2 }],
      transforms: [{ rotate: -135 }],
    });
    expect(shapeDescriptors.Sunny).toEqual({
      kind: 'star',
      numVerticesPerRadius: 8,
      innerRadius: 0.8,
      rounding: { radius: 0.15 },
    });
  });

  it('builds every one into a closed, contiguous outline', () => {
    for (const name of shapeNames) {
      const built = shape(name);
      expect(built.cubics.length, name).toBeGreaterThan(2);
      expect(isContiguous(built.cubics), name).toBe(true);
      for (const c of built.cubics) {
        for (const p of [c.anchor0, c.control0, c.control1, c.anchor1]) {
          expect(Number.isFinite(p.x) && Number.isFinite(p.y), name).toBe(true);
        }
      }
    }
  });

  it('normalises every one into the unit square, touching both edges of its long axis', () => {
    for (const name of shapeNames) {
      const box = bounds(shape(name).cubics);
      expect(box.left, name).toBeGreaterThanOrEqual(-1e-6);
      expect(box.top, name).toBeGreaterThanOrEqual(-1e-6);
      expect(box.right, name).toBeLessThanOrEqual(1 + 1e-6);
      expect(box.bottom, name).toBeLessThanOrEqual(1 + 1e-6);
      // The longer axis fills the box exactly; the shorter one is centred in what is left.
      const width = box.right - box.left;
      const height = box.bottom - box.top;
      expect(Math.max(width, height), name).toBeCloseTo(1, 5);
    }
  });

  it('caches, so a shape is built once', () => {
    expect(shape('Heart')).toBe(shape('Heart'));
    // buildShape is the uncached door, for a descriptor of one's own.
    expect(buildShape(shapeDescriptors.Heart)).not.toBe(shape('Heart'));
  });
});

describe('shapes that can be checked against what they are meant to be', () => {
  it('draws a circle at an even distance from the middle', () => {
    const radii = radiiFrom(
      shape('Circle').cubics.map((c) => c.anchor0),
      centre,
    );
    const min = Math.min(...radii);
    const max = Math.max(...radii);
    expect(max - min).toBeLessThan(1e-6);
    // Just under a half, because normalisation uses the bounds of the control points too, which
    // sit outside the curve. Upstream normalises the same way, so the shapes agree.
    expect(max).toBeCloseTo(0.492, 2);
  });

  it('draws a square with four straight sides and four equal corners', () => {
    const box = bounds(shape('Square').cubics);
    expect([box.left, box.top, box.right, box.bottom]).toEqual([0, 0, 1, 1]);
    // Points on the edge midway along each side, which a rounded square still has.
    const sampled = flatten(shape('Square'), 8);
    expect(sampled.some((p) => Math.abs(p.x) < 1e-6 && Math.abs(p.y - 0.5) < 0.05)).toBe(true);
    expect(sampled.some((p) => Math.abs(p.y) < 1e-6 && Math.abs(p.x - 0.5) < 0.05)).toBe(true);
    // The corners are cut, so no sample sits in the very corner of the box.
    expect(sampled.some((p) => p.x < 0.05 && p.y < 0.05)).toBe(false);
  });

  it('draws every mirrored shape symmetrically about its own axis', () => {
    /*
     * A mirrored shape is one section of the outline plus its reflection, so it has to come back
     * as its own mirror image. The axis is not always vertical: the reflection in the source is
     * taken about the line through the section's first point, so the pill's axis is the diagonal
     * and the heart's is the vertical. Normalisation scales both axes by the same number, so the
     * angle survives it and the moved centre is on the polygon.
     */
    // Read through the wider type: the generated module is `as const`, so each shape's literal
    // type only has the keys that shape happens to use.
    const descriptorFor = (name: ShapeName): ShapeDescriptor => shapeDescriptors[name];
    const mirrored = shapeNames.filter((name) => {
      const descriptor = descriptorFor(name);
      return descriptor.kind === 'custom' && descriptor.mirroring;
    });
    expect(mirrored.length).toBeGreaterThan(5);

    for (const name of mirrored) {
      const descriptor = descriptorFor(name);
      if (descriptor.kind !== 'custom') throw new Error('filtered above');
      // A rotation afterwards turns the axis with it, which this does not account for.
      if (descriptor.transforms?.some((transform) => 'rotate' in transform)) continue;

      const first = descriptor.points[0]!;
      const axis = Math.atan2(first.y - descriptor.center[1], first.x - descriptor.center[0]);
      const built = shape(name);
      const sampled = flatten(built, 16);

      for (const point of sampled) {
        const reflected = reflect(point, built.centre, axis);
        const matched = sampled.some(
          (other) => Math.hypot(other.x - reflected.x, other.y - reflected.y) < 0.02,
        );
        expect(matched, `${name} at ${point.x.toFixed(3)},${point.y.toFixed(3)}`).toBe(true);
      }
    }
  });

  it('gives a star alternating radii, which is what makes a cookie', () => {
    const sunny = shape('Sunny');
    const radii = radiiFrom(flatten(sunny, 4), centre);
    const min = Math.min(...radii);
    const max = Math.max(...radii);
    // The descriptor's inner radius is 0.8 of the outer one, and rounding pulls both in a little.
    expect(min / max).toBeGreaterThan(0.7);
    expect(min / max).toBeLessThan(0.95);
  });

  it('gives the pixel shapes square corners, since they are drawn as steps', () => {
    // Every point of PixelCircle has a neighbour straight across from it or straight below it.
    const sampled = flatten(shape('PixelCircle'), 2);
    const axisAligned = sampled.filter((p, i) => {
      const next = sampled[(i + 1) % sampled.length]!;
      return Math.abs(p.x - next.x) < 1e-6 || Math.abs(p.y - next.y) < 1e-6;
    });
    expect(axisAligned.length / sampled.length).toBeGreaterThan(0.9);
  });
});

describe('the polygon port', () => {
  it('spends a curve per corner on rounding, and three once there is smoothing to draw', () => {
    const sharp = regularPolygon(4);
    const rounded = regularPolygon(4, { rounding: { radius: 0.3 } });
    const smoothed = regularPolygon(4, { rounding: { radius: 0.3, smoothing: 1 } });

    // A sharp square is its four sides: the corner cubics are zero-length and are dropped.
    expect(sharp.cubics).toHaveLength(4);
    // Rounded without smoothing is an arc per corner plus the four sides. The run-in and run-out
    // curves are still zero-length there, because there is no smoothing for them to describe.
    expect(rounded.cubics).toHaveLength(8);
    // With smoothing they have length, so each corner is three curves.
    expect(smoothed.cubics).toHaveLength(12);
  });

  it('shares a side out when two corners both want more of it than there is', () => {
    // A very flat triangle: the two ends of the short side cannot both have a radius of 1.
    const squeezed = roundedPolygon(
      [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0.1 },
      ],
      { rounding: { radius: 1 } },
    );
    expect(isContiguous(squeezed.cubics, 1e-4)).toBe(true);
    for (const c of squeezed.cubics) expect(Number.isFinite(c.control0.x)).toBe(true);
  });

  it('refuses a polygon that is not one', () => {
    expect(() =>
      roundedPolygon([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    ).toThrow(/three vertices/);
    expect(() =>
      roundedPolygon(
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
        { perVertexRounding: [{ radius: 0 }] },
      ),
    ).toThrow(/one entry per vertex/);
  });

  it('smoothing cuts further back along each side than rounding alone', () => {
    const plain = regularPolygon(4, { rounding: { radius: 0.3 } });
    const smooth = regularPolygon(4, { rounding: { radius: 0.3, smoothing: 1 } });
    // Both still reach the same distance at the corner, since the radius has not changed...
    const far = (p: typeof plain) => Math.max(...radiiFrom(flatten(p, 16), { x: 0, y: 0 }));
    expect(far(smooth)).toBeCloseTo(far(plain), 2);
    // ...but the straight part of each side is shorter, because the curve starts sooner.
    const straightRun = (p: typeof plain) =>
      Math.max(...p.cubics.map((c) => Math.hypot(c.anchor1.x - c.anchor0.x, c.anchor1.y - c.anchor0.y)));
    expect(straightRun(smooth)).toBeLessThan(straightRun(plain));
  });

  it('builds a rectangle around its centre at the size asked for', () => {
    const box = bounds(rectangle(4, 2).cubics);
    expect([box.left, box.top, box.right, box.bottom]).toEqual([-2, -1, 2, 1]);
  });

  it('builds a circle larger than the polygon under it, so the arc passes through the radius', () => {
    // The vertices sit outside the circle; the arcs through the middle of each side are on it.
    const c = circle(8, 1);
    const vertexRadii = radiiFrom(
      c.cubics.map((k) => k.anchor0),
      { x: 0, y: 0 },
    );
    expect(Math.max(...vertexRadii)).toBeGreaterThan(0.99);
    expect(Math.max(...vertexRadii)).toBeLessThan(1 / Math.cos(Math.PI / 8) + 1e-6);
  });

  it('gives a star twice the vertices it is asked for, one pair per radius', () => {
    const points = star(5, { innerRadius: 0.4 }).cubics.map((c) => c.anchor0);
    expect(points).toHaveLength(10);
    const radii = radiiFrom(points, { x: 0, y: 0 }).map((r) => Math.round(r * 100) / 100);
    expect(new Set(radii)).toEqual(new Set([1, 0.4]));
  });

  it('normalising an already normalised shape changes nothing', () => {
    const once = normalized(regularPolygon(5, { rounding: { radius: 0.2 } }));
    const twice = normalized(once);
    const a = bounds(once.cubics);
    const b = bounds(twice.cubics);
    for (const edge of ['left', 'top', 'right', 'bottom'] as const) {
      expect(b[edge]).toBeCloseTo(a[edge], 9);
    }
  });
});

describe('paths', () => {
  it('writes one move, a curve per segment and a close', () => {
    const d = shapePath(shape('Square'), { size: 48 });
    expect(d.startsWith('M ')).toBe(true);
    expect(d.endsWith(' Z')).toBe(true);
    expect(d.match(/C /g)).toHaveLength(shape('Square').cubics.length);
  });

  it('scales and offsets into the box it is given', () => {
    const numbers = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const unit = numbers(shapePath(shape('Square')));
    expect(Math.max(...unit)).toBeLessThanOrEqual(1);

    const big = numbers(shapePath(shape('Square'), { size: 100, offsetX: 10, offsetY: 10 }));
    expect(Math.min(...big)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...big)).toBeLessThanOrEqual(110);
  });

  it('has nothing to draw for an empty outline', () => {
    expect(shapePath({ cubics: [], centre: { x: 0, y: 0 } })).toBe('');
    expect(
      polylinePath([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    ).toBe('');
  });

  it('walks a cubic from one anchor to the other', () => {
    const [first] = shape('Circle').cubics;
    expect(pointOn(first!, 0)).toEqual(first!.anchor0);
    expect(pointOn(first!, 1)).toEqual(first!.anchor1);
    const middle = pointOn(first!, 0.5);
    expect(Math.hypot(middle.x - centre.x, middle.y - centre.y)).toBeCloseTo(0.492, 2);
  });

  it('flattens an outline into as many points as it was asked for', () => {
    const built = shape('Pentagon');
    expect(flatten(built, 4)).toHaveLength(built.cubics.length * 4);
  });
});
