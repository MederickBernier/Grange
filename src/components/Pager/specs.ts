/**
 * Pager. No `PagerTokens` or `PaginationTokens` in androidx, so the metrics are chosen — and
 * taken from the row the pager sits under: `ListTokens` gives the height and the gutters, so a
 * pager under a list lines up with it.
 */
import { list } from '../List/specs';

export const pager = {
  /** The bar, px. ListTokens: a one-line row. */
  height: list.oneLine,
  /** Gutters, px. ItemLeadingSpace. */
  gutter: list.leadingSpace,
  /** Space between the groups, px. ItemBetweenSpace. */
  betweenSpace: list.betweenSpace,
  /** How many pages either side of the current one are drawn before a gap is used. Chosen. */
  siblings: 1,
  /** The page-size choices offered when none are given. Chosen. */
  pageSizes: [10, 25, 50, 100],
} as const;
