/**
 * The arithmetic behind `Splitter`, kept pure so it can be tested as arithmetic.
 *
 * It has to be separate, and that is not a style preference: jsdom reports every element as
 * 0 by 0, so a splitter's clamping can never be exercised through a rendered component there.
 * The same reasoning put the signature pad's geometry, the clock dial's and the date helpers in
 * their own modules.
 */

export interface PaneLimits {
  /** The smallest this pane may become, as a percentage of the container. */
  min: number;
  /** The largest, as a percentage. `Infinity` for no limit. */
  max: number;
}

/**
 * Moves the boundary after pane `index` by `delta` percentage points, taking the space from one
 * neighbour and giving it to the other.
 *
 * Only the two panes either side change, which is what makes a drag feel like moving one line
 * rather than redistributing the whole row. The move is clamped against both of them at once:
 * it is only as large as the tighter of the two allows, or satisfying one pane's minimum would
 * push the other under its own.
 *
 * Returns the same array when nothing can move, so a caller can skip a state update.
 */
export function moveBoundary(
  sizes: readonly number[],
  index: number,
  delta: number,
  limits: (i: number) => PaneLimits,
): number[] {
  const before = sizes[index];
  const after = sizes[index + 1];
  if (before == null || after == null || !Number.isFinite(delta)) return [...sizes];

  const a = limits(index);
  const b = limits(index + 1);

  let moved = Math.min(delta, a.max - before, after - b.min);
  moved = Math.max(moved, a.min - before, after - b.max);
  // Both neighbours pinned: the boundary has nowhere to go, and the clamps above can cross.
  if (!Number.isFinite(moved) || Number.isNaN(moved)) return [...sizes];

  const next = [...sizes];
  next[index] = before + moved;
  next[index + 1] = after - moved;
  return next;
}
