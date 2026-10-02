/**
 * From Compose TimeInputTokens.
 *
 * `TimeField` is the input mode: the two-segment entry the spec pairs with the dial. The dial is
 * `TimePicker`, which reads TimePickerTokens instead — the two modes share nothing but the
 * value, which is why they are separate token objects upstream as well.
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
