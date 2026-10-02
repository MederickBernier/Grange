/** From Compose NavigationDrawerTokens. */
export const drawer = {
  width: 360,
  /** Rounded on the inner edge only, px. ContainerShape: CornerLargeEnd. */
  corner: 16,
  /** Elevation levels for the two kinds, on the primitive's 0 to 5 scale. */
  modalElevation: 1,
  standardElevation: 0,
  /** The active item pill, px. Wider and taller than the bar's or the rail's. */
  indicatorWidth: 336,
  indicatorHeight: 56,
  icon: 24,
  /** Not tokenised: the inset that keeps the 336px pill inside the 360px panel. */
  padding: 12,
} as const;
