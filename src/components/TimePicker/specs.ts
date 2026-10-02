/**
 * From Compose TimePickerTokens, captured in tokens/m3-expressive.json.
 *
 * This is the dial mode of the time picker. The input mode is `TimeField`, which reads
 * TimeInputTokens instead; the two share nothing but the value, which is why they are separate
 * token objects upstream as well.
 */
export const timePicker = {
  /** The hour and minute boxes, px. TimeSelectorContainerWidth / Height. */
  selectorWidth: 96,
  selectorHeight: 80,
  /** Narrower when there is no AM/PM to make room for. TimeSelector24HVerticalContainerWidth. */
  selectorWidth24H: 114,
  /** TimeSelectorContainerShape: CornerSmall. */
  selectorCorner: 8,
  /** The AM/PM selector, px. The spec draws it beside the boxes or under them. */
  periodWidth: 52,
  periodHeight: 80,
  periodHorizontalWidth: 216,
  periodHorizontalHeight: 38,
  /** PeriodSelectorContainerShape: CornerSmall, with a 1px Outline border. */
  periodCorner: 8,
  periodOutlineWidth: 1,
  /** The dial, px. ClockDialContainerSize. */
  dialSize: 256,
  /** The handle that rides around it, px. ClockDialSelectorHandleContainerSize. */
  handleSize: 48,
  /** The dot at the middle, px. ClockDialSelectorCenterContainerSize. */
  centreSize: 8,
  /** The line from the middle to the handle, px. ClockDialSelectorTrackContainerWidth. */
  trackWidth: 2,
  /**
   * Not tokenised: how far each ring sits in from the dial's edge, in handle widths, so that
   * `radius = dialSize / 2 - inset * handleSize`. The outer ring is half a handle in, which is
   * the least that keeps the handle inside the dial; the inner ring of a 24-hour face is a
   * further handle's width in, which is the least that keeps the two rings from overlapping.
   * That puts them at 104px and 56px on the 256px dial.
   */
  outerRingInset: 0.5,
  innerRingInset: 1.5,
} as const;

/** Degrees per hour on a 12-hour face, and per minute on a 60-minute one. */
export const DEGREES_PER_HOUR = 30;
export const DEGREES_PER_MINUTE = 6;
