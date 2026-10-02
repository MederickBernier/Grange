/**
 * From Compose TimeInputTokens and TimePickerTokens.
 *
 * `TimeField` is the input mode: the two-segment entry the spec pairs with the dial. The dial
 * itself is not built, and its tokens are captured and recorded in the roadmap: it needs the
 * polar drag handling of a clock face, which is a component of its own.
 */
export const timeField = {
  /** A segment box, px. */
  fieldWidth: 96,
  fieldHeight: 72,
  /** Corner radius of a segment, px. */
  corner: 8,
  /** The separator between the segments, px. */
  separatorWidth: 24,
} as const;

/** From TimePickerTokens, for the dial that is not built yet. */
export const timePickerDial = {
  size: 256,
  handleSize: 48,
  centreSize: 8,
  trackWidth: 2,
} as const;
