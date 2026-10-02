/** From Compose LoadingIndicatorTokens. */
export const loadingIndicator = {
  /** The container, px. */
  size: 48,
  /** The shape inside it, px. */
  activeSize: 38,
  /** Not tokenised: how long each shape holds before morphing to the next, ms. */
  morphMs: 650,
  /**
   * Points each shape is resampled to before interpolating, so shapes with different corner
   * counts can morph into one another.
   */
  samples: 48,
  /** Corner rounding as a fraction of the shorter adjoining edge. */
  rounding: 0.38,
} as const;

/**
 * The shapes the indicator cycles through, by side count.
 *
 * A subset of M3 Expressive's 35-shape library: the regular polygons, which can be derived
 * exactly. The irregular ones need androidx.graphics.shapes ported, which the roadmap records.
 */
export const defaultShapes = [4, 7, 3, 9, 5, 12] as const;
