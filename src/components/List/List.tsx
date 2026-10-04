import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { AriaButtonProps } from 'react-aria';
import { ButtonBase, uniform, type GrangeButtonElement } from '../ButtonBase/ButtonBase';
import { resolveSlotClass, useComponentConfig, type ListSlot, type SlotOverrides } from '../../config/config';
import styles from './List.module.scss';

export interface ListProps {
  /** ListItem children. */
  children: ReactNode;
  /** Rounds and insets the list as its own surface, which M3 does inside a card or a sheet. */
  contained?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ListSlot>;
}

/**
 * A list of rows.
 *
 * Plain semantic markup, because a list row is content rather than a control. For a list of
 * options use `Select`, for a list of actions use `Menu`, and for a selectable list put a
 * `Checkbox` or a `Radio` in a row's slot, which is how the spec draws list selection.
 */
export const List = forwardRef<HTMLUListElement, ListProps>(function List(props, ref) {
  const { slots } = useComponentConfig('List');
  const { children, contained, className, classNames, style, ...aria } = props;

  return (
    <ul
      {...aria}
      ref={ref}
      className={resolveSlotClass(
        'grange-list',
        styles.list,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={style}
      data-contained={contained || undefined}
    >
      {children}
    </ul>
  );
});

export interface ListItemProps extends Omit<
  AriaButtonProps<'button' | 'a'>,
  'children' | 'elementType' | 'isDisabled'
> {
  /** The row's main line. */
  children: ReactNode;
  /** A second line under it. */
  supportingText?: ReactNode;
  /** A third line, which takes the row to its tallest height. */
  overline?: ReactNode;
  /** An icon, avatar, checkbox or anything else at the start of the row. */
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Trailing text, such as a timestamp. */
  trailingText?: ReactNode;
  /** Makes the whole row a button; an href makes it a link instead. */
  onClick?: AriaButtonProps<'button'>['onClick'];
  href?: string;
  disabled?: boolean;
  /** Tints the row, for the current page in a navigation list. */
  selected?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ListSlot>;
}

/**
 * One row. Content by default; given an onClick or an href the row itself becomes the control,
 * which is what a navigation list wants.
 *
 * A row holding its own controls, a checkbox or a trailing button, should not also be clickable,
 * for the same reason a card should not: nesting a control inside a control is ambiguous to use
 * and invalid markup besides.
 */
export const ListItem = forwardRef<GrangeButtonElement | HTMLLIElement, ListItemProps>(
  function ListItem(props, ref) {
    const { slots, behavior } = useComponentConfig('ListItem');
    const {
      children,
      supportingText,
      overline,
      leading,
      trailing,
      trailingText,
      onClick,
      href,
      disabled,
      selected,
      className,
      classNames,
      style,
      ...rest
    } = props;

    const lines = overline != null ? 3 : supportingText != null ? 2 : 1;
    const interactive = Boolean(onClick || href);

    const slot = (name: ListSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    const inner = (
      <>
        {leading && <span className={styles.leading}>{leading}</span>}
        <span className={styles.text}>
          {overline != null && <span className={styles.overline}>{overline}</span>}
          <span className={slot('label', 'grange-list-item-label', styles.label)}>{children}</span>
          {supportingText != null && <span className={styles.supporting}>{supportingText}</span>}
        </span>
        {trailingText != null && <span className={styles.trailingText}>{trailingText}</span>}
        {trailing && <span className={styles.trailing}>{trailing}</span>}
      </>
    );

    const dataAttributes = {
      'data-lines': String(lines),
      'data-selected': selected ? 'true' : undefined,
      'data-interactive': interactive ? 'true' : undefined,
    };

    if (!interactive) {
      return (
        <li
          ref={ref as React.Ref<HTMLLIElement>}
          className={slot('item', 'grange-list-item', styles.item)}
          style={style}
          data-disabled={disabled || undefined}
          {...dataAttributes}
        >
          {inner}
        </li>
      );
    }

    // The row is the control, so the button goes inside the li rather than around it: a list's
    // children have to stay list items for the list to still be a list.
    return (
      <li className={styles.itemWrapper} data-lines={String(lines)}>
        <ButtonBase
          ref={ref as React.Ref<GrangeButtonElement>}
          {...rest}
          onClick={onClick}
          href={href}
          isDisabled={disabled}
          className={slot('item', 'grange-list-item', styles.item)}
          style={style}
          padding={0}
          cornerSpring={behavior.springs.press}
          corners={() => uniform(0)}
          dataAttributes={dataAttributes}
        >
          {inner}
        </ButtonBase>
      </li>
    );
  },
);
