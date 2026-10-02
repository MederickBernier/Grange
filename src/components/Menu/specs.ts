/**
 * From Compose MenuTokens for the surface, and ListTokens for the items, which is what a menu's
 * rows are. The M3 Expressive StandardMenu and VibrantMenu variants are captured but not built;
 * they restyle selection onto the tertiary container rather than the secondary one.
 */
export const menu = {
  /** Corner radius of the surface, px. CornerExtraSmall. */
  corner: 4,
  /** Elevation level, on the primitive's 0 to 5 scale. */
  elevation: 2,
  /** Vertical padding of the surface, px. Not tokenised. */
  padding: 8,
  /** Leading and trailing space inside an item, px. */
  itemPadding: 16,
  /** Space between an item's icon, label and trailing content, px. */
  itemGap: 12,
  /** Row heights by how many lines the item carries, px. */
  itemHeight: 56,
  itemHeightTwoLine: 72,
  itemIcon: 24,
  /** Not tokenised: enough that a long menu scrolls rather than running off the screen. */
  maxHeight: 320,
} as const;
