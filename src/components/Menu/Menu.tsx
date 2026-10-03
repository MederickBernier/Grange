import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useMenu, useMenuItem, useMenuSection, useMenuTrigger } from 'react-aria';
import {
  Item,
  Section,
  useMenuTriggerState,
  useTreeState,
  type TreeProps,
  type TreeState,
} from 'react-stately';

/**
 * Derived from React Aria's own types rather than imported from @react-types/shared, which is
 * only a transitive package here and would have to be declared to resolve under pnpm.
 */
type CollectionNode = TreeState<unknown>['collection'] extends Iterable<infer N> ? N : never;
type CollectionChildren = TreeProps<unknown>['children'];
/** React Aria's own Key, which is narrower than React's: no bigint. */
type Key = NonNullable<TreeProps<unknown>['disabledKeys']> extends Iterable<infer K> ? K : never;
/** Their Selection, which is a set of keys or the string "all". */
type Selection = NonNullable<TreeProps<unknown>['onSelectionChange']> extends (keys: infer S) => void
  ? S
  : never;
import { Popover } from '../../overlays/Popover';
import { resolveSlotClass, useComponentConfig, type MenuSlot, type SlotOverrides } from '../../config/config';
import styles from './Menu.module.scss';

export interface MenuItemProps {
  /**
   * The label.
   *
   * The item is identified by its React `key`, not by a prop: `<MenuItem key="edit">`. That is
   * the key `onAction`, `selectedKeys` and `disabledKeys` all speak in. It reads oddly for a
   * React API, but it is how this collection builder reads items without rendering them, which
   * is what pays for typeahead and keyboard navigation.
   */
  children: ReactNode;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Trailing text, usually a keyboard shortcut. */
  trailingText?: string;
  /** A second line under the label. */
  supportingText?: ReactNode;
  isDisabled?: boolean;
  /** What typeahead matches on, when the label is not plain text. */
  textValue?: string;
}

/**
 * One row. It describes an item rather than rendering one: the Menu reads these off the
 * collection and draws the rows itself, which is how React Aria's collections give typeahead and
 * keyboard navigation over children it can inspect ahead of time.
 */
export const MenuItem = Item as (props: MenuItemProps) => ReactElement;

export interface MenuSectionProps {
  /** The heading. */
  title?: ReactNode;
  children: ReactNode;
}

/** A titled group of items, separated from its neighbours. */
export const MenuSection = Section as unknown as (props: MenuSectionProps) => ReactElement;

export interface MenuProps {
  /** MenuItem and MenuSection children, which the collection reads rather than renders. */
  children: CollectionChildren;
  /** Fired with the item's id when one is chosen. */
  onAction?: (key: Key) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Iterable<Key>;
  defaultSelectedKeys?: Iterable<Key>;
  onSelectionChange?: (keys: Selection) => void;
  disabledKeys?: Iterable<Key>;
  /**
   * The M3 Expressive restyles. `standard` sits on the low surface and moves selection onto the
   * tertiary container; `vibrant` makes the whole surface the tertiary container. Both are
   * colour only — the geometry is the same menu.
   */
  variant?: 'default' | 'standard' | 'vibrant';
  /**
   * Which item takes focus when it appears. `MenuTrigger` handles this itself; a menu opened
   * some other way — at a pointer, say — has to say so, or the arrows and Escape do nothing
   * because focus never entered it.
   */
  autoFocus?: boolean | 'first' | 'last';
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<MenuSlot>;
}

/**
 * The menu surface and its rows. Use it inside a MenuTrigger, which owns the open state and the
 * anchoring.
 *
 * useMenu brings the keyboard: the arrows move, Home and End jump, typing jumps to a matching
 * label, and Escape closes. Selection is optional, so the same component covers a list of
 * actions and a set of choices.
 */
