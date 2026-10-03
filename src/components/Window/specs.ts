/**
 * Window. Material has no floating window — `WindowTokens` is a 404, and so is every other name
 * tried in this phase — so the chrome is borrowed from the two things it most resembles: a
 * dialog's container shape and elevation, and an app bar's row for the title.
 */
import { list } from '../List/specs';

export const windowSpec = {
  /** The title bar, px. ListTokens' one-line row, which is what the bar is. */
  barHeight: list.oneLine,
  /** Gutters inside the bar and the body, px. ItemLeadingSpace. */
  gutter: list.leadingSpace,
  /** The corner, px. DialogTokens: ContainerShape is CornerExtraLarge, 28. */
  corner: 28,
  /** The resting elevation level. DialogTokens: ContainerElevation is Level3. */
  elevation: 3,
  /** The resize grip, px. Chosen: the gutter, so it is a real pointer target. */
  grip: list.leadingSpace,
  /** How far one arrow key moves or resizes the window, px. Chosen. */
  keyboardStep: 16,
  /** The smallest the window may be dragged to, px. Chosen. */
  minWidth: 240,
  minHeight: 120,
} as const;
