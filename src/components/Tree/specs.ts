/**
 * Tree. No `TreeTokens` or `TreeViewTokens` in androidx — Material has no tree — so the row is
 * a list row, captured: `ListTokens` gives the height, the gutters, the icon size and the
 * label font. Only the indent per level is chosen.
 */
import { list } from '../List/specs';

export const tree = {
  /** A row, px. ListTokens: a one-line item. */
  rowHeight: list.oneLine,
  /** Gutters, px. ItemLeadingSpace / ItemTrailingSpace. */
  gutter: list.leadingSpace,
  /** The expand chevron and the leading icon, px. ItemLeadingIconSize. */
  icon: list.leadingIcon,
  /** Space between a row's slots, px. ItemBetweenSpace. */
  betweenSpace: list.betweenSpace,
  /**
   * How far each level is indented, px. Chosen: the chevron plus the between-space, so a child's
   * label starts exactly where its parent's label does.
   */
  indent: list.leadingIcon + list.betweenSpace,
} as const;
