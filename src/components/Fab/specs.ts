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
