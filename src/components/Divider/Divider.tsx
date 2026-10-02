import { forwardRef, type CSSProperties } from 'react';
import { useSeparator } from 'react-aria';
import { resolveSlotClass, useComponentConfig, type DividerSlot, type SlotOverrides } from '../../config/config';
import styles from './Divider.module.scss';

export interface DividerProps {
  /** Horizontal by default. A vertical divider needs a parent with a height to stretch to. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Indents the divider so it lines up with the content beside it, rather than the container
   * edge: `true` indents both ends, `'start'` or `'end'` just one. Material Web's `inset`,
   * `inset-start` and `inset-end`.
   */
  inset?: boolean | 'start' | 'end';
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<DividerSlot>;
}

/**
 * A one pixel rule in the outline-variant role. Material Web ships this as `md-divider`.
 *
 * Rendered with React Aria's useSeparator, so it is announced as a separator and a vertical one
 * carries the right orientation rather than being a silent box.
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(props, ref) {
  const { defaults, slots } = useComponentConfig('Divider');
  const { orientation = 'horizontal', inset = defaults?.inset, className, classNames, style } = props;
  const { separatorProps } = useSeparator({ orientation });

  return (
    <div
      {...separatorProps}
      ref={ref}
      className={resolveSlotClass(
        'grange-divider',
        styles.divider,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={style}
      data-orientation={orientation}
      data-inset={inset === true ? 'both' : inset || undefined}
    />
  );
});
