/**
 * From Compose RadioButtonTokens, which gives the icon box and the state layer but not the ring
 * itself. The ring width and the inner dot are the standard M3 proportions for a 20px control:
 * a 2px ring, and a dot half the outer diameter.
 */
export const radio = {
  /** Outer diameter, px. */
  size: 20,
  /** Ring thickness while unselected and selected, px. Not tokenised. */
  ringWidth: 2,
  /** The filled centre when selected, px. Not tokenised. */
  dotSize: 10,
  stateLayerSize: 40,
} as const;
