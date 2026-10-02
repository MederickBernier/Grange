import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { resolveSlotClass, useComponentConfig, type BadgeSlot, type SlotOverrides } from '../../config/config';
import styles from './Badge.module.scss';

export interface BadgeProps {
  /**
   * A count or short label. Without one it is a bare 6px dot, which says there is something new
   * without saying how much.
   */
  children?: ReactNode;
  /**
   * What assistive tech should hear. A badge is usually decoration beside something already
   * named, in which case leave this out and it is hidden; give it a label only when the badge is
   * the only thing carrying the information.
   */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<BadgeSlot>;
}

/**
 * A small count or dot, for marking something as having news.
 *
 * Hidden from assistive tech unless labelled: a "9" floating beside an already-named icon reads
 * as noise, and the count usually belongs in the label of whatever it is attached to.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(props, ref) {
  const { slots } = useComponentConfig('Badge');
  const { children, className, classNames, style, 'aria-label': ariaLabel } = props;
  const labelled = children != null && children !== '';

  return (
    <span
      ref={ref}
      className={resolveSlotClass(
        'grange-badge',
        styles.badge,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={style}
      data-dot={labelled ? undefined : 'true'}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'status' : undefined}
    >
      {children}
    </span>
  );
});
