/**
 * The geometry behind the gauges, kept pure so the angles can be tested as arithmetic.
 *
 * SVG's coordinate system has y increasing downwards and angles measured from the positive x
 * axis, which is three o'clock. A gauge is read from twelve, so every angle here is measured
 * clockwise **from twelve o'clock** and converted on the way out. Doing that conversion at
 * every call site is where these components usually go wrong, by a quarter turn.
 */

export interface Point {
  x: number;
  y: number;
}

/** A point on a circle, with the angle measured clockwise from twelve o'clock, in degrees. */
export function pointOn(centre: Point, radius: number, degrees: number): Point {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: round(centre.x + radius * Math.cos(radians)),
    y: round(centre.y + radius * Math.sin(radians)),
  };
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Where a value sits on a scale, as a fraction from 0 to 1.
 *
 * Clamped, because a gauge given a value outside its range should pin at the end rather than
 * draw an arc that leaves the circle. A zero-width range is 0 rather than a division by zero.
 */
export function fraction(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * The arc from one angle to another, as an SVG path.
 *
 * The large-arc flag is the detail that bites: an arc of more than half a circle needs it set,
 * and without it anything past 180° is drawn as its own mirror image — a gauge that reads
 * correctly up to half and then collapses inwards.
 */
export function arcPath(centre: Point, radius: number, from: number, to: number): string {
  const sweep = to - from;
  if (Math.abs(sweep) < 0.01) return '';

  // A full circle cannot be one arc: start and end would be the same point and nothing draws.
  if (Math.abs(sweep) >= 360) {
    const half = radius * 2;
    return [
      `M ${round(centre.x)} ${round(centre.y - radius)}`,
      `a ${radius} ${radius} 0 1 1 0 ${half}`,
      `a ${radius} ${radius} 0 1 1 0 ${-half}`,
    ].join(' ');
  }

  const start = pointOn(centre, radius, from);
  const end = pointOn(centre, radius, to);
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
  const clockwise = sweep > 0 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${clockwise} ${end.x} ${end.y}`;
}

/**
 * The angles of the tick marks on a scale, including both ends.
 *
 * `count` is the number of intervals, so 4 gives 5 ticks: a scale with four divisions has a
 * mark at each end as well as between them, which is what anyone counting them expects.
 */
export function tickAngles(from: number, to: number, count: number): number[] {
  const steps = Math.max(1, Math.trunc(count));
  const sweep = to - from;
  return Array.from({ length: steps + 1 }, (_, i) => round(from + (sweep * i) / steps));
}

/** The value a tick stands for, for the labels beside the marks. */
export function tickValues(min: number, max: number, count: number): number[] {
  const steps = Math.max(1, Math.trunc(count));
  return Array.from({ length: steps + 1 }, (_, i) => round(min + ((max - min) * i) / steps));
}
