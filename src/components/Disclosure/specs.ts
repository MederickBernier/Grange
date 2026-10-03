/**
 * Expansion panel and accordion.
 *
 * Material names neither: `ExpansionPanelTokens` and `AccordionTokens` are both 404 in androidx,
 * as is every other name tried for this phase. But the header of an expansion panel is a list
 * row — the same 56px row with the same 16px gutters and the same body-large label — so the
 * geometry below is `ListTokens`', used verbatim rather than guessed at. The container's corner
 * is the list container's, `CornerLarge`.
 *
 * What is chosen: the chevron's size, and that the panel animates on the short4 duration. Both
 * are labelled where they are used.
 */
import { list } from '../List/specs';

export const disclosure = {
  /** The header row, px. ListTokens: ItemHeight for a one-line row. */
  headerHeight: list.oneLine,
  /** Gutters inside the header and the panel, px. ListTokens: ItemLeadingSpace/ItemTrailingSpace. */
  leadingSpace: list.leadingSpace,
  trailingSpace: list.trailingSpace,
  /** Space between the header's slots, px. ListTokens: ItemBetweenSpace. */
  betweenSpace: list.betweenSpace,
  /** The leading icon, px. ListTokens: ItemLeadingIconSize. */
  leadingIcon: list.leadingIcon,
  /** The container corner, px. ListTokens: ContainerShape CornerLarge. */
  corner: list.containerCorner,
  /** The chevron, px. Chosen, to match the leading icon. */
  chevron: 24,
} as const;

export type AccordionVariant = 'plain' | 'outlined' | 'filled';
