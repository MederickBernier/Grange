import { useContext, useMemo, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion, type Transition } from 'motion/react';
import { springs, type SpringName } from '../tokens/generated/tokens';
import {
  GrangeConfigContext,
  defaultConfig,
  mergeConfig,
  type GrangeConfigInput,
  type SpringSpec,
} from '../config/config';

export type { SpringSpec };

export interface GrangeProviderProps extends GrangeConfigInput {
  children: ReactNode;
}

/**
 * Sets the motion scheme and everything else a product can configure: component defaults, slot
 * class names, interaction behavior and size geometry. Wrap the app once.
 *
 * Providers nest and merge, so a subtree can change part of the config without restating the
 * rest. Also tells Motion to follow the user's reduced-motion setting.
 */
export function GrangeProvider({ children, ...input }: GrangeProviderProps) {
  const parent = useContext(GrangeConfigContext);
  // Compared field by field, since `input` is a fresh object every render. Hoist the config
  // objects you pass (or memoize them) so this does not rebuild on every parent render.
  const config = useMemo(
    () => mergeConfig(parent, input),
    [
      parent,
      input.scheme,
      input.springOverrides,
      input.defaultProps,
      input.classNames,
      input.behavior,
      input.sizes,
    ],
  );

  return (
    <GrangeConfigContext.Provider value={config}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </GrangeConfigContext.Provider>
  );
}

export function useMotionScheme() {
  return useContext(GrangeConfigContext).scheme;
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
  const { scheme, springOverrides } = useContext(GrangeConfigContext);
  const reduce = useReducedMotion();
  const effective: SpringName = reduce ? (name.replace('Spatial', 'Effects') as SpringName) : name;
  const override = springOverrides?.[effective];
  const token = springs[scheme][effective];
  const stiffness = override?.stiffness ?? token.stiffness;
  const damping = override ? toMotionDamping(override.stiffness, override.dampingRatio) : token.damping;
  return { type: 'spring', stiffness, damping, mass: 1 };
}

export { defaultConfig };
