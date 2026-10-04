import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { AriaButtonProps } from 'react-aria';
import { ButtonBase, uniform, type GrangeButtonElement } from '../ButtonBase/ButtonBase';
import {
  resolveSlotClass,
  useComponentConfig,
  type IconButtonSlot,
  type SlotOverrides,
} from '../../config/config';
import { fabSizes, type FabSize, type FabVariant } from './specs';
import styles from './Fab.module.scss';

export type { FabSize, FabVariant };

export interface FabProps extends Omit<
  AriaButtonProps<'button' | 'a'>,
  'children' | 'elementType' | 'isDisabled'
> {
  /** The icon. An aria-label is required, since a FAB carries no visible text. */
  children: ReactNode;
  'aria-label': string;
  /** 40, 56 (default), 80 or 96px square. */
  size?: FabSize;
  variant?: FabVariant;
  disabled?: boolean;
  href?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<IconButtonSlot>;
}

/**
 * The floating action button: the one action a screen is for.
 *
 * Elevation follows the tokens rather than the other buttons: level 3 at rest and when focused
 * or pressed, level 4 on hover. It does not morph its corners on press, because Compose
 * publishes no pressed shape for a FAB.
 */
export const Fab = forwardRef<GrangeButtonElement, FabProps>(function Fab(props, ref) {
  const { defaults, slots, behavior } = useComponentConfig('Fab');
  const {
    children,
    size = defaults?.size ?? 'baseline',
    variant = defaults?.variant ?? 'primary',
    disabled,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const spec = fabSizes[size];
  const slot = (name: IconButtonSlot, hook: string, builtIn?: string) =>
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
      className={slot('root', 'grange-fab', styles.fab)}
      style={{
        ['--_size' as string]: `${spec.size}px`,
        ['--grange-icon-size' as string]: `${spec.icon}px`,
        ...style,
      }}
      padding={0}
      touchTarget={spec.size < behavior.touchTargetBelow}
      cornerSpring={behavior.springs.press}
      corners={() => uniform(spec.corner)}
      dataAttributes={{ 'data-size': size, 'data-variant': variant }}
    >
      <span className={slot('icon', 'grange-button-icon', styles.icon)}>{children}</span>
    </ButtonBase>
  );
});
