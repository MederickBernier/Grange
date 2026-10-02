/** From Compose SnackbarTokens. */
export const snackbar = {
  /** Corner radius, px. CornerExtraSmall. */
  corner: 4,
  /** Elevation level, on the primitive's 0 to 5 scale. */
  elevation: 3,
  height: 48,
  heightTwoLine: 68,
  icon: 24,
  /** Not tokenised: the spec's padding and the width it is drawn at. */
  paddingInline: 16,
  minWidth: 344,
  maxWidth: 600,
  /**
   * Default time on screen, ms. React Aria will not go below 5000, since WCAG asks that a
   * message a user has to read is not taken away faster than they can read it.
   */
  timeout: 5000,
} as const;
