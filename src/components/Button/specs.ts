import { shapeCorner } from '../../tokens/generated/tokens';

export type ButtonSize = 'xs' | 's' | 'm' | 'l' | 'xl';
export type ButtonShape = 'round' | 'square';

export interface ButtonSizeSpec {
  height: number;
  /** Corner radius of the square shape, px */
  square: number;
  /** Corner radius while pressed, px */
  pressed: number;
  icon: number;
  /** Leading and trailing space, px */
  padding: number;
}

/** From Compose ButtonXSmall/Small/Medium/Large/XLargeTokens (see the spec doc, Components > Buttons). */
export const buttonSizes: Record<ButtonSize, ButtonSizeSpec> = {
  xs: { height: 32, square: shapeCorner.medium, pressed: shapeCorner.small, icon: 20, padding: 16 },
  s: { height: 40, square: shapeCorner.medium, pressed: shapeCorner.small, icon: 20, padding: 16 },
  m: { height: 56, square: shapeCorner.large, pressed: shapeCorner.medium, icon: 24, padding: 24 },
  l: { height: 96, square: shapeCorner.extraLarge, pressed: shapeCorner.large, icon: 32, padding: 48 },
  xl: { height: 136, square: shapeCorner.extraLarge, pressed: shapeCorner.large, icon: 40, padding: 64 },
};

export type IconButtonWidth = 'narrow' | 'default' | 'wide';

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

/** Resting corner radius for a shape at a size (round = pill). */
export function restingRadius(size: ButtonSize, shape: ButtonShape): number {
  const spec = buttonSizes[size];
  return shape === 'round' ? spec.height / 2 : spec.square;
}

/** Toggles swap shape when selected: round goes square, square goes round. */
export function selectedRadius(size: ButtonSize, shape: ButtonShape): number {
  return restingRadius(size, shape === 'round' ? 'square' : 'round');
}
