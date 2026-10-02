/**
 * From Compose DatePickerModalTokens.
 *
 * The modal container itself is not built here: a calendar goes inside a `Dialog`, which already
 * owns the scrim, the focus trap and the scroll lock, so the sizes below are the panel the spec
 * draws around it rather than a container this component renders.
 */
export const calendar = {
  /** The panel the spec draws the calendar in, px. */
  panelWidth: 360,
  panelHeight: 568,
  /** A date cell, px. */
  cell: 40,
  /** The outline marking today, px. */
  todayOutlineWidth: 1,
  /** The header above the grid, px. */
  headerHeight: 120,
  /** A range header is taller, since it carries two dates. */
  rangeHeaderHeight: 128,
  /** A year in the year list, px. */
  yearWidth: 72,
  yearHeight: 36,
} as const;
