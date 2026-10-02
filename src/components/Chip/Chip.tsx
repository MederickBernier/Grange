import { forwardRef, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useFocusRing, useHover, useObjectRef, usePress } from 'react-aria';
import { Ripple, type RippleHandle } from '../../primitives/Ripple';
import { useSpring } from '../../motion/GrangeProvider';
import { resolveSlotClass, useComponentConfig, useGrangeConfig, type ChipSlot, type SlotOverrides } from '../../config/config';
import { chip as spec, type ChipVariant } from './specs';
import styles from './Chip.module.scss';

export type { ChipVariant };

export interface ChipProps {
  /** The label. */
  children: ReactNode;
  variant?: ChipVariant;
  /** A leading icon. Assist chips colour theirs with the primary role; the others do not. */
  icon?: ReactNode;
  /** A leading avatar, which is larger and round. Usual on an input chip. */
  avatar?: ReactNode;
  /** Filter and input chips can be selected, which rounds their corners fully. */
  selected?: boolean;
  onClick?: () => void;
  href?: string;
  /** Adds a remove button, which is what makes a chip an input chip. */
  onRemove?: () => void;
  /** Label for the remove button, since an X on its own says nothing. */
  removeLabel?: string;
  /** Lifts the chip instead of outlining it. */
  elevated?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ChipSlot>;
}

/**
 * A chip, in the four kinds the catalog lists.
 *
 * The selected shape change is animated on the selection spring, since the tokens give
 * unselected and selected chips different corners rather than only different colours.
 *
 * A removable chip holds two buttons side by side inside one outline rather than nesting one
 * inside the other, which is how Material Web builds its input chip and the only way the remove
 * button can be reached on its own.
 */
export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(props, forwardedRef) {
  const { defaults, slots, behavior } = useComponentConfig('Chip');
  const {
    children,
    variant = defaults?.variant ?? 'assist',
    icon,
    avatar,
    selected,
    onClick,
    href,
    onRemove,
    removeLabel = 'Remove',
    elevated = defaults?.elevated ?? false,
    disabled,
    className,
    classNames,
    style,
  } = props;

  const { behavior: config } = useGrangeConfig();
  const ref = useObjectRef(forwardedRef);
  const ripple = useRef<RippleHandle>(null);
  const transition = useSpring(behavior.springs.selection);

  const interactive = Boolean(onClick || href);
  const { pressProps, isPressed } = usePress({
    isDisabled: disabled || !interactive,
    onPress: onClick,
    onPressStart: (event) => {
      if (event.pointerType !== 'keyboard' && event.pointerType !== 'virtual') {
        ripple.current?.start(event.x, event.y);
      }
    },
    onPressEnd: () => ripple.current?.end(),
  });
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const slot = (name: ChipSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const leading = avatar ? (
    <span className={styles.avatar}>{avatar}</span>
  ) : icon ? (
    <span className={styles.icon}>{icon}</span>
  ) : null;

  const content = (
    <>
      {leading}
      <span className={slot('label', 'grange-chip-label', styles.label)}>{children}</span>
    </>
  );

  return (
    <motion.span
      className={slot('root', 'grange-chip', styles.chip)}
      style={style}
      initial={false}
      animate={{ borderRadius: selected ? spec.selectedCorner : spec.corner }}
      transition={transition}
      data-variant={variant}
      data-selected={selected || undefined}
      data-elevated={elevated || undefined}
      data-disabled={disabled || undefined}
      data-interactive={interactive || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-pressed={isPressed || undefined}
      data-removable={onRemove ? 'true' : undefined}
      data-ripple={config.ripple.enabled ? undefined : 'off'}
    >
      {/*
        A plain element, not a motion one: only the container animates its corner, and Motion's
        onAnimationStart means something else entirely from the DOM event React Aria passes down,
        so the two cannot share an element.
      */}
      {interactive && href ? (
        <a
          {...pressProps}
          {...hoverProps}
          {...focusProps}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={styles.action}
          href={href}
        >
          <span className="grange-state-layer" aria-hidden="true" />
          {config.ripple.enabled && <Ripple ref={ripple} />}
          {content}
        </a>
      ) : interactive ? (
        <button
          {...pressProps}
          {...hoverProps}
          {...focusProps}
          ref={ref as React.Ref<HTMLButtonElement>}
          className={styles.action}
          type="button"
          aria-pressed={selected != null ? selected : undefined}
          disabled={disabled}
        >
          <span className="grange-state-layer" aria-hidden="true" />
          {config.ripple.enabled && <Ripple ref={ripple} />}
          {content}
        </button>
      ) : (
        <span className={styles.action}>{content}</span>
      )}

      {onRemove && (
        <button
          type="button"
          className={slot('remove', 'grange-chip-remove', styles.remove)}
          onClick={onRemove}
          disabled={disabled}
          aria-label={removeLabel}
        >
          <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </button>
      )}
    </motion.span>
  );
});

export interface ChipGroupProps {
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root'>;
}

/** Lays chips out in a wrapping row and groups them for assistive tech. */
export function ChipGroup({ children, className, classNames, style, ...aria }: ChipGroupProps) {
  const { slots } = useComponentConfig('ChipGroup');
  return (
    <div
      {...aria}
      role="group"
      className={resolveSlotClass(
        'grange-chip-group',
        styles.group,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
