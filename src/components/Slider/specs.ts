/**
 * From Compose SliderTokens, which M3 Expressive restyled completely: the track is 16px tall
 * rather than a hairline, and the handle is a 4 by 44 bar rather than a circle riding on it.
 */
export const slider = {
  trackHeight: 16,
  handleWidth: 4,
  handleHeight: 44,
  /** The handle narrows while focused or pressed, rather than growing. */
  handleWidthActive: 2,
  /** Space the track leaves either side of a handle, px. The handle sits in a gap, not on top. */
  handleGap: 6,
  stopSize: 4,
  /** Gap the value indicator leaves above the handle, px. */
  valueIndicatorGap: 12,
} as const;

/** A stretch of track between two points, in fractions of the whole. */
export interface TrackPiece {
  from: number;
  to: number;
  /** Filled pieces are the selected range; unfilled ones are the remainder. */
  active: boolean;
}

/**
 * Splits the track around the handles.
 *
 * One handle gives a filled piece up to it and an empty one after. Two give an empty piece, the
 * filled range between them, and another empty one, which is what makes a range slider read as
 * a range rather than as two separate sliders.
 */
export function trackPieces(positions: number[]): TrackPiece[] {
  const sorted = [...positions].sort((a, b) => a - b);

  if (sorted.length === 0) return [{ from: 0, to: 1, active: false }];

  if (sorted.length === 1) {
    const at = sorted[0]!;
    return [
      { from: 0, to: at, active: true },
      { from: at, to: 1, active: false },
    ];
  }

  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  return [
    { from: 0, to: first, active: false },
    { from: first, to: last, active: true },
    { from: last, to: 1, active: false },
  ];
}

/**
 * The inset a piece needs at each end so it clears any handle sitting there, in px.
 *
 * A piece that starts or ends at a handle pulls back by the gap plus half the handle, and one
 * that reaches the end of the track does not pull back at all.
 */
export function pieceInsets(
  piece: TrackPiece,
  positions: number[],
  handleWidth: number,
): { start: number; end: number } {
  const clearance = slider.handleGap + handleWidth / 2;
  const atHandle = (at: number) => positions.some((p) => Math.abs(p - at) < 1e-9);
  return {
    start: piece.from > 0 && atHandle(piece.from) ? clearance : 0,
    end: piece.to < 1 && atHandle(piece.to) ? clearance : 0,
  };
}

/** Step positions along the track, as fractions, for a discrete slider's stop indicators. */
export function stopPositions(min: number, max: number, step: number): number[] {
  if (step <= 0 || max <= min) return [];
  const span = max - min;
  const count = Math.floor(span / step);
  // Capped so a tiny step on a wide range cannot try to draw thousands of dots.
  if (count > 100) return [];

  const stops: number[] = [];
  for (let i = 0; i <= count; i += 1) stops.push((i * step) / span);
  return stops;
}
