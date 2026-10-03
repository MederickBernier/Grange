/**
 * Stepper. No `StepperTokens` in androidx, so the metrics are chosen — and borrowed from the
 * same places the timeline borrows from, because the two draw the same thing: a marker on a
 * rail with a label beside it.
 */
import { timeline } from '../Timeline/specs';

export const stepper = {
  /** The numbered circle, px. Larger than a timeline marker because it carries a numeral. */
  marker: 32,
  /** The rail between two markers, px. The divider's thickness. */
  rail: timeline.rail,
  /** Space between a marker and its label, px. ItemBetweenSpace. */
  gap: timeline.gap,
  /** The smallest a horizontal step may get before its label wraps, px. Chosen. */
  minStepWidth: 72,
} as const;
