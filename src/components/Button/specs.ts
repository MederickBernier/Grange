import { shapeCorner } from '../../tokens/generated/tokens';

export type ButtonSize = 'xs' | 's' | 'm' | 'l' | 'xl';
export type ButtonShape = 'round' | 'square';
export type IconButtonWidth = 'narrow' | 'default' | 'wide';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text';
export type ToggleButtonVariant = Exclude<ButtonVariant, 'text'>;
export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

export interface ButtonSizeSpec {
  height: number;
  /** Corner radius of the square shape, px */
  square: number;
  /** Corner radius while pressed, px */
  pressed: number;
  /** Icon box, px */
  icon: number;
  /** Space between icon and label, px */
  gap: number;
  /** Leading and trailing space, px */
  padding: number;
}

/**
 * From Compose ButtonXSmall/Small/Medium/Large/XLargeTokens (see the spec doc, Components > Buttons).
 *
 * This is the only place button geometry is written down. The stylesheet owns the typescale per
 * size; height, icon box and gap reach CSS as custom properties the component sets, because the
 * spring-animated radii and padding need the same numbers in JS and the two must not drift.
 */
export const buttonSizes: Record<ButtonSize, ButtonSizeSpec> = {
  xs: { height: 32, square: shapeCorner.medium, pressed: shapeCorner.small, icon: 20, gap: 8, padding: 16 },
  s: { height: 40, square: shapeCorner.medium, pressed: shapeCorner.small, icon: 20, gap: 8, padding: 16 },
  m: { height: 56, square: shapeCorner.large, pressed: shapeCorner.medium, icon: 24, gap: 8, padding: 24 },
  l: {
    height: 96,
    square: shapeCorner.extraLarge,
    pressed: shapeCorner.large,
    icon: 32,
    gap: 12,
    padding: 48,
  },
  xl: {
    height: 136,
    square: shapeCorner.extraLarge,
    pressed: shapeCorner.large,
    icon: 40,
    gap: 16,
    padding: 64,
  },
};

/** From Compose XSmall/Small/Medium/Large/XLargeIconButtonTokens. Padding is per side, per width. */
export const iconButtonPadding: Record<ButtonSize, Record<IconButtonWidth, number>> = {
  xs: { narrow: 4, default: 6, wide: 10 },
  s: { narrow: 4, default: 8, wide: 14 },
  m: { narrow: 12, default: 16, wide: 24 },
  l: { narrow: 16, default: 32, wide: 48 },
  xl: { narrow: 32, default: 48, wide: 72 },
};

/** Icon buttons use a 24px icon at S where text buttons use 20px. */
export const iconButtonIconSize: Record<ButtonSize, number> = { xs: 20, s: 24, m: 24, l: 32, xl: 40 };

// ---------------------------------------------------------------------------
// Overrides
// ---------------------------------------------------------------------------

export interface SizeOverrides {
  /** Per size, any subset of the geometry. Unlisted sizes and fields keep the Compose values. */
  button?: Partial<Record<ButtonSize, Partial<ButtonSizeSpec>>>;
  iconButtonPadding?: Partial<Record<ButtonSize, Partial<Record<IconButtonWidth, number>>>>;
  iconButtonIcon?: Partial<Record<ButtonSize, number>>;
}

export interface ResolvedSizes {
  button: Record<ButtonSize, ButtonSizeSpec>;
  iconButtonPadding: Record<ButtonSize, Record<IconButtonWidth, number>>;
  iconButtonIcon: Record<ButtonSize, number>;
}

const SIZES: ButtonSize[] = ['xs', 's', 'm', 'l', 'xl'];

export const defaultSizes: ResolvedSizes = {
  button: buttonSizes,
  iconButtonPadding,
  iconButtonIcon: iconButtonIconSize,
};

/** Folds overrides onto `base`, leaving anything unlisted alone. Nested providers pass their parent's resolved sizes as the base. */
export function resolveSizes(
  overrides: SizeOverrides | undefined,
  base: ResolvedSizes = defaultSizes,
): ResolvedSizes {
  if (!overrides) return base;

  const button = {} as Record<ButtonSize, ButtonSizeSpec>;
  const padding = {} as Record<ButtonSize, Record<IconButtonWidth, number>>;
  const icon = {} as Record<ButtonSize, number>;

  for (const size of SIZES) {
    button[size] = { ...base.button[size], ...overrides.button?.[size] };
    padding[size] = { ...base.iconButtonPadding[size], ...overrides.iconButtonPadding?.[size] };
    icon[size] = overrides.iconButtonIcon?.[size] ?? base.iconButtonIcon[size];
  }
  return { button, iconButtonPadding: padding, iconButtonIcon: icon };
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/** Resting corner radius for a shape at a size (round = pill). */
export function restingRadius(
  size: ButtonSize,
  shape: ButtonShape,
  sizes: ResolvedSizes = defaultSizes,
): number {
  const spec = sizes.button[size];
  return shape === 'round' ? spec.height / 2 : spec.square;
}

/** Toggles swap shape when selected: round goes square, square goes round. */
export function selectedRadius(
  size: ButtonSize,
  shape: ButtonShape,
  sizes: ResolvedSizes = defaultSizes,
): number {
  return restingRadius(size, shape === 'round' ? 'square' : 'round', sizes);
}

/**
 * The geometry a component hands to CSS. Kept in one place so every button-like agrees.
 *
 * `--grange-icon-size` is deliberately public, not `--_`-prefixed: `Icon` reads it to size itself
 * to whatever control it sits in. The height and gap stay private to Button.module.scss.
 */
export function sizeCustomProperties(spec: ButtonSizeSpec, iconSize = spec.icon): Record<string, string> {
  return {
    '--_height': `${spec.height}px`,
    '--_gap': `${spec.gap}px`,
    '--grange-icon-size': `${iconSize}px`,
  };
}
