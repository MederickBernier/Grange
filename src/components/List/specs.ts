/**
 * From Compose ListTokens.
 *
 * A list row is content, not a control, so `List` renders semantic markup rather than a listbox.
 * Selection in M3 is a checkbox or a radio in one of the row's slots, which composition already
 * covers; a listbox role belongs to `Select` and an action menu to `Menu`.
 */
export const list = {
  /** Row heights by how many lines of text the row carries, px. */
  oneLine: 56,
  twoLine: 72,
  threeLine: 88,
  /** Leading and trailing space inside a row, px. */
  leadingSpace: 16,
  trailingSpace: 16,
  /** Space between a row's slots and its text, px. */
  betweenSpace: 12,
  /** Vertical space above and below the text of a taller row, px. */
  topSpace: 10,
  bottomSpace: 10,
  leadingIcon: 24,
  /** A leading avatar is larger than an icon and always round. */
  avatar: 40,
  /** Corner radius of the list container, px. CornerLarge. */
  containerCorner: 16,
} as const;

/** How tall a row needs to be for the text it carries. */
export function rowHeight(lines: 1 | 2 | 3): number {
  if (lines === 3) return list.threeLine;
  if (lines === 2) return list.twoLine;
  return list.oneLine;
}
