import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { useLocale } from 'react-aria';
import { resolveSlotClass, useComponentConfig, type IconSlot, type SlotOverrides } from '../../config/config';
import styles from './Icon.module.scss';

export interface IconProps {
  /**
   * An inline SVG, or a Material Symbols ligature name as text (`<Icon>favorite</Icon>`).
   * The app loads the icon font itself, the same way it loads the typefaces.
   */
  children: ReactNode;
  /**
   * Box size in px. Defaults to the size of whatever control the icon sits in, which the
   * buttons publish as `--grange-icon-size`, and to 24 when there is none.
   */
  size?: number;
  /** Material Symbols FILL axis, for the filled version of the same glyph. */
  filled?: boolean;
  /** Mirrors the icon when the locale is right-to-left, like Material Web's `flip-icon-in-rtl`. */
  flipInRtl?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<IconSlot>;
  /**
   * Icons are decorative by default, because the control around them carries the name. Pass a
   * label only for an icon that is the whole meaning on its own.
   */
  'aria-label'?: string;
}

/**
 * Sizes and colors an icon. Material Web ships this as `md-icon`.
 *
 * Colour comes from `currentColor`, so an icon inside a button already matches the button's
 * content colour and its disabled and selected states without being told about them.
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(props, ref) {
  const { defaults, slots } = useComponentConfig('Icon');
  const {
    children,
    size = defaults?.size,
    filled,
    flipInRtl,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;
  const { direction } = useLocale();

  return (
    <span
      ref={ref}
      className={resolveSlotClass(
        'grange-icon',
        styles.icon,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={{
        ...(size !== undefined ? { ['--grange-icon-size' as string]: `${size}px` } : null),
        ...style,
      }}
      data-filled={filled || undefined}
      data-flip={flipInRtl && direction === 'rtl' ? 'rtl' : undefined}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {children}
    </span>
  );
});
