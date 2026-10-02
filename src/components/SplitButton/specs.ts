import { shapeCorner } from '../../tokens/generated/tokens';
import type { ButtonSize } from '../Button/specs';

/**
 * From Compose SplitButtonXSmall/Small/Medium/Large/XLarge tokens. The heights match the label
 * and icon button scale exactly, which is what the spec means by "the same five sizes".
 */
export interface SplitButtonSizeSpec {
  height: number;
  /** Gap between the two buttons, px. 2 at every size. */
  between: number;
  /** The corners where the two buttons meet, px. */
  innerCorner: number;
  /** The same corners while hovered or pressed; they grow rather than shrink. */
  innerCornerActive: number;
  leadingStart: number;
  leadingEnd: number;
  /** The trailing button is padded equally on both sides. */
  trailingSide: number;
  trailingIcon: number;
}

export const splitButtonSizes: Record<ButtonSize, SplitButtonSizeSpec> = {
  xs: {
    height: 32,
    between: 2,
    innerCorner: shapeCorner.extraSmall,
    innerCornerActive: shapeCorner.small,
    leadingStart: 12,
    leadingEnd: 10,
    trailingSide: 13,
    trailingIcon: 22,
  },
  s: {
    height: 40,
    between: 2,
    innerCorner: shapeCorner.extraSmall,
    innerCornerActive: shapeCorner.medium,
    leadingStart: 16,
    leadingEnd: 12,
    trailingSide: 13,
    trailingIcon: 22,
  },
  m: {
    height: 56,
    between: 2,
    innerCorner: shapeCorner.extraSmall,
    innerCornerActive: shapeCorner.medium,
    leadingStart: 24,
    leadingEnd: 24,
    trailingSide: 15,
    trailingIcon: 26,
  },
  l: {
    height: 96,
    between: 2,
    innerCorner: shapeCorner.small,
    innerCornerActive: shapeCorner.largeIncreased,
    leadingStart: 48,
    leadingEnd: 48,
    trailingSide: 29,
    trailingIcon: 38,
  },
  xl: {
    height: 136,
    between: 2,
    innerCorner: shapeCorner.medium,
    innerCornerActive: shapeCorner.largeIncreased,
    leadingStart: 64,
    leadingEnd: 64,
    trailingSide: 43,
    trailingIcon: 50,
  },
};
