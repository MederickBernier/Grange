/** From Compose PlainTooltipTokens. The rich variant is captured but not built yet. */
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
