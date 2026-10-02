import { shapeCorner } from '../../tokens/generated/tokens';

/**
 * From Compose FabSmall/FabBaseline/FabMedium/FabLarge tokens. `baseline` is the default 56dp
 * FAB; M3 Expressive added `medium`.
 */
export type FabSize = 'small' | 'baseline' | 'medium' | 'large';

/**
 * Container colour options. `primary` and `secondary` come from FabPrimaryContainerTokens and
 * FabSecondaryContainerTokens. `tertiary` and `surface` are not tokenised anywhere in the Compose
 * token files, so they follow the identical container / on-container pattern with the roles the
 * spec names for them.
 */
export type FabVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';

export interface FabSizeSpec {
  /** Square container, px */
  size: number;
  /** Corner radius, px */
  corner: number;
  icon: number;
}

export const fabSizes: Record<FabSize, FabSizeSpec> = {
  small: { size: 40, corner: shapeCorner.medium, icon: 24 },
  baseline: { size: 56, corner: shapeCorner.large, icon: 24 },
  medium: { size: 80, corner: shapeCorner.largeIncreased, icon: 28 },
  large: { size: 96, corner: shapeCorner.extraLarge, icon: 32 },
};

// ---------------------------------------------------------------------------
// Extended FAB
// ---------------------------------------------------------------------------

/**
 * From Compose ExtendedFabSmall/Medium/Large tokens. The names are Google's and the heights are
 * worth stating because they do not line up with the plain FAB's: an extended `small` is 56px,
 * the same height as a plain `baseline`.
 */
export type ExtendedFabSize = 'small' | 'medium' | 'large';

export interface ExtendedFabSizeSpec {
  height: number;
  corner: number;
  icon: number;
  /** Space between icon and label, px. */
  gap: number;
  /** Leading and trailing space, px. Equal at every size. */
  padding: number;
}

export const extendedFabSizes: Record<ExtendedFabSize, ExtendedFabSizeSpec> = {
  small: { height: 56, corner: shapeCorner.large, icon: 24, gap: 8, padding: 16 },
  // ExtendedFabMedium publishes no ContainerShape. Every other size shares its corner with the
  // plain FAB of the same height, and 80px is FabMedium, so this follows that.
  medium: { height: 80, corner: shapeCorner.largeIncreased, icon: 28, gap: 16, padding: 26 },
  large: { height: 96, corner: shapeCorner.extraLarge, icon: 32, gap: 20, padding: 28 },
};

/**
 * Collapsing an extended FAB gives exactly the plain FAB of the same height, since the two token
 * sets agree on height and corner at 56, 80 and 96. This is the padding that squares it off.
 */
export function collapsedPadding(spec: ExtendedFabSizeSpec): number {
  return (spec.height - spec.icon) / 2;
}

// ---------------------------------------------------------------------------
// FAB menu
// ---------------------------------------------------------------------------

/** From Compose FabMenuBaselineTokens. */
export const fabMenu = {
  /**
   * Not tokenised: how long a typeahead buffer lives. Long enough to type a word, short enough
   * that coming back to the menu later starts a fresh search.
   */
  typeaheadResetMs: 1000,
  /** The toggle, once it has become a close button, px. */
  closeSize: 56,
  closeIcon: 20,
  /** Gap between the list and the close button, px. */
  closeGap: 8,
  itemHeight: 56,
  itemIcon: 24,
  itemGap: 8,
  itemPadding: 24,
  /** Gap between one list item and the next, px. */
  itemBetween: 4,
} as const;
