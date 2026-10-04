/**
 * The arithmetic behind `Sortable`, kept pure so the cases that actually bite can be tested
 * without a drag: dropping a run of items onto a gap inside that same run, dropping after the
 * last item, and the indices shifting as soon as the first item is removed.
 */

export type DropPosition = 'before' | 'after';

/**
 * Moves `moving` so it sits before or after `target`, keeping the moved items in their own
 * relative order.
 *
 * The removal happens first and the insertion point is found afterwards, in the already
 * shortened list. Computing the index up front and splicing into it is the classic bug here:
 * every item after the one that was removed has shifted by then, so a drag downwards lands one
 * place short.
 *
 * Dropping onto one of the moved items is a no-op rather than an error. It is what happens when
 * a run of selected items is dropped into a gap inside itself, which a pointer does easily.
 */
export function reorder(
  ids: readonly string[],
  moving: Iterable<string>,
  target: string,
  position: DropPosition,
): string[] {
  const movingSet = new Set([...moving].filter((id) => ids.includes(id)));
  if (movingSet.size === 0 || movingSet.has(target)) return [...ids];

  const kept = ids.filter((id) => !movingSet.has(id));
  const moved = ids.filter((id) => movingSet.has(id));

  const at = kept.indexOf(target);
  if (at === -1) return [...ids];

  const index = position === 'before' ? at : at + 1;
  return [...kept.slice(0, index), ...moved, ...kept.slice(index)];
}

/** Moves `moving` to the very end, which is what a drop below the last item means. */
export function moveToEnd(ids: readonly string[], moving: Iterable<string>): string[] {
  const movingSet = new Set([...moving].filter((id) => ids.includes(id)));
  if (movingSet.size === 0) return [...ids];
  return [...ids.filter((id) => !movingSet.has(id)), ...ids.filter((id) => movingSet.has(id))];
}
