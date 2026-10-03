/**
 * Breadcrumbs.
 *
 * Material has no breadcrumb, and androidx has no `BreadcrumbTokens`, so every value here is
 * chosen. They are chosen to be a list row's horizontal metrics turned sideways — the 12px
 * between-space and the 24px icon of `ListTokens` — so a trail sits at the same rhythm as the
 * rest of the library rather than at its own.
 */
import { list } from '../List/specs';

export const breadcrumbs = {
  /** Space either side of a separator, px. Chosen: half of ListTokens' ItemBetweenSpace. */
  gap: list.betweenSpace / 2,
  /** The separator and the collapse button's glyph, px. Chosen: ItemLeadingIconSize. */
  separator: list.leadingIcon,
  /**
   * How many crumbs are shown before the middle is collapsed into a menu. Chosen: the first, the
   * last two, and the menu — below five there is nothing to gain by hiding any.
   */
  maxVisible: 5,
} as const;
