/**
 * Skeleton.
 *
 * Nothing here is captured, and it cannot be: Material has no skeleton. SkeletonTokens,
 * PlaceholderTokens and ShimmerTokens are all 404 in androidx. So every value below is chosen,
 * and chosen to be made of tokens that do exist rather than of numbers:
 *
 * - the shimmer's period is the longest captured duration, extra-long4 (1000ms), run on the
 *   captured linear easing, because a sweep that eases looks like it is stuttering;
 * - the surface is surface-container-highest, the dimmest thing in the scale that is still
 *   visible against surface, and the sweep is the same colour as the text that will replace it,
 *   at the captured hover state-layer opacity;
 * - a text line's height is the line-height of its typescale, so the skeleton occupies the same
 *   space the real text will.
 */
export const skeleton = {
  /** The shimmer's period, ms. Token: motion duration extra-long4. */
  period: 1000,
  /** A text line's default height when no typescale is given, px. Chosen: body-large's line-height. */
  textHeight: 24,
  /** The gap between the lines of a multi-line text skeleton, px. Chosen, on the 4dp grid. */
  lineGap: 8,
  /**
   * How wide the last line of a paragraph is, as a fraction. A paragraph's last line is short,
   * and a block of identical bars does not read as text.
   */
  lastLineWidth: 0.6,
} as const;

export type SkeletonShape = 'text' | 'rect' | 'circle';
export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';
