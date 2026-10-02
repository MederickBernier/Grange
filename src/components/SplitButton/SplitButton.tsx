import { createContext, forwardRef, useContext, type CSSProperties, type ReactNode } from 'react';
import { useLocale, type AriaButtonProps } from 'react-aria';
import { ButtonBase, type CornerRadii, type GrangeButtonElement } from '../ButtonBase/ButtonBase';
import {
  resolveSlotClass,
  useComponentConfig,
  type ButtonSlot,
  type GroupSlot,
  type IconButtonSlot,
  type SlotOverrides,
} from '../../config/config';
import { buttonSizes, type ButtonSize, type ToggleButtonVariant } from '../Button/specs';
import buttonStyles from '../Button/Button.module.scss';
import { splitButtonSizes } from './specs';
import styles from './SplitButton.module.scss';

interface SplitContextValue {
  size: ButtonSize;
  variant: ToggleButtonVariant;
}

const SplitContext = createContext<SplitContextValue | null>(null);

function useSplitContext(component: string) {
  const context = useContext(SplitContext);
  if (!context) throw new Error(`${component} must be inside a SplitButton`);
  return context;
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export interface SplitButtonProps {
  /** A SplitButtonLeading and a SplitButtonTrailing. */
  children: ReactNode;
  size?: ButtonSize;
  variant?: ToggleButtonVariant;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<GroupSlot>;
  'aria-label'?: string;
}

/**
 * An action paired with a menu button for its alternatives. New in M3 Expressive, replacing a
 * button with a chevron glued to it.
 *
 * The two buttons sit 2px apart. Their outer corners are full and the corners where they meet
 * are tight, and those inner corners grow while hovered or pressed rather than shrinking the way
 * a plain button's do. Size and colour live here so the two halves cannot disagree.
 */
export function SplitButton(props: SplitButtonProps) {
  const { defaults, slots } = useComponentConfig('SplitButton');
  const {
    children,
    size = defaults?.size ?? 's',
    variant = defaults?.variant ?? 'filled',
    className,
    classNames,
    style,
    ...aria
  } = props;

  const spec = splitButtonSizes[size];

  return (
    <div
      role="group"
      {...aria}
      className={resolveSlotClass(
        'grange-split-button',
        styles.group,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={{ gap: spec.between, ...style }}
    >
      <SplitContext.Provider value={{ size, variant }}>{children}</SplitContext.Provider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leading half: the action
// ---------------------------------------------------------------------------

type HalfProps = Omit<AriaButtonProps<'button' | 'a'>, 'children' | 'elementType' | 'isDisabled'>;

export interface SplitButtonLeadingProps extends HalfProps {
  children?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  href?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ButtonSlot>;
}

export const SplitButtonLeading = forwardRef<GrangeButtonElement, SplitButtonLeadingProps>(
  function SplitButtonLeading(props, ref) {
    const { slots, behavior } = useComponentConfig('SplitButtonLeading');
    const { children, icon, disabled, className, classNames, style, ...rest } = props;
    const { size, variant } = useSplitContext('SplitButtonLeading');
    const { direction } = useLocale();

    const spec = splitButtonSizes[size];
    const full = spec.height / 2;
    const slot = (name: ButtonSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    const corners = ({ isPressed }: { isPressed: boolean }): CornerRadii => {
      const inner = isPressed ? spec.innerCornerActive : spec.innerCorner;
      return mapCorners(direction, full, inner);
    };

    return (
      <ButtonBase
        ref={ref}
        {...rest}
        isDisabled={disabled}
        className={slot('root', 'grange-split-button-leading', `${buttonStyles.button} ${styles.half}`)}
        style={{
          ['--_height' as string]: `${spec.height}px`,
          ['--grange-icon-size' as string]: `${buttonSizes[size].icon}px`,
          ['--_gap' as string]: `${buttonSizes[size].gap}px`,
          ...style,
        }}
        padding={{ start: spec.leadingStart, end: spec.leadingEnd }}
        touchTarget={spec.height < behavior.touchTargetBelow}
        cornerSpring={behavior.springs.press}
        corners={corners}
        dataAttributes={{ 'data-variant': variant, 'data-size': size, 'data-half': 'leading' }}
      >
        {icon && <span className={slot('icon', 'grange-button-icon', buttonStyles.icon)}>{icon}</span>}
        {children != null && (
          <span className={slot('label', 'grange-button-label', buttonStyles.label)}>{children}</span>
        )}
      </ButtonBase>
    );
  },
);

// ---------------------------------------------------------------------------
// Trailing half: the menu button
// ---------------------------------------------------------------------------

export interface SplitButtonTrailingProps extends HalfProps {
  /** The chevron, or whatever marks "more". Rotates a half turn while expanded. */
  children: ReactNode;
  'aria-label': string;
  /** True while the menu it controls is open. Rounds the inner corner fully and spins the icon. */
  expanded?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<IconButtonSlot>;
}

export const SplitButtonTrailing = forwardRef<GrangeButtonElement, SplitButtonTrailingProps>(
  function SplitButtonTrailing(props, ref) {
    const { slots, behavior } = useComponentConfig('SplitButtonTrailing');
    const { children, expanded = false, disabled, className, classNames, style, ...rest } = props;
    const { size, variant } = useSplitContext('SplitButtonTrailing');
    const { direction } = useLocale();

    const spec = splitButtonSizes[size];
    const full = spec.height / 2;
    const slot = (name: IconButtonSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    // Expanded takes the inner corner all the way round, which is the token's 50 percent.
    const corners = ({ isPressed }: { isPressed: boolean }): CornerRadii => {
      const inner = expanded ? full : isPressed ? spec.innerCornerActive : spec.innerCorner;
      // Mirrored: for the trailing half the inner corner is on the start side.
      return mapCorners(direction === 'rtl' ? 'ltr' : 'rtl', full, inner);
    };

    return (
      <ButtonBase
        ref={ref}
        {...rest}
        isDisabled={disabled}
        aria-expanded={expanded}
        aria-haspopup="menu"
        className={slot('root', 'grange-split-button-trailing', `${buttonStyles.button} ${styles.half}`)}
        style={{
          ['--_height' as string]: `${spec.height}px`,
          ['--grange-icon-size' as string]: `${spec.trailingIcon}px`,
          ...style,
        }}
        padding={spec.trailingSide}
        touchTarget={spec.height < behavior.touchTargetBelow}
        cornerSpring={behavior.springs.selection}
        corners={corners}
        dataAttributes={{
          'data-variant': variant,
          'data-size': size,
          'data-half': 'trailing',
          'data-expanded': String(expanded),
        }}
      >
        <span className={slot('icon', 'grange-button-icon', styles.chevron)}>{children}</span>
      </ButtonBase>
    );
  },
);

/**
 * Full on the outside, tight where the halves meet. Motion animates the physical radii, so which
 * side counts as "inner" is resolved here rather than by the cascade.
 */
function mapCorners(direction: string, full: number, inner: number): CornerRadii {
  return direction === 'rtl'
    ? { topLeft: inner, bottomLeft: inner, topRight: full, bottomRight: full }
    : { topLeft: full, bottomLeft: full, topRight: inner, bottomRight: inner };
}
