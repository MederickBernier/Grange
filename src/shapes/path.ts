/** Outlines as SVG path data. */
import type { RoundedPolygon } from './polygon';
import type { Cubic, Point } from './geometry';

const round = (n: number) => Math.round(n * 1000) / 1000;

export interface PathOptions {
  /** The box to draw into, in user units. A normalised shape fills it exactly. */
  size?: number;
  /** Moves the whole path, for drawing a shape inside something larger. */
  offsetX?: number;
  offsetY?: number;
}

/**
 * An SVG `d` string for an outline.
 *
 * Every segment is a cubic, including the straight runs along the sides, so the path is one `M`
 * followed by a `C` per segment. That is more verbose than mixing in `L` commands and is exactly
 * what the geometry produces, which makes it easy to check a path against the curves it came from.
 */
export function shapePath(polygon: RoundedPolygon, options: PathOptions = {}): string {
  const { size = 1, offsetX = 0, offsetY = 0 } = options;
  if (polygon.cubics.length === 0) return '';

  const x = (value: number) => round(offsetX + value * size);
  const y = (value: number) => round(offsetY + value * size);
  const curve = (c: Cubic) =>
    `C ${x(c.control0.x)} ${y(c.control0.y)} ${x(c.control1.x)} ${y(c.control1.y)} ${x(c.anchor1.x)} ${y(c.anchor1.y)}`;

  const first = polygon.cubics[0]!;
  return [`M ${x(first.anchor0.x)} ${y(first.anchor0.y)}`, ...polygon.cubics.map(curve), 'Z'].join(' ');
}

/**
 * Flattens an outline into a dense polyline.
 *
 * Each cubic is subdivided evenly in `t`, which is not even in arc length, so the points bunch
 * up where a curve is tight. Resampling afterwards fixes that; this only has to be dense enough
 * that the chords are short compared with the curvature.
 */
export function flatten(polygon: RoundedPolygon, perCubic = 16): Point[] {
  const points: Point[] = [];
  for (const c of polygon.cubics) {
    for (let i = 0; i < perCubic; i += 1) {
      points.push(pointOn(c, i / perCubic));
    }
  }
  return points;
}

/** A point along a cubic. */
export function pointOn(c: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c.anchor0.x + b * c.control0.x + d * c.control1.x + e * c.anchor1.x,
    y: a * c.anchor0.y + b * c.control0.y + d * c.control1.y + e * c.anchor1.y,
  };
}

/**
 * A closed path straight through a list of points.
 *
 * For a shape that has already been flattened and interpolated there is nothing left to curve:
 * the samples carry the curvature, and joining them with lines is what keeps two different
 * outlines interpolable in the first place.
 */
export function polylinePath(points: readonly Point[]): string {
  if (points.length < 3) return '';
  const [first, ...rest] = points;
  return `M ${round(first!.x)} ${round(first!.y)} ${rest
    .map((p) => `L ${round(p.x)} ${round(p.y)}`)
    .join(' ')} Z`;
}
