/**
 * Points and cubic Bézier curves, ported from androidx.graphics.shapes (Apache 2.0, see NOTICE).
 *
 * Only the parts the shape library needs are here: there is no `Morph`, because morphing between
 * two arbitrary shapes needs the feature-matching half of that library, and the loading indicator
 * already interpolates resampled outlines instead.
 */

export interface Point {
  x: number;
  y: number;
}

/** Two points are the same within this distance. Upstream's DistanceEpsilon. */
export const DISTANCE_EPSILON = 1e-4;

export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
export const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Point, by: number): Point => ({ x: a.x * by, y: a.y * by });
export const dot = (a: Point, b: Point): number => a.x * b.x + a.y * b.y;
export const distance = (a: Point): number => Math.hypot(a.x, a.y);
/** Turned a quarter turn, which is how a tangent to a circle is found. */
export const rotate90 = (a: Point): Point => ({ x: -a.y, y: a.x });

/** The unit vector in a point's direction. Zero stays zero rather than becoming NaN. */
export function direction(a: Point): Point {
  const d = distance(a);
  return d === 0 ? { x: 0, y: 0 } : { x: a.x / d, y: a.y / d };
}

export const interpolate = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** A cubic Bézier: two anchors with a control point each. */
export interface Cubic {
  anchor0: Point;
  control0: Point;
  control1: Point;
  anchor1: Point;
}

export const cubic = (anchor0: Point, control0: Point, control1: Point, anchor1: Point): Cubic => ({
  anchor0,
  control0,
  control1,
  anchor1,
});

/** A straight run, as a cubic, so every segment of an outline has the same shape. */
export function straightLine(from: Point, to: Point): Cubic {
  return cubic(from, interpolate(from, to, 1 / 3), interpolate(from, to, 2 / 3), to);
}

export function isZeroLength(c: Cubic): boolean {
  return (
    Math.abs(c.anchor0.x - c.anchor1.x) < DISTANCE_EPSILON &&
    Math.abs(c.anchor0.y - c.anchor1.y) < DISTANCE_EPSILON
  );
}

/**
 * The cubic that approximates the arc from `from` to `to` about `centre`.
 *
 * The constant is the usual one for approximating an arc with a cubic, which is exact at the
 * endpoints and within a fraction of a percent in between for anything up to a quarter turn.
 */
export function circularArc(centre: Point, from: Point, to: Point): Cubic {
  const fromDirection = direction(subtract(from, centre));
  const toDirection = direction(subtract(to, centre));
  const fromTangent = rotate90(fromDirection);
  const toTangent = rotate90(toDirection);
  const clockwise = dot(fromTangent, subtract(to, centre)) >= 0;
  const cosine = dot(fromDirection, toDirection);
  // The two ends have met, so there is no arc left to draw.
  if (cosine > 0.999) return straightLine(from, to);

  const k =
    ((distance(subtract(from, centre)) * 4) / 3) *
    ((Math.sqrt(2 * (1 - cosine)) - Math.sqrt(1 - cosine * cosine)) / (1 - cosine)) *
    (clockwise ? 1 : -1);

  return cubic(from, add(from, scale(fromTangent, k)), subtract(to, scale(toTangent, k)), to);
}

export function transformCubic(c: Cubic, f: (p: Point) => Point): Cubic {
  return cubic(f(c.anchor0), f(c.control0), f(c.control1), f(c.anchor1));
}

/**
 * The bounding box of a list of cubics, from their anchors and controls.
 *
 * Upstream calls this the approximate bounds, and uses it for `normalized()` too: a control point
 * can sit outside the curve it shapes, so the box can be a little large. Using it keeps the
 * normalisation here identical to the normalisation there, which matters more than tightness.
 */
export function bounds(cubics: readonly Cubic[]): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const c of cubics) {
    for (const p of [c.anchor0, c.control0, c.control1, c.anchor1]) {
      left = Math.min(left, p.x);
      top = Math.min(top, p.y);
      right = Math.max(right, p.x);
      bottom = Math.max(bottom, p.y);
    }
  }
  return { left, top, right, bottom };
}
