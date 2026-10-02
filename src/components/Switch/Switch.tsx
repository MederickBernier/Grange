import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { VisuallyHidden, useFocusRing, useHover, useObjectRef, usePress, useSwitch } from 'react-aria';
import { useToggleState } from 'react-stately';
import { useSpring } from '../../motion/GrangeProvider';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type SwitchSlot,
} from '../../config/config';
import { handlePosition, handleSize, switchSpec as spec } from './specs';
import styles from './Switch.module.scss';

export interface SwitchProps {
  /** The visible label. Without one, pass aria-label. */
  children?: ReactNode;
  /** Controlled on state. Material Web calls this `selected`. */
  selected?: boolean;
  defaultSelected?: boolean;
  onChange?: (selected: boolean) => void;
  /** Shown in the handle while on. Its presence also makes the off handle the larger size. */
  selectedIcon?: ReactNode;
  /** Shown in the handle while off. */
  icon?: ReactNode;
  disabled?: boolean;
  name?: string;
  value?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SwitchSlot>;
}

/**
 * A switch, on React Aria's useSwitch, so it is a real checkbox input underneath with the switch
 * role on top: it participates in forms and answers Space.
 *
 * The handle slides and grows on the selection spring, 16px off, 24px on and 28px while pressed,
 * which is the M3 Expressive bit. Giving it an icon makes the off handle the larger size too,
 * since a 16px handle cannot hold a 16px icon.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(props, forwardedRef) {
  const { slots, behavior } = useComponentConfig('Switch');
  const {
    children,
    selected,
    defaultSelected,
    onChange,
    selectedIcon,
    icon,
    disabled,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const ref = useObjectRef(forwardedRef);
  const ariaProps = {
    ...rest,
    isSelected: selected,
    defaultSelected,
    onChange,
    isDisabled: disabled,
    children,
  };

  const state = useToggleState(ariaProps);
  const { inputProps } = useSwitch(ariaProps, state, ref);
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();
  const { pressProps, isPressed } = usePress({ isDisabled: disabled });
  const transition = useSpring(behavior.springs.selection);

  const isSelected = state.isSelected;
  const hasIcon = Boolean(icon || selectedIcon);
  const size = handleSize({ selected: isSelected, pressed: isPressed, hasIcon });
  const { inset, x } = handlePosition(size, isSelected);
  const shownIcon = isSelected ? selectedIcon : icon;

  const slot = (name: SwitchSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <label
      {...hoverProps}
      {...pressProps}
      className={slot('root', 'grange-switch', styles.root)}
      style={style}
      data-selected={String(isSelected)}
      data-disabled={disabled || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-pressed={isPressed || undefined}
    >
      <VisuallyHidden>
        <input {...inputProps} {...focusProps} ref={ref} />
      </VisuallyHidden>

      <span className={slot('track', 'grange-switch-track', styles.track)} aria-hidden="true">
        <motion.span
          className={slot('handle', 'grange-switch-handle', styles.handle)}
          initial={false}
          animate={{ width: size, height: size, x, y: inset }}
          transition={transition}
        >
          {shownIcon && <span className={styles.icon}>{shownIcon}</span>}
        </motion.span>
      </span>

      {children != null && (
        <span className={slot('label', 'grange-switch-label', styles.label)}>{children}</span>
      )}
    </label>
  );
});
