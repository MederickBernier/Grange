/**
 * From Compose PrimaryNavigationTabTokens and SecondaryNavigationTabTokens.
 *
 * Only the primary variant publishes indicator tokens. The secondary one reuses that height and
 * takes its own active colour, and spans the full tab rather than hugging the label, which is
 * the difference the spec draws between them.
 */
export type TabsVariant = 'primary' | 'secondary';

export const tabs = {
  /** Strip height for a label on its own, px. */
  height: 48,
  /** And with an icon stacked above it, px. Primary tabs only; secondary keeps them inline. */
  heightWithIcon: 64,
  icon: 24,
  /** Indicator thickness and corner, px. Published for primary, reused for secondary. */
  indicatorHeight: 3,
  indicatorCorner: 3,
  /** The rule under a secondary strip, px. */
  dividerHeight: 1,
  /** Not tokenised: the spec's horizontal space inside a tab. */
  padding: 16,
} as const;
