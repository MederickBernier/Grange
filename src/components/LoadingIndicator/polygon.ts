/**
 * Rounded regular polygons, and morphing between them.
 *
 * M3 Expressive's loading indicator cycles through shapes from a library of 35. Those are
 * `RoundedPolygon`s in `androidx.graphics.shapes`, defined by vertex lists with per-corner
 * rounding and smoothing; reproducing all of them faithfully means porting that library, which
 * is a library rather than a component.
 *
 * What is here is the same mechanism for the shapes that can be derived exactly: regular
 * polygons with uniform corner rounding. A circle is one with enough sides, and morphing is the
 * linear interpolation of corresponding vertices, which is what `Morph` does for two polygons of
 * equal vertex count. The irregular shapes in the library, the slanted and fan and clam shell
 * ones, need the real polygon library and the roadmap says so.
 */

export interface Point {
  x: number;
  y: number;
}

/** A regular polygon, as the points of its corners. */
export function regularPolygon(sides: number, radius: number, rotation = 0): Point[] {
  if (sides < 3 || radius <= 0) return [];

  const points: Point[] = [];
  for (let i = 0; i < sides; i += 1) {
    // Starting at twelve o'clock, so a triangle points up.
    const angle = rotation + (i / sides) * Math.PI * 2 - Math.PI / 2;
    points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return points;
}

/**
 * Resamples a polygon to a given number of points, so two shapes with different corner counts
 * can still be interpolated. Points are spread evenly along the outline rather than per corner,
 * which keeps a square morphing into a triangle from collapsing a side.
 */
export function resample(points: Point[], count: number): Point[] {
  if (points.length === 0 || count < 3) return [];

  // Cumulative edge lengths around the closed outline.
  const edges: number[] = [];
  let perimeter = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    edges.push(length);
    perimeter += length;
  }
  if (perimeter === 0) return [];

  const out: Point[] = [];
  for (let i = 0; i < count; i += 1) {
    let target = (i / count) * perimeter;
    let edge = 0;
    while (edge < edges.length && target > edges[edge]!) {
      target -= edges[edge]!;
      edge += 1;
    }
    const a = points[edge % points.length]!;
    const b = points[(edge + 1) % points.length]!;
    const t = edges[edge % edges.length]! === 0 ? 0 : target / edges[edge % edges.length]!;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

/** Interpolates between two point lists of equal length. `t` runs 0 to 1. */
export function morph(from: Point[], to: Point[], t: number): Point[] {
  if (from.length !== to.length) throw new Error('morph needs two point lists of the same length');
  const clamped = Math.min(1, Math.max(0, t));
  return from.map((a, i) => {
    const b = to[i]!;
    return { x: a.x + (b.x - a.x) * clamped, y: a.y + (b.y - a.y) * clamped };
  });
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * An SVG path through the points, with the corners rounded.
 *
 * Each corner is cut back by `rounding` as a fraction of the shorter adjoining edge and bridged
 * with a quadratic through the original corner, which is what gives a squircle rather than a
 * polygon with the points filed off.
 */
export function roundedPath(points: Point[], rounding: number, center: Point): string {
  if (points.length < 3) return '';
  const r = Math.min(0.5, Math.max(0, rounding));
  if (r === 0) {
    const [first, ...rest] = points;
    return `M ${round(center.x + first!.x)} ${round(center.y + first!.y)} ${rest
      .map((p) => `L ${round(center.x + p.x)} ${round(center.y + p.y)}`)
      .join(' ')} Z`;
  }

  const segments: string[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const previous = points[(i - 1 + points.length) % points.length]!;
    const corner = points[i]!;
    const next = points[(i + 1) % points.length]!;

    const start = {
      x: center.x + corner.x + (previous.x - corner.x) * r,
      y: center.y + corner.y + (previous.y - corner.y) * r,
    };
    const end = {
      x: center.x + corner.x + (next.x - corner.x) * r,
      y: center.y + corner.y + (next.y - corner.y) * r,
    };

    segments.push(
      i === 0 ? `M ${round(start.x)} ${round(start.y)}` : `L ${round(start.x)} ${round(start.y)}`,
    );
    segments.push(
      `Q ${round(center.x + corner.x)} ${round(center.y + corner.y)} ${round(end.x)} ${round(end.y)}`,
    );
  }
  segments.push('Z');
  return segments.join(' ');
}
