import { forwardRef, useContext, useRef, type CSSProperties, type Ref, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import {
  mergeProps,
  useButton,
  useLocale,
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

/** A button-like renders a `<button>`, or an `<a>` once it is given an `href`. */
export type GrangeButtonElement = HTMLButtonElement | HTMLAnchorElement;

export interface ButtonBaseProps extends AriaButtonProps<'button' | 'a'> {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Corner radii in px for the current press state. Animated on `cornerSpring`. */
  corners: (state: { isPressed: boolean }) => CornerRadii;
  cornerSpring: SpringName;
  /**
   * Horizontal padding in px at rest; button groups animate it to widen or squeeze items.
   * A number pads both sides equally. Split button halves pad their two sides differently, so
   * they pass start and end, which are resolved against the text direction.
   */
  padding: number | { start: number; end: number };
  /** Adds the invisible 48px touch target (for components under 48px tall). */
  touchTarget?: boolean;
  /** Extra data-* attributes the component's CSS keys off (variant, size, selected...). */
  dataAttributes?: Record<string, string | undefined>;
}

/**
 * Shared core for every button-like component: React Aria press/hover/focus handling,
 * state layer, ripple, elevation, touch target, spring-animated corners and group width changes.
 */
export const ButtonBase = forwardRef<GrangeButtonElement, ButtonBaseProps>(function ButtonBase(props, forwardedRef) {
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
  // Resolved up front: the group's squeeze maths works off a single number per side.
  const sides = typeof padding === 'number' ? { start: padding, end: padding } : padding;
  const ripple = useRef<RippleHandle>(null);
  const pointerType = useRef<string>('mouse');

  const group = useContext(ButtonGroupContext);
  const index = useContext(ButtonGroupItemIndex);

  // An href turns this into an anchor, as Material Web's buttons do. useButton keeps the button
  // role and the Space-to-activate behavior, so what assistive tech announces matches how the
  // control actually behaves; the href adds the navigation target and the browser's own
  // affordances, like open-in-new-tab.
  const isLink = ariaProps.href != null;

  const { buttonProps, isPressed } = useButton(
    {
      ...ariaProps,
      elementType: isLink ? 'a' : 'button',
      onPressStart: (e: PressEvent) => {
        pointerType.current = e.pointerType;
        if (e.pointerType !== 'keyboard' && e.pointerType !== 'virtual') ripple.current?.start(e.x, e.y);
        if (group && index >= 0) group.setPressed(index, ref.current?.offsetWidth, sides.start);
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
  const { direction } = useLocale();
  const cornerTransition = useSpring(cornerSpring);
  const groupTransition = useSpring(behavior.springs.groupWidth);

  const r = corners({ isPressed });
  const delta = paddingDeltaFor(index, group);
  const padStart = Math.max(0, sides.start + delta);
  const padEnd = Math.max(0, sides.end + delta);
  const [padLeft, padRight] = direction === 'rtl' ? [padEnd, padStart] : [padStart, padEnd];
  const pressedKind = isPressed
    ? pointerType.current === 'keyboard' || pointerType.current === 'virtual'
      ? 'keyboard'
      : 'pointer'
    : undefined;

  // onClick arrives through ariaProps: useButton routes it into usePress, so it fires on a real
  // click while onPress also covers touch and keyboard activation.
  const domProps = mergeProps(buttonProps, hoverProps, focusProps) as HTMLMotionProps<'button'>;

  // Same props either way; motion.a and motion.button differ only in the element they render,
  // so they are narrowed to one type here and the ref is cast back at the call site.
  const Element = (isLink ? motion.a : motion.button) as typeof motion.button;

  return (
    <Element
      {...domProps}
      ref={ref as Ref<HTMLButtonElement>}
      className={className}
      style={style}
      initial={false}
      animate={{
        borderTopLeftRadius: r.topLeft,
        borderTopRightRadius: r.topRight,
        borderBottomRightRadius: r.bottomRight,
        borderBottomLeftRadius: r.bottomLeft,
        paddingLeft: padLeft,
        paddingRight: padRight,
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
    </Element>
  );
});
