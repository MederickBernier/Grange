import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { AriaButtonProps } from 'react-aria';
import { ButtonBase, uniform, type GrangeButtonElement } from '../ButtonBase/ButtonBase';
import {
  resolveSlotClass,
  useComponentConfig,
  type ButtonSlot,
  type SlotOverrides,
} from '../../config/config';
import { collapsedPadding, extendedFabSizes, type ExtendedFabSize, type FabVariant } from './specs';
import styles from './Fab.module.scss';

export type { ExtendedFabSize };

export interface ExtendedFabProps
  extends Omit<AriaButtonProps<'button' | 'a'>, 'children' | 'elementType' | 'isDisabled'> {
  /** The label. Hidden while collapsed, which is why aria-label is still worth setting. */
  children: ReactNode;
  icon?: ReactNode;
  /** 56, 80 or 96px tall. Note an extended `small` is the height of a plain FAB's `baseline`. */
  size?: ExtendedFabSize;
  variant?: FabVariant;
  /**
   * Drops the resting elevation from level 3 to level 1, for a FAB on a surface that is already
   * raised. From the Lowered* elevations in ExtendedFabPrimaryTokens.
   */
  lowered?: boolean;
  /**
   * Hides the label and squares the container off, which lands on exactly the plain FAB of the
   * same height. The width change rides the padding spring, so it animates.
   */
  collapsed?: boolean;
  disabled?: boolean;
  href?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ButtonSlot>;
}

/**
 * A FAB wide enough to say what it does. Three sizes, the same four colour options as the plain
 * FAB, and a lowered elevation for raised surfaces.
 */
export const ExtendedFab = forwardRef<GrangeButtonElement, ExtendedFabProps>(
  function ExtendedFab(props, ref) {
    const { defaults, slots, behavior } = useComponentConfig('ExtendedFab');
    const {
      children,
      icon,
      size = defaults?.size ?? 'small',
      variant = defaults?.variant ?? 'primary',
      lowered = defaults?.lowered ?? false,
      collapsed = false,
      disabled,
      className,
      classNames,
      style,
      ...rest
    } = props;

    const spec = extendedFabSizes[size];
    const slot = (name: ButtonSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    return (
      <ButtonBase
        ref={ref}
        {...rest}
        isDisabled={disabled}
        className={slot('root', 'grange-extended-fab', `${styles.fab} ${styles.extended}`)}
        style={{
          ['--_height' as string]: `${spec.height}px`,
          ['--_gap' as string]: `${spec.gap}px`,
          ['--grange-icon-size' as string]: `${spec.icon}px`,
          ...style,
        }}
        padding={collapsed ? collapsedPadding(spec) : spec.padding}
        touchTarget={spec.height < behavior.touchTargetBelow}
        cornerSpring={behavior.springs.press}
        corners={() => uniform(spec.corner)}
        dataAttributes={{
          'data-size': size,
          'data-variant': variant,
          'data-lowered': lowered ? 'true' : undefined,
          'data-collapsed': collapsed ? 'true' : undefined,
        }}
      >
        {icon && <span className={slot('icon', 'grange-button-icon', styles.icon)}>{icon}</span>}
        {!collapsed && (
          <span className={slot('label', 'grange-button-label', styles.label)}>{children}</span>
        )}
      </ButtonBase>
    );
  },
);
