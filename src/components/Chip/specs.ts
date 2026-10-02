/**
 * From Compose ChipsTokens for what every chip shares, and the four per-type files for what they
 * do not.
 *
 * ChipsTokens is the M3 Expressive set, and the detail worth noticing is that a chip's shape
 * changes with selection: medium corners unselected, fully round selected. The older per-type
 * files give a single shape each.
 */
export type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';

export const chip = {
  height: 32,
  /** Leading and trailing icons, px. Smaller than a button's 24. */
  icon: 18,
  /** A leading avatar is larger and round, px. */
  avatar: 24,
  /** Corner radius unselected and selected, px: UnselectedShape and SelectedShape. */
  corner: 12,
  selectedCorner: 9999,
  /** The outline an unselected or flat chip carries, px. */
  outlineWidth: 1,
  /** Elevation level for the elevated option, on the primitive's 0 to 5 scale. */
  elevatedElevation: 1,
  /** Not tokenised: the spec's horizontal space, and less of it beside an icon. */
  padding: 16,
  paddingWithIcon: 8,
} as const;
