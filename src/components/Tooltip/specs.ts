/** From Compose PlainTooltipTokens. */
export const tooltip = {
  /** Corner radius, px. CornerExtraSmall. */
  corner: 4,
  /** Not tokenised: the spec's padding and the gap it leaves from the trigger. */
  paddingInline: 8,
  paddingBlock: 4,
  offset: 4,
  /** Long enough that a pointer passing over does not flash tooltips everywhere. */
  delayMs: 500,
} as const;

/**
 * From Compose RichTooltipTokens.
 *
 * The rich tooltip is a different thing from the plain one despite the name: it carries a
 * heading, a paragraph and buttons, so it is a small popover rather than a label.
 */
export const richTooltip = {
  /** Corner radius, px. ContainerShape: CornerMedium. */
  corner: 12,
  /** Elevation level, on the primitive's 0 to 5 scale. ContainerElevation: Level2. */
  elevation: 2,
  /** Not tokenised: the spec's padding, width and the gap it leaves from the trigger. */
  padding: 16,
  maxWidth: 320,
  offset: 4,
  /** The hover warmup, as the plain tooltip's. */
  delayMs: 500,
  /**
   * How long the pointer may be off both the trigger and the panel before it closes. A rich
   * tooltip has buttons in it, so the pointer has to be able to travel from one to the other
   * without the thing it is travelling to disappearing on the way.
   */
  closeDelayMs: 300,
} as const;
