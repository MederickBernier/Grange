/**
 * Tile layout. No `TileLayoutTokens`, `TileTokens`, `DashboardTokens` or `WidgetTokens` in
 * androidx, so the metrics are chosen — but the tile itself is a card, and that *is* captured:
 * `OutlinedCardTokens` gives the shape, the resting elevation and, usefully, a real value for
 * the dragged state.
 */
import { list } from '../List/specs';

export const tileLayout = {
  /** The tile's corner, px. OutlinedCardTokens: ContainerShape is CornerMedium, 12. */
  corner: 12,
  /** Resting elevation. OutlinedCardTokens: ContainerElevation is Level0. */
  elevation: 0,
  /** While a tile is being moved. OutlinedCardTokens: DraggedContainerElevation is Level3. */
  draggedElevation: 3,
  /** The header row of a tile, px. ListTokens' one-line row. */
  headerHeight: list.oneLine,
  /** Gutters, px. ItemLeadingSpace. */
  gutter: list.leadingSpace,
  /** How tall one grid row is, px. Chosen. */
  rowHeight: 160,
  /** How far one arrow key moves or resizes, in whole tracks. */
  keyboardStep: 1,
} as const;
