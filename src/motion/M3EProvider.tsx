import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion, type Transition } from 'motion/react';
import { springs, type MotionSchemeName, type SpringName } from '../tokens/generated/tokens';

/** A spring as M3 defines it: stiffness plus damping ratio (1 = no overshoot). */
export interface SpringSpec {
  stiffness: number;
  dampingRatio: number;
}

interface M3EContextValue {
  scheme: MotionSchemeName;
  /** Per-spring overrides, used by the Storybook motion playground to tune values live. */
  springOverrides?: Partial<Record<SpringName, SpringSpec>>;
}

const M3EContext = createContext<M3EContextValue>({ scheme: 'expressive' });

export interface M3EProviderProps {
  /** Expressive (bouncier, the M3E default) or standard (calmer, for dense utilitarian screens). */
  scheme?: MotionSchemeName;
  springOverrides?: Partial<Record<SpringName, SpringSpec>>;
  children: ReactNode;
}

/**
 * Sets the motion scheme for everything below it. Wrap the app once.
 * Also tells Motion to follow the user's reduced-motion setting.
 */
export function M3EProvider({ scheme = 'expressive', springOverrides, children }: M3EProviderProps) {
  const value = useMemo(() => ({ scheme, springOverrides }), [scheme, springOverrides]);
  return (
    <M3EContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </M3EContext.Provider>
  );
}

export function useMotionScheme(): MotionSchemeName {
  return useContext(M3EContext).scheme;
}

/** Converts an M3 damping ratio to the absolute damping Motion expects (mass = 1). */
export function toMotionDamping(stiffness: number, dampingRatio: number): number {
  return 2 * dampingRatio * Math.sqrt(stiffness);
}

/**
 * Returns a Motion transition for one of the six M3E springs, in the current scheme.
 * With reduced motion on, spatial springs fall back to their critically damped effects twin (no bounce).
 */
export function useSpring(name: SpringName): Transition {
  const { scheme, springOverrides } = useContext(M3EContext);
  const reduce = useReducedMotion();
  const effective: SpringName = reduce ? (name.replace('Spatial', 'Effects') as SpringName) : name;
  const override = springOverrides?.[effective];
  const token = springs[scheme][effective];
  const stiffness = override?.stiffness ?? token.stiffness;
  const damping = override ? toMotionDamping(override.stiffness, override.dampingRatio) : token.damping;
  return { type: 'spring', stiffness, damping, mass: 1 };
}
