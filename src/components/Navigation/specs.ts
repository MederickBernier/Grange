/**
 * From Compose NavigationBarTokens, NavigationBarVerticalItemTokens,
 * NavigationBarHorizontalItemTokens, NavigationRailCollapsedTokens,
 * NavigationRailExpandedTokens, NavigationRailColorTokens and the rail item tokens.
 *
 * The bar and the rail colour their items identically, which is why one item implementation
 * serves both.
 */

/** Icon above the label, or beside it. M3 Expressive added the horizontal arrangement. */
export type NavigationArrangement = 'vertical' | 'horizontal';

export const navigationBar = {
  height: 64,
  /** The taller bar, for a label that needs the room, px. */
  tallHeight: 80,
  /** Space between items, px. Zero: they divide the width between them. */
  betweenSpace: 0,
} as const;

export const navigationRail = {
  /** Collapsed width, px, and the narrow option. */
  width: 96,
  narrowWidth: 80,
  /** Expanded width is a range the app picks within, px. */
  expandedMinWidth: 220,
  expandedMaxWidth: 360,
  /** Space above the first item, px. Leaves room for a header. */
  topSpace: 44,
  /** Space between items, px. */
  itemVerticalSpace: 4,
} as const;

export const navigationItem = {
  icon: 24,
  /** The active indicator pill for a stacked item, px. */
  verticalIndicatorWidth: 56,
  verticalIndicatorHeight: 32,
  /** And for an inline one, which spans the label and is shorter, px. */
  horizontalIndicatorHeight: 40,
  horizontalIndicatorPadding: 16,
  /** Space between the icon and the label, px. */
  iconLabelSpace: 4,
  /** Leading and trailing space for a rail item, px. */
  railSpace: 16,
} as const;
