/**
 * The geometry behind `Sparkline`, kept pure.
 *
 * A sparkline is small enough that every pixel of its arithmetic shows: an off-by-one in the
 * scaling flattens a line, and a single-point series divides by zero. Both are easier to be
 * sure of as functions than by looking at a 20-pixel picture.
 */

export interface SparkPoint {
  x: number;
  y: number;
}

export interface SparkScale {
  width: number;
  height: number;
  /** The lowest value to draw at the bottom. Defaults to the series' own minimum. */
  min?: number;
  max?: number;
}

/**
 * The series scaled into the box, with y flipped because SVG's y grows downwards and a chart's
 * does not.
 *
 * A flat series — every value the same, or only one of them — is drawn along the middle rather
 * than at the top or the bottom, which is what a zero-height range would otherwise give.
 */
export function scalePoints(values: readonly number[], scale: SparkScale): SparkPoint[] {
  if (values.length === 0) return [];

  const min = scale.min ?? Math.min(...values);
  const max = scale.max ?? Math.max(...values);
  const range = max - min;
  const stepX = values.length > 1 ? scale.width / (values.length - 1) : 0;

  return values.map((value, i) => ({
    x: round(values.length > 1 ? i * stepX : scale.width / 2),
    // A flat series sits on the middle line: there is no "high" without a range.
    y: round(range === 0 ? scale.height / 2 : scale.height - ((value - min) / range) * scale.height),
  }));
}

const round = (n: number) => Math.round(n * 100) / 100;

/** The points as a polyline path. */
export function linePath(points: readonly SparkPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    // One point is a dot, drawn as a zero-length line with a round cap, since a path with no
    // length and a butt cap renders nothing at all.
    const [only] = points;
    return `M ${only!.x} ${only!.y} L ${only!.x} ${only!.y}`;
  }
  return points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

/** The same points as a filled area, closed along the bottom of the box. */
export function areaPath(points: readonly SparkPoint[], height: number): string {
  if (points.length < 2) return '';
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${linePath(points)} L ${last.x} ${height} L ${first.x} ${height} Z`;
}

/** The bars for a column sparkline: x, width, y and height per value. */
export function bars(
  values: readonly number[],
  scale: SparkScale,
  gap = 1,
): Array<{ x: number; y: number; width: number; height: number }> {
  if (values.length === 0) return [];

  const min = Math.min(scale.min ?? Math.min(...values), 0);
  const max = scale.max ?? Math.max(...values);
  const range = max - min || 1;
  const slot = scale.width / values.length;
  const width = Math.max(1, slot - gap);

  return values.map((value, i) => {
    const height = Math.max(1, round(((value - min) / range) * scale.height));
    return {
      x: round(i * slot + (slot - width) / 2),
      y: round(scale.height - height),
      width: round(width),
      height,
    };
  });
}
