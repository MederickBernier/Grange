import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useObjectRef, useToolbar } from 'react-aria';
import { resolveSlotClass, useComponentConfig, type GroupSlot, type SlotOverrides } from '../../config/config';
import { dockedToolbar, floatingToolbar } from './specs';
import styles from './Toolbar.module.scss';

export type ToolbarOrientation = 'horizontal' | 'vertical';

/** Standard sits on a surface colour; vibrant fills with the primary container and restyles its buttons. */
export type FloatingToolbarVariant = 'standard' | 'vibrant';

interface ToolbarBaseProps {
  children: ReactNode;
  /** One of aria-label or aria-labelledby, so the toolbar is announced with a name. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<GroupSlot>;
}

export interface FloatingToolbarProps extends ToolbarBaseProps {
  variant?: FloatingToolbarVariant;
  orientation?: ToolbarOrientation;
}

/**
 * A rounded bar of actions that floats above the content. New in M3 Expressive.
 *
 * Where it floats is left to the app, since that is a layout decision; the spec's 16px gap from
 * the screen edge is published as `--grange-floating-toolbar-inset` to use for it.
 *
 * Keyboard handling is React Aria's: the arrows move between items and reverse in a
 * right-to-left locale, Tab leaves the toolbar rather than walking through it, and returning
 * focus lands back on the item you left.
 */
export const FloatingToolbar = forwardRef<HTMLDivElement, FloatingToolbarProps>(
  function FloatingToolbar(props, forwardedRef) {
    const { defaults, slots } = useComponentConfig('FloatingToolbar');
    const {
      children,
      variant = defaults?.variant ?? 'standard',
      orientation = defaults?.orientation ?? 'horizontal',
      className,
      classNames,
      style,
      ...aria
    } = props;

    const ref = useObjectRef(forwardedRef);
    const { toolbarProps } = useToolbar({ ...aria, orientation }, ref);

    return (
      <div
        {...toolbarProps}
        ref={ref}
        className={resolveSlotClass(
          'grange-floating-toolbar',
          styles.floating,
          ...(slots?.root ?? []),
          classNames?.root,
          className,
        )}
        style={style}
        data-variant={variant}
        data-orientation={orientation}
      >
        {children}
      </div>
    );
  },
);

export interface DockedToolbarProps extends ToolbarBaseProps {}

/**
 * A full-width bar of actions attached to an edge, with square corners. New in M3 Expressive.
 *
 * Items spread to fill the bar within the bounds the tokens give, never closer than 4px and
 * never further than 32px apart. That is done with flexible spacers between the items rather
 * than `space-between`, which has no upper bound and would drift apart on a wide screen.
 */
export const DockedToolbar = forwardRef<HTMLDivElement, DockedToolbarProps>(
  function DockedToolbar(props, forwardedRef) {
    const { slots } = useComponentConfig('DockedToolbar');
    const { children, className, classNames, style, ...aria } = props;

    const ref = useObjectRef(forwardedRef);
    const { toolbarProps } = useToolbar({ ...aria, orientation: 'horizontal' }, ref);
    const items = Children.toArray(children).filter(isValidElement);

    return (
      <div
        {...toolbarProps}
        ref={ref}
        className={resolveSlotClass(
          'grange-docked-toolbar',
          styles.docked,
          ...(slots?.root ?? []),
          classNames?.root,
          className,
        )}
        style={style}
      >
        {items.map((child, index) => (
          <Fragment key={child.key ?? index}>
            {index > 0 && <span className={`grange-toolbar-spacer ${styles.spacer}`} aria-hidden="true" />}
            {child}
          </Fragment>
        ))}
      </div>
    );
  },
);
