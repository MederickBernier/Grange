/**
 * The set arithmetic behind `TransferList`, kept pure so the cases that actually bite — an item
 * selected on the side it is not on, a selection left pointing at items that have moved — can
 * be tested without rendering two listboxes.
 */

export interface TransferItem {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * Moves the named items from one side to the other, keeping the order of both.
 *
 * Order is kept rather than appending, because a transfer list is usually a list of options in
 * a meaningful order — days, sizes, priorities — and moving an item back should put it where it
 * belongs rather than at the end. `order` is the full set in the order they should appear.
 */
export function transfer(
  from: readonly TransferItem[],
  to: readonly TransferItem[],
  ids: Iterable<string>,
  order: readonly TransferItem[],
): { from: TransferItem[]; to: TransferItem[] } {
  const moving = new Set(ids);
  // A disabled item cannot be moved, however it came to be selected.
  const allowed = new Set(from.filter((item) => moving.has(item.id) && !item.disabled).map((i) => i.id));
  const rank = new Map(order.map((item, i) => [item.id, i]));
  const sort = (items: TransferItem[]) =>
    [...items].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

  return {
    from: from.filter((item) => !allowed.has(item.id)),
    to: sort([...to, ...from.filter((item) => allowed.has(item.id))]),
  };
}

/** Everything that can move, which is everything not disabled. */
export function movable(items: readonly TransferItem[]): string[] {
  return items.filter((item) => !item.disabled).map((item) => item.id);
}

/**
 * Drops the keys that are no longer on this side.
 *
 * After a move the selection points at items that have gone, and a listbox handed keys it does
 * not have will either ignore them silently or, worse, keep them and report them back on the
 * next change.
 */
export function keepSelected(selected: Iterable<string>, items: readonly TransferItem[]): Set<string> {
  const here = new Set(items.map((item) => item.id));
  return new Set([...selected].filter((id) => here.has(id)));
}
