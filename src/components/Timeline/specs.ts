/**
 * Timeline and stepper.
 *
 * Material names neither — `TimelineTokens` and `StepperTokens` are both 404 in androidx — so
 * every value here is chosen, and chosen out of values that are captured elsewhere: the marker
 * is `ListTokens`' leading-icon size, the rail is the divider's one pixel, and the rows are the
 * list's one-line height. A timeline and a stepper then sit on the same rhythm as a list rather
 * than on their own.
 */
import { list } from '../List/specs';

export const timeline = {
  /** The dot or icon on the rail, px. Chosen: ItemLeadingIconSize. */
  marker: list.leadingIcon,
  /** The bare dot inside an empty marker, px. Chosen: half the marker. */
  dot: list.leadingIcon / 2,
  /** The rail, px. Chosen: the divider's thickness. */
  rail: 1,
  /** Space between the rail and the content, px. Chosen: ItemBetweenSpace. */
  gap: list.betweenSpace,
  /** Space between one entry and the next, px. Chosen: ItemLeadingSpace. */
  entryGap: list.leadingSpace,
} as const;
