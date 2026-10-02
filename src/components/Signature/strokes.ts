/**
 * The geometry behind `Signature`, kept pure so it can be tested as arithmetic rather than
 * through a canvas.
 *
 * It is SVG rather than a `<canvas>` on purpose. A canvas signature is a bitmap: it blurs when
 * the box is resized, it cannot be tested without a canvas implementation, and undo means
 * replaying every stroke into a fresh context. The same strokes as SVG paths stay crisp at any
 * size, export as text, and undo is dropping the last array.
 */

export interface Point {
  x: number;
  y: number;
}

/** One continuous mark: everything between a pointer going down and coming up. */
export type Stroke = Point[];

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * An SVG path for one stroke.
 *
 * Straight lines between the sampled points would show every one of them as a corner, and a
 * pointer samples coarsely enough that a signature would look like a seismograph. So each
 * segment is a quadratic curve through the midpoint between two samples, with the sample itself
 * as the control point: the curve passes smoothly and the corners disappear.
 *
 * A stroke of one point is a dot — someone tapped — and is drawn as a tiny closed curve, because
 * an SVG path with no length renders nothing at all.
 */
export function strokePath(stroke: Stroke): string {
  if (stroke.length === 0) return '';

  const [first] = stroke;
  if (stroke.length === 1) {
    const { x, y } = first!;
    // A circle, as two arcs, since a zero-length line is invisible however it is capped.
    return `M ${round(x - 0.01)} ${round(y)} a 0.01 0.01 0 1 1 0.02 0 a 0.01 0.01 0 1 1 -0.02 0`;
  }

  const parts = [`M ${round(first!.x)} ${round(first!.y)}`];
  for (let i = 1; i < stroke.length - 1; i += 1) {
    const point = stroke[i]!;
    const next = stroke[i + 1]!;
    const midX = (point.x + next.x) / 2;
    const midY = (point.y + next.y) / 2;
    parts.push(`Q ${round(point.x)} ${round(point.y)} ${round(midX)} ${round(midY)}`);
  }
  // The last sample is an endpoint rather than a control point, or the stroke stops short of it.
  const last = stroke[stroke.length - 1]!;
  parts.push(`L ${round(last.x)} ${round(last.y)}`);
  return parts.join(' ');
}

/**
 * Drops samples that are too close together to matter.
 *
 * A pointer can report every pixel, which is far more detail than a signature needs and makes
 * the exported path pointlessly large. Anything within `tolerance` of the last kept sample is
 * discarded, except the final one, which is always kept so the stroke ends where the pointer did.
 */
export function thin(stroke: Stroke, tolerance = 1.5): Stroke {
  if (stroke.length < 3) return [...stroke];
  const kept: Stroke = [stroke[0]!];
  for (let i = 1; i < stroke.length - 1; i += 1) {
    const point = stroke[i]!;
    const last = kept[kept.length - 1]!;
    if (Math.hypot(point.x - last.x, point.y - last.y) >= tolerance) kept.push(point);
  }
  kept.push(stroke[stroke.length - 1]!);
  return kept;
}

/** The box the strokes actually occupy, which is what says whether anything was drawn. */
export function strokeBounds(strokes: Stroke[]): { x: number; y: number; width: number; height: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const { x, y } of stroke) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export interface SvgOptions {
  width: number;
  height: number;
  strokeWidth: number;
  /** Any CSS colour. `currentColor` is no use in a standalone file, so it is resolved by the caller. */
  color: string;
}

/**
 * A standalone SVG document for the strokes, which is what the component reports as its value.
 *
 * Text rather than a data URL: it is readable, it diffs, it can be dropped straight into a page,
 * and a caller that wants a data URL can encode it. Empty strokes give null rather than an empty
 * document, so "has anything been signed" is a single check.
 */
export function strokesToSvg(strokes: Stroke[], options: SvgOptions): string | null {
  const drawn = strokes.filter((stroke) => stroke.length > 0);
  if (drawn.length === 0) return null;

  const paths = drawn
    .map((stroke) => `<path d="${strokePath(stroke)}"/>`)
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${options.width} ${options.height}" ` +
    `width="${options.width}" height="${options.height}">` +
    `<g fill="none" stroke="${options.color}" stroke-width="${options.strokeWidth}" ` +
    `stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`
  );
}
