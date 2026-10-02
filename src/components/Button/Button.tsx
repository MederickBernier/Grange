import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { AriaButtonProps, PressEvent } from 'react-aria';
import { ButtonBase, uniform } from '../ButtonBase/ButtonBase';
import { useControlledState } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type ButtonSlot,
  type IconButtonSlot,
  type SlotOverrides,
} from '../../config/config';
import {
  restingRadius,
  selectedRadius,
  sizeCustomProperties,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
  type IconButtonVariant,
  type IconButtonWidth,
  type ToggleButtonVariant,
} from './specs';
import styles from './Button.module.scss';

export type { ButtonVariant, ToggleButtonVariant, IconButtonVariant };

interface CommonProps extends Omit<AriaButtonProps<'button'>, 'children' | 'elementType'> {
  /** XS 32px, S 40px (default), M 56px, L 96px, XL 136px tall. */
  size?: ButtonSize;
  /** Round (pill) is the default; square uses the size's square corner. */
  shape?: ButtonShape;
  /** Added to the root slot. Shorthand for `classNames={{ root: ... }}`. */
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
  /** Per-slot class overrides. A string is added; `{ replace }` drops the built-in classes. */
  classNames?: SlotOverrides<ButtonSlot>;
}

/**
 * M3E common button. Corners morph to the size's pressed radius on press
 * (on the default effects spring, so no bounce, as in Compose).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { defaults, slots, behavior, sizes } = useComponentConfig('Button');
  const {
    variant = defaults?.variant ?? 'filled',
    size = defaults?.size ?? 's',
    shape = defaults?.shape ?? 'round',
    icon,
    trailingIcon,
    children,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const spec = sizes.button[size];
  const resting = restingRadius(size, shape, sizes);
  const slot = (name: ButtonSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <ButtonBase
      ref={ref}
      {...rest}
      className={slot('root', 'grange-button', styles.button)}
      style={{ ...sizeCustomProperties(spec), ...style }}
      padding={spec.padding}
      touchTarget={spec.height < behavior.touchTargetBelow}
      cornerSpring={behavior.springs.press}
      corners={({ isPressed }) => uniform(isPressed ? spec.pressed : resting)}
      dataAttributes={{ 'data-variant': variant, 'data-size': size, 'data-shape': shape }}
    >
      {icon && <span className={slot('icon', 'grange-button-icon', styles.icon)}>{icon}</span>}
      {children != null && <span className={slot('label', 'grange-button-label', styles.label)}>{children}</span>}
      {trailingIcon && <span className={slot('icon', 'grange-button-icon', styles.icon)}>{trailingIcon}</span>}
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
  const { defaults, slots, behavior, sizes } = useComponentConfig('ToggleButton');
  const {
    variant = defaults?.variant ?? 'filled',
    size = defaults?.size ?? 's',
    shape = defaults?.shape ?? 'round',
    icon,
    selectedIcon,
    trailingIcon,
    children,
    className,
    classNames,
    style,
    isSelected,
    defaultSelected = false,
    onChange,
    onPress,
    ...rest
  } = props;

  const [selected, setSelected] = useControlledState(isSelected, defaultSelected, onChange);
  const spec = sizes.button[size];
  const radius = selected ? selectedRadius(size, shape, sizes) : restingRadius(size, shape, sizes);
  const shownIcon = selected && selectedIcon ? selectedIcon : icon;
  const slot = (name: ButtonSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <ButtonBase
      ref={ref}
      {...rest}
      aria-pressed={selected}
      onPress={(e: PressEvent) => {
        setSelected(!selected);
        onPress?.(e);
      }}
      className={slot('root', 'grange-button', styles.button)}
      style={{ ...sizeCustomProperties(spec), ...style }}
      padding={spec.padding}
      touchTarget={spec.height < behavior.touchTargetBelow}
      cornerSpring={behavior.springs.selection}
      corners={({ isPressed }) => uniform(isPressed ? spec.pressed : radius)}
      dataAttributes={{
        'data-variant': variant,
        'data-size': size,
        'data-shape': shape,
        'data-selected': String(selected),
      }}
    >
      {shownIcon && <span className={slot('icon', 'grange-button-icon', styles.icon)}>{shownIcon}</span>}
      {children != null && <span className={slot('label', 'grange-button-label', styles.label)}>{children}</span>}
      {trailingIcon && <span className={slot('icon', 'grange-button-icon', styles.icon)}>{trailingIcon}</span>}
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
  classNames?: SlotOverrides<IconButtonSlot>;
}

/**
 * M3E icon button, plain or toggle. Five sizes, three widths, round or square.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  const { defaults, slots, behavior, sizes } = useComponentConfig('IconButton');
  const {
    variant = defaults?.variant ?? 'standard',
    size = defaults?.size ?? 's',
    shape = defaults?.shape ?? 'round',
    width = defaults?.width ?? 'default',
    toggle = false,
    children,
    selectedIcon,
    className,
    classNames,
    style,
    isSelected,
    defaultSelected = false,
    onChange,
    onPress,
    ...rest
  } = props;

  const [selected, setSelected] = useControlledState(isSelected, defaultSelected, onChange);
  const spec = sizes.button[size];
  const isOn = toggle && selected;
  const radius = isOn ? selectedRadius(size, shape, sizes) : restingRadius(size, shape, sizes);
  const slot = (name: IconButtonSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <ButtonBase
      ref={ref}
      {...rest}
      aria-pressed={toggle ? selected : undefined}
      onPress={(e: PressEvent) => {
        if (toggle) setSelected(!selected);
        onPress?.(e);
      }}
      className={slot('root', 'grange-icon-button', `${styles.button} ${styles.iconButton}`)}
      style={{ ...sizeCustomProperties(spec, sizes.iconButtonIcon[size]), ...style }}
      padding={sizes.iconButtonPadding[size][width]}
      touchTarget={spec.height < behavior.touchTargetBelow}
      cornerSpring={toggle ? behavior.springs.selection : behavior.springs.press}
      corners={({ isPressed }) => uniform(isPressed ? spec.pressed : radius)}
      dataAttributes={{
        'data-variant': variant,
        'data-size': size,
        'data-shape': shape,
        'data-width': width,
        'data-selected': toggle ? String(selected) : undefined,
      }}
    >
      <span className={slot('icon', 'grange-button-icon', styles.icon)}>
        {isOn && selectedIcon ? selectedIcon : children}
      </span>
    </ButtonBase>
  );
});
