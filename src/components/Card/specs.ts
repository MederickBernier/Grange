/** From Compose ElevatedCardTokens, FilledCardTokens and OutlinedCardTokens. */
export type CardVariant = 'elevated' | 'filled' | 'outlined';

export interface CardVariantSpec {
  /** Elevation level at rest and on hover, on the primitive's 0 to 5 scale. */
  elevation: number;
  hoverElevation: number;
}

export const cardVariants: Record<CardVariant, CardVariantSpec> = {
  elevated: { elevation: 1, hoverElevation: 2 },
  filled: { elevation: 0, hoverElevation: 1 },
  outlined: { elevation: 0, hoverElevation: 1 },
};

export const card = {
  /** Corner radius, px. CornerMedium, the same for all three variants. */
  corner: 12,
  /** The outlined variant's border, px. */
  outlineWidth: 1,
  icon: 24,
  /** Not tokenised: the spec's padding. */
  padding: 16,
} as const;
