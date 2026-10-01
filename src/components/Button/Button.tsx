import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { AriaButtonProps, PressEvent } from 'react-aria';
import { ButtonBase, uniform } from '../ButtonBase/ButtonBase';
import { cx, useControlledState } from '../../utils';
import {
  buttonSizes,
  iconButtonIconSize,
  iconButtonPadding,
  restingRadius,
  selectedRadius,
  type ButtonShape,
  type ButtonSize,
  type IconButtonWidth,
} from './specs';
import styles from './Button.module.scss';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text';
export type ToggleButtonVariant = Exclude<ButtonVariant, 'text'>;
export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

interface CommonProps extends Omit<AriaButtonProps<'button'>, 'children' | 'elementType'> {
  /** XS 32px, S 40px (default), M 56px, L 96px, XL 136px tall. */
  size?: ButtonSize;
  /** Round (pill) is the default; square uses the size's square corner. */
  shape?: ButtonShape;
  className?: string;
  style?: CSSProperties;
}

interface SelectionProps {
  isSelected?: boolean;
  defaultSelected?: boolean;
  onChange?: (isSelected: boolean) => void;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export interface ButtonProps extends CommonProps {
  variant?: ButtonVariant;
  /** Leading icon (an SVG). */
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

/**
 * M3E common button. Corners morph to the size's pressed radius on press
 * (on the default effects spring, so no bounce, as in Compose).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { variant = 'filled', size = 's', shape = 'round', icon, trailingIcon, children, className, ...rest } = props;
  const spec = buttonSizes[size];
  const resting = restingRadius(size, shape);
  return (
    <ButtonBase
      ref={ref}
      {...rest}
      className={cx(styles.button, className)}
      padding={spec.padding}
      touchTarget={spec.height < 48}
      cornerSpring="defaultEffects"
      corners={({ isPressed }) => uniform(isPressed ? spec.pressed : resting)}
      dataAttributes={{ 'data-variant': variant, 'data-size': size, 'data-shape': shape }}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children != null && <span className={styles.label}>{children}</span>}
      {trailingIcon && <span className={styles.icon}>{trailingIcon}</span>}
    </ButtonBase>
  );
});

// ---------------------------------------------------------------------------
// ToggleButton
// ---------------------------------------------------------------------------

export interface ToggleButtonProps extends Omit<ButtonProps, 'variant'>, SelectionProps {
  variant?: ToggleButtonVariant;
  /** Icon shown when selected, typically the filled version of `icon`. */
  selectedIcon?: ReactNode;
}

/**
 * M3E toggle button. Selecting it swaps the shape (round to square, square to round) on the fast spatial
 * spring, so it overshoots slightly in the expressive scheme.
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(props, ref) {
  const {
    variant = 'filled',
    size = 's',
    shape = 'round',
    icon,
    selectedIcon,
    trailingIcon,
    children,
    className,
    isSelected,
    defaultSelected = false,
    onChange,
    onPress,
    ...rest
  } = props;
  const [selected, setSelected] = useControlledState(isSelected, defaultSelected, onChange);
  const spec = buttonSizes[size];
  const radius = selected ? selectedRadius(size, shape) : restingRadius(size, shape);
  const shownIcon = selected && selectedIcon ? selectedIcon : icon;
  return (
    <ButtonBase
      ref={ref}
      {...rest}
      aria-pressed={selected}
      onPress={(e: PressEvent) => {
        setSelected(!selected);
        onPress?.(e);
      }}
      className={cx(styles.button, className)}
      padding={spec.padding}
      touchTarget={spec.height < 48}
      cornerSpring="fastSpatial"
      corners={({ isPressed }) => uniform(isPressed ? spec.pressed : radius)}
      dataAttributes={{
        'data-variant': variant,
        'data-size': size,
        'data-shape': shape,
        'data-selected': String(selected),
      }}
    >
      {shownIcon && <span className={styles.icon}>{shownIcon}</span>}
      {children != null && <span className={styles.label}>{children}</span>}
      {trailingIcon && <span className={styles.icon}>{trailingIcon}</span>}
    </ButtonBase>
  );
});

// ---------------------------------------------------------------------------
// IconButton
// ---------------------------------------------------------------------------

export interface IconButtonProps extends CommonProps, SelectionProps {
  variant?: IconButtonVariant;
  /** Narrow, default or wide container. */
  width?: IconButtonWidth;
  /** The icon (an SVG). An aria-label is required since there is no visible text. */
  children: ReactNode;
  /** Makes it a toggle icon button. */
  toggle?: boolean;
  selectedIcon?: ReactNode;
  'aria-label': string;
}

/**
 * M3E icon button, plain or toggle. Five sizes, three widths, round or square.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  const {
    variant = 'standard',
    size = 's',
    shape = 'round',
    width = 'default',
    toggle = false,
    children,
    selectedIcon,
    className,
    style,
    isSelected,
    defaultSelected = false,
    onChange,
    onPress,
    ...rest
  } = props;
  const [selected, setSelected] = useControlledState(isSelected, defaultSelected, onChange);
  const spec = buttonSizes[size];
  const isOn = toggle && selected;
  const radius = isOn ? selectedRadius(size, shape) : restingRadius(size, shape);
  return (
    <ButtonBase
      ref={ref}
      {...rest}
      aria-pressed={toggle ? selected : undefined}
      onPress={(e: PressEvent) => {
        if (toggle) setSelected(!selected);
        onPress?.(e);
      }}
      className={cx(styles.button, styles.iconButton, className)}
      style={{ ...style, ['--_icon' as string]: `${iconButtonIconSize[size]}px` }}
      padding={iconButtonPadding[size][width]}
      touchTarget={spec.height < 48}
      cornerSpring={toggle ? 'fastSpatial' : 'defaultEffects'}
      corners={({ isPressed }) => uniform(isPressed ? spec.pressed : radius)}
      dataAttributes={{
        'data-variant': variant,
        'data-size': size,
        'data-shape': shape,
        'data-width': width,
        'data-selected': toggle ? String(selected) : undefined,
      }}
    >
      <span className={styles.icon}>{isOn && selectedIcon ? selectedIcon : children}</span>
    </ButtonBase>
  );
});
