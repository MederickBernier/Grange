import { forwardRef, useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import {
  mergeProps,
  useButton,
  useFocusRing,
  useHover,
  useObjectRef,
  type AriaButtonProps,
  type PressEvent,
} from 'react-aria';
import { useSpring } from '../../motion/GrangeProvider';
import { useGrangeConfig } from '../../config/config';
import type { SpringName } from '../../tokens/generated/tokens';
import { Ripple, type RippleHandle } from '../../primitives/Ripple';
import { ButtonGroupContext, ButtonGroupItemIndex, paddingDeltaFor } from './groupContext';

export interface CornerRadii {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export const uniform = (r: number): CornerRadii => ({ topLeft: r, topRight: r, bottomRight: r, bottomLeft: r });

export interface ButtonBaseProps extends AriaButtonProps<'button'> {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Corner radii in px for the current press state. Animated on `cornerSpring`. */
  corners: (state: { isPressed: boolean }) => CornerRadii;
  cornerSpring: SpringName;
  /** Horizontal padding in px at rest; button groups animate it to widen or squeeze items. */
  padding: number;
  /** Adds the invisible 48px touch target (for components under 48px tall). */
  touchTarget?: boolean;
  /** Extra data-* attributes the component's CSS keys off (variant, size, selected...). */
  dataAttributes?: Record<string, string | undefined>;
}

/**
 * Shared core for every button-like component: React Aria press/hover/focus handling,
 * state layer, ripple, elevation, touch target, spring-animated corners and group width changes.
 */
export const ButtonBase = forwardRef<HTMLButtonElement, ButtonBaseProps>(function ButtonBase(props, forwardedRef) {
  const {
    className,
    style,
    children,
    corners,
    cornerSpring,
    padding,
    touchTarget,
    dataAttributes,
    onPressStart,
    onPressEnd,
    ...ariaProps
  } = props;
  const ref = useObjectRef(forwardedRef);
  const ripple = useRef<RippleHandle>(null);
  const pointerType = useRef<string>('mouse');

  const group = useContext(ButtonGroupContext);
  const index = useContext(ButtonGroupItemIndex);

  const { buttonProps, isPressed } = useButton(
    {
      ...ariaProps,
      onPressStart: (e: PressEvent) => {
        pointerType.current = e.pointerType;
        if (e.pointerType !== 'keyboard' && e.pointerType !== 'virtual') ripple.current?.start(e.x, e.y);
        if (group && index >= 0) group.setPressed(index, ref.current?.offsetWidth, padding);
        onPressStart?.(e);
      },
      onPressEnd: (e: PressEvent) => {
        ripple.current?.end();
        if (group && index >= 0) group.setPressed(null);
        onPressEnd?.(e);
      },
    },
    ref,
  );
  const { hoverProps, isHovered } = useHover({ isDisabled: ariaProps.isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const { behavior } = useGrangeConfig();
  const cornerTransition = useSpring(cornerSpring);
  const groupTransition = useSpring(behavior.springs.groupWidth);

  const r = corners({ isPressed });
  const pad = Math.max(0, padding + paddingDeltaFor(index, group));
  const pressedKind = isPressed
    ? pointerType.current === 'keyboard' || pointerType.current === 'virtual'
      ? 'keyboard'
      : 'pointer'
    : undefined;

  const domProps = mergeProps(buttonProps, hoverProps, focusProps) as HTMLMotionProps<'button'>;

  return (
    <motion.button
      {...domProps}
      ref={ref}
      className={className}
      style={style}
      initial={false}
      animate={{
        borderTopLeftRadius: r.topLeft,
        borderTopRightRadius: r.topRight,
        borderBottomRightRadius: r.bottomRight,
        borderBottomLeftRadius: r.bottomLeft,
        paddingLeft: pad,
        paddingRight: pad,
      }}
      transition={{ default: cornerTransition, paddingLeft: groupTransition, paddingRight: groupTransition }}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-pressed={pressedKind}
      data-ripple={behavior.ripple.enabled ? undefined : 'off'}
      data-disabled={ariaProps.isDisabled || undefined}
      {...dataAttributes}
    >
      <span className="grange-elevation" aria-hidden="true" />
      <span className="grange-state-layer" aria-hidden="true" />
      {behavior.ripple.enabled && <Ripple ref={ripple} />}
      {touchTarget && <span className="grange-touch" aria-hidden="true" />}
      {children}
    </motion.button>
  );
});
