import { createContext } from 'react';

/** Shared state for a standard ButtonGroup: which item is pressed and how much it grows. */
export interface ButtonGroupState {
  pressedIndex: number | null;
  /** px the pressed item takes from each neighbour */
  growth: number;
}

export interface ButtonGroupContextValue {
  state: ButtonGroupState;
  count: number;
  /** M3E default 0.15: the pressed item widens by 15% of its width. */
  expandedRatio: number;
  setPressed(index: number | null, ownWidth?: number, ownPadding?: number): void;
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);
export const ButtonGroupItemIndex = createContext<number>(-1);

/**
 * Padding change (px, per side) for item `index` given the group state.
 * Mirrors Compose's ButtonGroup: the pressed item grows, its direct neighbours shrink by the same amount,
 * so the row keeps its total width.
 */
export function paddingDeltaFor(index: number, ctx: ButtonGroupContextValue | null): number {
  if (!ctx || index < 0) return 0;
  const { pressedIndex, growth } = ctx.state;
  if (pressedIndex === null || growth === 0) return 0;
  const isMiddle = pressedIndex > 0 && pressedIndex < ctx.count - 1;
  if (index === pressedIndex) {
    const total = isMiddle ? growth * 2 : growth;
    return total / 2;
  }
  if (Math.abs(index - pressedIndex) === 1) return -growth / 2;
  return 0;
}