export function Menu(props: MenuProps) {
  const { defaults, slots } = useComponentConfig('Menu');
  const { children, className, classNames, style, variant = defaults?.variant ?? 'default', ...rest } = props;

  const state = useTreeState({ ...rest, children, selectionMode: rest.selectionMode ?? 'none' });
  const ref = useRef<HTMLUListElement>(null);
  const { menuProps } = useMenu(rest, state, ref);

  const slot = (name: MenuSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <ul
      {...menuProps}
      ref={ref}
      className={slot('root', 'grange-menu', styles.menu)}
      style={style}
      data-variant={variant}
    >
      {[...state.collection].map((item) =>
        item.type === 'section' ? (
          <MenuSectionRows key={item.key} section={item} state={state} itemClass={slot('item', 'grange-menu-item', styles.item)} />
        ) : (
          <MenuRow
            key={item.key}
            item={item}
            state={state}
            className={slot('item', 'grange-menu-item', styles.item)}
          />
        ),
      )}
    </ul>
  );
}

function MenuSectionRows({
  section,
  state,
  itemClass,
}: {
  section: CollectionNode;
  state: TreeState<unknown>;
  itemClass: string;
}) {
  const { itemProps, headingProps, groupProps } = useMenuSection({
    heading: section.rendered,
    'aria-label': section['aria-label'],
  });

  return (
    <li {...itemProps} className={styles.section}>
      {section.rendered && (
        <span {...headingProps} className={styles.sectionHeading}>
          {section.rendered}
        </span>
      )}
      <ul {...groupProps} className={styles.sectionList}>
        {[...section.childNodes].map((item) => (
          <MenuRow key={item.key} item={item} state={state} className={itemClass} />
        ))}
      </ul>
    </li>
  );
}

function MenuRow({
  item,
  state,
  className,
}: {
  item: CollectionNode;
  state: TreeState<unknown>;
  className: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { menuItemProps, isSelected, isDisabled, isFocused } = useMenuItem({ key: item.key }, state, ref);
  const props = item.props as MenuItemProps;

  return (
    <li
      {...menuItemProps}
      ref={ref}
      className={className}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
      data-focused={isFocused || undefined}
      data-two-line={props.supportingText ? 'true' : undefined}
    >
      {props.icon && <span className={styles.icon}>{props.icon}</span>}
      <span className={styles.text}>
        <span className={styles.label}>{item.rendered}</span>
        {props.supportingText && <span className={styles.supporting}>{props.supportingText}</span>}
      </span>
      {props.trailingText && <span className={styles.trailingText}>{props.trailingText}</span>}
      {props.trailingIcon && <span className={styles.icon}>{props.trailingIcon}</span>}
    </li>
  );
}

export interface MenuTriggerProps {
  /** Exactly two children: the trigger, then the Menu it opens. */
  children: [ReactElement, ReactElement];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: 'top' | 'bottom' | 'start' | 'end';
}

/**
 * Wires a trigger to a menu: opens on press or on the down arrow, anchors the surface, flips it
 * when there is no room, and sends focus into the menu and back out again.
 */
export function MenuTrigger({ children, placement = 'bottom', ...rest }: MenuTriggerProps) {
  const [trigger, menu] = Children.toArray(children) as ReactElement[];
  const state = useMenuTriggerState({
    isOpen: rest.open,
    defaultOpen: rest.defaultOpen,
    onOpenChange: rest.onOpenChange,
  });
  const triggerRef = useRef<HTMLElement>(null);
  const { menuTriggerProps, menuProps } = useMenuTrigger({}, state, triggerRef);

  if (!isValidElement(trigger) || !isValidElement(menu)) {
    throw new Error('MenuTrigger expects a trigger element followed by a Menu');
  }

  return (
    <>
      {cloneElement(trigger, { ...menuTriggerProps, ref: triggerRef } as never)}
      {state.isOpen && (
        <Popover state={state} triggerRef={triggerRef} placement={placement} className={styles.popover}>
          {cloneElement(menu, menuProps as never)}
        </Popover>
      )}
    </>
  );
}
