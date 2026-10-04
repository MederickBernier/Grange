/**
 * The arithmetic behind `TileLayout`, kept pure for the reason `Splitter`'s is: jsdom reports
 * every element as 0 by 0, so a rendered grid can never be measured there and the reordering
 * and clamping would otherwise go untested.
 */

export interface TileSpec {
  /** Identifies the tile. Its position in the array is its position in the grid. */
  id: string;
  /** How many columns it covers. */
  colSpan: number;
  /** How many rows it covers. */
  rowSpan: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Moves the tile at `from` to `to`, sliding everything between them along.
 *
 * A move, not a swap. Swapping is easier and wrong: dragging a tile three places to the right
 * would leave the tile that was there stranded where the dragged one started, which is not what
 * anyone means by moving a tile.
 */
export function moveTile(tiles: readonly TileSpec[], from: number, to: number): TileSpec[] {
  const next = [...tiles];
  if (from < 0 || from >= next.length) return next;
  const target = clamp(to, 0, next.length - 1);
  if (target === from) return next;
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved!);
  return next;
}

/**
 * Changes a tile's span by whole tracks.
 *
 * Clamped to the grid: a tile may not be narrower than one column or wider than the grid, and
 * a tile wider than the grid would silently overflow its own row rather than wrap.
 */
export function resizeTile(
  tiles: readonly TileSpec[],
  id: string,
  deltaCols: number,
  deltaRows: number,
  columns: number,
): TileSpec[] {
  return tiles.map((tile) =>
    tile.id === id
      ? {
          ...tile,
          colSpan: clamp(tile.colSpan + deltaCols, 1, Math.max(1, columns)),
          rowSpan: Math.max(1, tile.rowSpan + deltaRows),
        }
      : tile,
  );
}

/**
 * Keeps a layout valid against the tiles that actually exist.
 *
 * Tiles that have gone are dropped and tiles that have appeared are added at the end, which is
 * what makes a controlled layout survive its children changing. Order is otherwise untouched:
 * a saved dashboard that gains one tile should not rearrange itself.
 */
export function reconcile(saved: readonly TileSpec[], current: readonly TileSpec[]): TileSpec[] {
  const byId = new Map(current.map((tile) => [tile.id, tile]));
  const kept = saved.filter((tile) => byId.has(tile.id));
  const known = new Set(kept.map((tile) => tile.id));
  return [...kept, ...current.filter((tile) => !known.has(tile.id))];
}

/**
 * Which tile a point is over, by index, or -1.
 *
 * Takes the rectangles rather than reading the DOM, so the hit test is arithmetic and can be
 * tested as arithmetic.
 */
export function tileAt(rects: readonly DOMRectLike[], x: number, y: number): number {
  return rects.findIndex((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
}

export interface DOMRectLike {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
