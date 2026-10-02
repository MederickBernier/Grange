/**
 * The side sheet has no Compose token file.
 *
 * Every other component here reads its geometry out of androidx with `pnpm capture-tokens`, so
 * nothing is hand-typed. There is nothing to read for this one: of the sheet tokens Compose
 * generates, only SheetBottomTokens exists — SheetSideTokens and SideSheetTokens are both 404.
 *
 * So these numbers are chosen rather than captured, and the comments say where each one comes
 * from. Where the spec page and a tokenised neighbour agree, the neighbour wins, because a side
 * sheet and a navigation drawer are the same panel on the same edge and should not disagree by a
 * pixel. That neighbour is NavigationDrawerTokens, which is captured and in the JSON.
 */
export const sideSheet = {
  /** Spec: 256 to 400dp. 360 is NavigationDrawerTokens.ContainerWidth, so the two edges match. */
  width: 360,
  minWidth: 256,
  maxWidth: 400,
  /** Rounded on the inner edge only. NavigationDrawerTokens.ContainerShape is CornerLargeEnd. */
  corner: 16,
  /** Elevation levels, on the primitive's 0 to 5 scale. The drawer's two values. */
  modalElevation: 1,
  standardElevation: 0,
  /** Spec: 16dp around the content, 24dp of leading space for the headline row. */
  padding: 16,
  headerHeight: 72,
  /**
   * Pixels per arrow press while resizing from the keyboard.
   *
   * useMove reports a delta of 1 for an arrow key, so without this a resize would take a hundred
   * presses to cross the 256 to 400 range. Same reason and same value as the bottom sheet's.
   */
  keyboardStep: 20,
} as const;
