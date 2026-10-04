/** From Compose LoadingIndicatorTokens. */
export const loadingIndicator = {
  /** The container, px. */
  size: 48,
  /** The shape inside it, px. */
  activeSize: 38,
  /** Not tokenised: how long each shape holds before morphing to the next, ms. */
  morphMs: 650,
  /**
   * Points each outline is resampled to before interpolating, so two shapes with nothing in
   * common can still morph into one another. The samples carry the curvature, so this is also
   * what decides how smooth a shape looks: 96 across 38px is a chord of about a pixel.
   */
  samples: 96,
} as const;

/**
 * The shapes the indicator cycles through, from the captured library.
 *
 * The spec does not name a sequence, so this is a run that reads as one thing becoming another:
 * a soft shape, a sharp one, a round one, and back.
 */
export const defaultShapes = [
  'SoftBurst',
  'Cookie9Sided',
  'Pentagon',
  'Pill',
  'Sunny',
  'Cookie4Sided',
] as const;
