/**
 * The carousel has no Compose token file.
 *
 * There is no CarouselTokens object in androidx to capture: the Compose carousel's dimensions
 * live in its own implementation rather than in a generated token file, so `pnpm capture-tokens`
 * has nothing to read. These numbers come from the spec page instead, and the comments say which
 * part of it. Where the spec gives a range, the middle of the range is used.
 *
 * The one value with a token behind it is the corner: the spec draws carousel items at the
 * extra-large corner, which is ShapeTokens.CornerExtraLarge, 28dp, and is in the captured JSON.
 */
export const carousel = {
  /** CornerExtraLarge, as the spec draws the items. */
  corner: 28,
  /** Spec: 8dp between items, in every layout. */
  gap: 8,
  /**
   * Multi-browse: a large item, then a medium one, then as many small ones as fit. The large
   * item is a share of the strip rather than a fixed width, so the layout still works on a phone.
   */
  largeRatio: 0.6,
  mediumWidth: 120,
  /** Spec: small items are 40 to 56dp wide, and never narrower than 40. */
  smallWidth: 56,
  smallMinWidth: 40,
  /** Hero: one item at nearly the full width, with the next one peeking in. */
  heroRatio: 0.84,
  /** Uncontained: items keep one size and are not masked at the edges. */
  uncontainedWidth: 200,
  /** How far a pointer has to travel before the drag counts as a drag and swallows the click. */
  dragThreshold: 4,
} as const;

export type CarouselVariant = 'multi-browse' | 'uncontained' | 'hero' | 'full-screen';
