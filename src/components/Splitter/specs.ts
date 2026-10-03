/**
 * Splitter. No `SplitterTokens` in androidx — Material has no splitter — so the metrics are
 * chosen, out of values that are captured: the bar is the divider's one pixel inside a hit area
 * the size of a list row's gutter, which is the smallest target the rest of the library uses.
 */
import { list } from '../List/specs';

export const splitter = {
  /** The visible line, px. The divider's thickness. */
  line: 1,
  /**
   * The draggable band around it, px. ListTokens' ItemLeadingSpace — a one-pixel line is not a
   * pointer target, and this is the smallest gutter the library already draws.
   */
  hitArea: list.leadingSpace,
  /** How far one arrow key moves the boundary, px. Chosen. */
  keyboardStep: 16,
  /** The smallest a pane may be dragged to, px, when it does not say otherwise. Chosen. */
  minSize: 48,
} as const;
