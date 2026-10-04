import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { AriaButtonProps } from 'react-aria';
import { ButtonBase, uniform, type GrangeButtonElement } from '../ButtonBase/ButtonBase';
import { resolveSlotClass, useComponentConfig, type CardSlot, type SlotOverrides } from '../../config/config';
import { card as spec, type CardVariant } from './specs';
import styles from './Card.module.scss';

export type { CardVariant };

interface CardOwnProps {
  children?: ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<CardSlot>;
}

export interface CardProps
  extends CardOwnProps, Omit<AriaButtonProps<'button' | 'a'>, 'children' | 'elementType' | 'isDisabled'> {
  /**
   * Makes the whole card the click target, which brings the state layer, the ripple and a focus
   * ring with it.
   *
   * A card that already holds its own buttons should not also be clickable: the spec says to
   * pick one, and nesting controls inside a control is both ambiguous to use and invalid markup.
   */
  onClick?: AriaButtonProps<'button'>['onClick'];
  href?: string;
  disabled?: boolean;
}

/**
 * A card: elevated, filled or outlined. All three share the 12px corner and differ in how they
 * separate from the surface, which is elevation for the first, a fill for the second and a
 * hairline for the third.
 *
 * Plain content by default. Given an onClick or an href it goes through ButtonBase instead, so
 * an interactive card gets the same press, hover, focus and ripple treatment as a button.
 */
export const Card = forwardRef<GrangeButtonElement | HTMLDivElement, CardProps>(function Card(props, ref) {
  const { defaults, slots, behavior } = useComponentConfig('Card');
  const {
    children,
    variant = defaults?.variant ?? 'elevated',
    disabled,
    className,
    classNames,
    style,
    onClick,
    href,
    ...rest
  } = props;

  const interactive = Boolean(onClick || href);
  const root = resolveSlotClass(
    'grange-card',
    styles.card,
    ...(slots?.root ?? []),
    classNames?.root,
    className,
  );
  const dataAttributes = {
    'data-variant': variant,
    'data-interactive': interactive ? 'true' : undefined,
  };

  if (!interactive) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={root}
        style={style}
        data-disabled={disabled || undefined}
        {...dataAttributes}
      >
        {children}
      </div>
    );
  }

  return (
    <ButtonBase
      ref={ref as React.Ref<GrangeButtonElement>}
      {...rest}
      onClick={onClick}
      href={href}
      isDisabled={disabled}
      className={root}
      style={style}
      padding={spec.padding}
      cornerSpring={behavior.springs.press}
      corners={() => uniform(spec.corner)}
      dataAttributes={dataAttributes}
    >
      {children}
    </ButtonBase>
  );
});
