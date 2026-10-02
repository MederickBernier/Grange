/**
 * There is no NumberFieldTokens in Compose, and the M3 spec does not draw a stepper at all: it
 * treats a number as text in a text field. So the field itself is the text field's geometry,
 * which is captured, and only the stepper is chosen here.
 */
export const numberField = {
  /**
   * The stepper, px. Two buttons stacked, sized so the pair fits inside the text field's 56px
   * container with the same 16px of breathing room the icons get.
   */
  stepperWidth: 24,
  stepperHeight: 24,
  /** The chevron inside one, px. Smaller than the 24px icon slot, because it is a hair not a glyph. */
  stepperIcon: 18,
} as const;
