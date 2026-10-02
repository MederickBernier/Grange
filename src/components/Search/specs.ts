/**
 * From Compose SearchBarTokens and SearchViewTokens.
 *
 * The bar is the resting pill; the view is what it becomes once it opens, either docked under the
 * bar or filling the screen. The two differ in shape and header height, and share everything else.
 */
export const searchBar = {
  height: 56,
  /** Fully round, which is what distinguishes it from a text field. */
  corner: 9999,
  /** Elevation level, on the primitive's 0 to 5 scale. */
  elevation: 3,
  avatar: 30,
  icon: 24,
  /** Not tokenised: the spec's horizontal space. */
  padding: 16,
} as const;

export const searchView = {
  /** Docked rounds all four corners; full screen rounds none. */
  dockedCorner: 28,
  fullScreenCorner: 0,
  /** Header height, px, which is taller on a full screen view. */
  dockedHeaderHeight: 56,
  fullScreenHeaderHeight: 72,
  elevation: 3,
  /** Not tokenised: how far the docked results may run before they scroll. */
  dockedMaxHeight: 360,
} as const;
