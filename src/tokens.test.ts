import { describe, expect, it } from 'vitest';
import { springs, shapeCorner } from './tokens/generated/tokens';
import { toMotionDamping } from './motion/M3EProvider';
import { paddingDeltaFor, type ButtonGroupContextValue } from './components/ButtonBase/groupContext';
import { restingRadius, selectedRadius } from './components/Button/specs';

describe('tokens', () => {
  it('match the M3E Compose values', () => {
    expect(springs.expressive.fastSpatial).toMatchObject({ stiffness: 800, dampingRatio: 0.6 });
    expect(springs.expressive.defaultSpatial).toMatchObject({ stiffness: 380, dampingRatio: 0.8 });
    expect(springs.standard.defaultSpatial).toMatchObject({ stiffness: 700, dampingRatio: 0.9 });
    expect(springs.expressive.defaultEffects).toMatchObject({ stiffness: 1600, dampingRatio: 1 });
    expect(shapeCorner).toMatchObject({ extraSmall: 4, medium: 12, largeIncreased: 20, extraExtraLarge: 48 });
  });

  it('convert damping ratio to Motion damping', () => {
    for (const scheme of Object.values(springs)) {
      for (const s of Object.values(scheme)) {
        expect(s.damping).toBeCloseTo(toMotionDamping(s.stiffness, s.dampingRatio), 1);
      }
    }
    expect(toMotionDamping(1600, 1)).toBe(80);
  });
});

describe('button shapes', () => {
  it('round toggles go square and square toggles go round', () => {
    expect(restingRadius('s', 'round')).toBe(20);
    expect(selectedRadius('s', 'round')).toBe(12);
    expect(selectedRadius('m', 'square')).toBe(28);
  });
});

describe('button group width redistribution', () => {
  const ctx = (pressedIndex: number | null, growth: number, count = 3) =>
    ({ state: { pressedIndex, growth }, count, expandedRatio: 0.15, setPressed: () => {} }) as ButtonGroupContextValue;

  it('middle item takes from both neighbours and the row keeps its width', () => {
    const c = ctx(1, 5);
    const deltas = [0, 1, 2].map((i) => paddingDeltaFor(i, c) * 2);
    expect(deltas).toEqual([-5, 10, -5]);
    expect(deltas.reduce((a, b) => a + b)).toBe(0);
  });

  it('end item takes from its single neighbour', () => {
    const deltas = [0, 1, 2].map((i) => paddingDeltaFor(i, ctx(0, 8)) * 2);
    expect(deltas).toEqual([8, -8, 0]);
  });

  it('nothing moves at rest', () => {
    expect([0, 1, 2].map((i) => paddingDeltaFor(i, ctx(null, 8)))).toEqual([0, 0, 0]);
  });
});
