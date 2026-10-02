import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { AriaButtonProps, PressEvent } from 'react-aria';
import { ButtonBase, uniform, type GrangeButtonElement } from '../ButtonBase/ButtonBase';
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

/**
 * Props every button-like shares. Named after Material Web (`disabled`, `selected`, `toggle`)
 * rather than React Aria (`isDisabled`, `isSelected`), and mapped onto React Aria internally.
 * `onClick` and `onPress` both work: onClick fires on a real click, onPress also covers touch
 * and keyboard activation.
 */
interface CommonProps extends Omit<AriaButtonProps<'button' | 'a'>, 'children' | 'elementType' | 'isDisabled'> {
  /** XS 32px, S 40px (default), M 56px, L 96px, XL 136px tall. */
  size?: ButtonSize;
  /** Round (pill) is the default; square uses the size's square corner. */
  shape?: ButtonShape;
  disabled?: boolean;
  /**
   * Renders an `<a>` instead of a `<button>`, as Material Web's buttons do. It keeps the button
   * role and Space-to-activate, so what is announced matches how it behaves.
   */
  href?: string;
  /** Added to the root slot. Shorthand for `classNames={{ root: ... }}`. */
  className?: string;
  style?: CSSProperties;
}

interface SelectionProps {
  /** Controlled selected state. Pair with `onChange`; use `defaultSelected` to stay uncontrolled. */
  selected?: boolean;
  defaultSelected?: boolean;
  onChange?: (selected: boolean) => void;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export interface ButtonProps extends CommonProps {
  variant?: ButtonVariant;
  /** The icon (an SVG). One icon, placed before the label unless `trailingIcon` is set. */
  icon?: ReactNode;
  /** Moves `icon` after the label, like Material Web's `trailing-icon`. */
  trailingIcon?: boolean;
  children?: ReactNode;
  /** Per-slot class overrides. A string is added; `{ replace }` drops the built-in classes. */
  classNames?: SlotOverrides<ButtonSlot>;
}

/**
 * M3E common button. Corners morph to the size's pressed radius on press
 * (on the default effects spring, so no bounce, as in Compose).
 */
export const Button = forwardRef<GrangeButtonElement, ButtonProps>(function Button(props, ref) {
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
    disabled,
    ...rest
  } = props;

  const spec = sizes.button[size];
  const resting = restingRadius(size, shape, sizes);
  const slot = (name: ButtonSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);
  const iconNode = icon ? <span className={slot('icon', 'grange-button-icon', styles.icon)}>{icon}</span> : null;

  return (
    <ButtonBase
      ref={ref}
      {...rest}
      isDisabled={disabled}
      className={slot('root', 'grange-button', styles.button)}
      style={{ ...sizeCustomProperties(spec), ...style }}
      padding={spec.padding}
      touchTarget={spec.height < behavior.touchTargetBelow}
      cornerSpring={behavior.springs.press}
      corners={({ isPressed }) => uniform(isPressed ? spec.pressed : resting)}
      dataAttributes={{ 'data-variant': variant, 'data-size': size, 'data-shape': shape }}
    >
      {!trailingIcon && iconNode}
      {children != null && <span className={slot('label', 'grange-button-label', styles.label)}>{children}</span>}
      {trailingIcon && iconNode}
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
export const ToggleButton = forwardRef<GrangeButtonElement, ToggleButtonProps>(function ToggleButton(props, ref) {
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
    disabled,
    selected: selectedProp,
    defaultSelected = false,
    onChange,
    onPress,
    ...rest
  } = props;

  const [selected, setSelected] = useControlledState(selectedProp, defaultSelected, onChange);
  const spec = sizes.button[size];
  const radius = selected ? selectedRadius(size, shape, sizes) : restingRadius(size, shape, sizes);
  const shownIcon = selected && selectedIcon ? selectedIcon : icon;
  const slot = (name: ButtonSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);
  const iconNode = shownIcon ? (
    <span className={slot('icon', 'grange-button-icon', styles.icon)}>{shownIcon}</span>
  ) : null;

  return (
    <ButtonBase
      ref={ref}
      {...rest}
      aria-pressed={selected}
      isDisabled={disabled}
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
      {!trailingIcon && iconNode}
      {children != null && <span className={slot('label', 'grange-button-label', styles.label)}>{children}</span>}
      {trailingIcon && iconNode}
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
  /** Announced in place of `aria-label` while selected, like Material Web's `aria-label-selected`. */
  ariaLabelSelected?: string;
  classNames?: SlotOverrides<IconButtonSlot>;
}

/**
 * M3E icon button, plain or toggle. Five sizes, three widths, round or square.
 */
export const IconButton = forwardRef<GrangeButtonElement, IconButtonProps>(function IconButton(props, ref) {
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
    disabled,
    selected: selectedProp,
    defaultSelected = false,
    onChange,
    onPress,
    ariaLabelSelected,
    'aria-label': ariaLabel,
    ...rest
  } = props;

  const [selected, setSelected] = useControlledState(selectedProp, defaultSelected, onChange);
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
      aria-label={isOn && ariaLabelSelected ? ariaLabelSelected : ariaLabel}
      isDisabled={disabled}
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
