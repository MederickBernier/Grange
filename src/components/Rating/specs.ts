/**
 * There is no RatingTokens in Compose, and the M3 spec does not draw a rating control at all.
 * So every number here is chosen, and the choices are the icon and state-layer sizes the rest of
 * the library already uses, because a star is an icon and a star you can press needs the same
 * target as any other small control.
 */
export const rating = {
  /** One star, px. The shared icon size, which is what ListTokens and the buttons use. */
  starSize: 24,
  /** Space between stars, px. Chosen: tight enough to read as one control. */
  gap: 4,
  /**
   * The press target around a star, px. Not visible, and smaller than the 48px touch target
   * because stars sit shoulder to shoulder — making each one 48 wide would space them out by the
   * width of a star and a half.
   */
  targetSize: 32,
} as const;
