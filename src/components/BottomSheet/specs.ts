/** From Compose SheetBottomTokens. */
export const bottomSheet = {
  /** Rounded on the top corners only, px. DockedContainerShape: CornerExtraLargeTop. */
  corner: 28,
  /** Elevation level, on the primitive's 0 to 5 scale. The tokens give modal and standard both 1. */
  elevation: 1,
  /** The drag handle, px. */
  handleWidth: 32,
  handleHeight: 4,
  /** Not tokenised: the spec's padding, and how far it must be dragged before it dismisses. */
  padding: 16,
  dismissDistance: 120,
  /**
   * Pixels per arrow press when dragging from the keyboard.
   *
   * useMove reports a delta of 1 for an arrow key, which would make dismissing take 120 presses.
   * This scales it so the same gesture takes a handful, which is the only way the keyboard path
   * is usable at all.
   */
  keyboardStep: 20,
} as const;
