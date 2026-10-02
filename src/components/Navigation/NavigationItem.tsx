import { forwardRef, useRef, type CSSProperties, type ReactNode } from 'react';
import { useFocusRing, useHover, useObjectRef, usePress } from 'react-aria';
import { Ripple, type RippleHandle } from '../../primitives/Ripple';
import { useGrangeConfig } from '../../config/config';
import styles from './Navigation.module.scss';

export interface NavigationItemProps {
  /** The label. */
  children: ReactNode;
  icon: ReactNode;
  /** Shown while this destination is the current one, typically the filled glyph. */
  selectedIcon?: ReactNode;
  /** A badge on the icon, for a count or a dot. */
  badge?: ReactNode;
  /** Marks this as the destination currently shown, which is announced as the current page. */
  selected?: boolean;
  onClick?: () => void;
  /** Renders a link rather than a button, which is right for real navigation. */
  href?: string;
  disabled?: boolean;
  /** Hides the label, leaving the icon. The bar keeps the label by default; the rail may not. */
  hideLabel?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * One destination, shared by the bar and the rail because the tokens colour them identically.
 *
 * Not built on ButtonBase: the state layer and the ripple belong to the indicator pill rather
 * than the whole item, which is how the spec draws it, and ButtonBase puts them across the
 * element it is given.
 *
 * Marked with aria-current rather than aria-selected, because this is navigation and not a
 * tablist: the item leads somewhere rather than switching a panel in place.
 */
export const NavigationItem = forwardRef<HTMLElement, NavigationItemProps>(
  function NavigationItem(props, forwardedRef) {
    const {
      children,
      icon,
      selectedIcon,
      badge,
      selected,
      onClick,
      href,
      disabled,
      hideLabel,
      className,
      style,
    } = props;

    const { behavior } = useGrangeConfig();
    const ref = useObjectRef(forwardedRef);
    const ripple = useRef<RippleHandle>(null);

    const { pressProps, isPressed } = usePress({
      isDisabled: disabled,
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

    const shownIcon = selected && selectedIcon ? selectedIcon : icon;
    const Element = href ? 'a' : 'button';

    return (
      <Element
        {...pressProps}
        {...hoverProps}
        {...focusProps}
        ref={ref as never}
        className={`grange-navigation-item ${styles.item} ${className ?? ''}`}
        style={style}
        href={href}
        type={href ? undefined : 'button'}
        aria-current={selected ? 'page' : undefined}
        aria-disabled={disabled || undefined}
        data-selected={selected || undefined}
        data-disabled={disabled || undefined}
        data-hovered={isHovered || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-pressed={isPressed || undefined}
      >
        {/* The indicator carries the state layer and the ripple, as the spec draws it. */}
        <span className={styles.indicator}>
          <span className="grange-state-layer" aria-hidden="true" />
          {behavior.ripple.enabled && <Ripple ref={ripple} />}
          <span className={styles.icon}>{shownIcon}</span>
          {badge && <span className={styles.badge}>{badge}</span>}
        </span>
        {!hideLabel && <span className={styles.label}>{children}</span>}
      </Element>
    );
  },
);
