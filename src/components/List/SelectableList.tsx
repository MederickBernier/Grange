import { useMemo, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { ListKeyboardDelegate, useCollator, useListBox, useLocale, useOption } from 'react-aria';
import { Item, useListState, type ListProps as StatelyListProps, type ListState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type SelectableListSlot,
  type SlotOverrides,
} from '../../config/config';
import listStyles from './List.module.scss';
import styles from './SelectableList.module.scss';

/**
 * Derived from React Aria's own types rather than imported from @react-types/shared, which is
 * only a transitive package here and would have to be declared to resolve under pnpm.
 */
type CollectionNode = ListState<unknown>['collection'] extends Iterable<infer N> ? N : never;
type CollectionChildren = StatelyListProps<unknown>['children'];
type Key = NonNullable<StatelyListProps<unknown>['disabledKeys']> extends Iterable<infer K> ? K : never;
type Selection = NonNullable<StatelyListProps<unknown>['onSelectionChange']> extends (keys: infer S) => void
  ? S
  : never;

export interface SelectableListItemProps {
  /**
   * The row's main line.
   *
   * The row is identified by its React `key`, not by a prop: `<SelectableListItem key="ada">`.
   * That is the key `selectedKeys`, `disabledKeys` and `onAction` all speak in, and it is this
   * collection builder's convention rather than a choice made here.
   */
  children: ReactNode;
  /** A second line under it. */
  supportingText?: ReactNode;
  /** A third line, which takes the row to its tallest height. */
  overline?: ReactNode;
  /** An icon, avatar or image at the start of the row. */
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Trailing text, such as a timestamp. */
  trailingText?: ReactNode;
  isDisabled?: boolean;
  /** What typeahead matches on, when the label is not plain text. */
  textValue?: string;
}

/**
 * One row. Like `MenuItem`, it describes a row rather than rendering one: the list reads these
 * off the collection and draws the rows itself, which is what pays for typeahead.
 */
export const SelectableListItem = Item as (props: SelectableListItemProps) => ReactElement;

export interface SelectableListProps {
  /** SelectableListItem children, which the collection reads rather than renders. */
  children: CollectionChildren;
  selectionMode?: 'single' | 'multiple';
  selectedKeys?: Iterable<Key>;
  defaultSelectedKeys?: Iterable<Key>;
  onSelectionChange?: (keys: Selection) => void;
  disabledKeys?: Iterable<Key>;
  /** Fired with a row's key when it is activated, for a list that navigates rather than selects. */
  onAction?: (key: Key) => void;
  /**
   * Vertical rows by default. A horizontal one is a scrolling strip of items that snaps, which is
   * the selectable counterpart to `Carousel`.
   */
  orientation?: 'vertical' | 'horizontal';
  /** Rounds and insets the list as its own surface, as `List` does. */
  contained?: boolean;
  /** Keeps focus inside the list, wrapping at the ends rather than stopping. */
  wrapFocus?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SelectableListSlot>;
}

/**
 * A list whose rows are the control.
 *
 * `List` is the other kind, and stays the default: a list row is usually content, and the spec
 * draws list selection as a `Checkbox` or a `Radio` in one of a row's slots. This is for the case
 * that is not true — a list where picking a row *is* the interaction, which wants one tab stop,
 * arrow keys, Home and End, typeahead, and a real `listbox` role saying how many rows there are
 * and which are selected.
 *
 * On `useListBox`, so an option is the whole row. A row that needs its own buttons inside it does
 * not belong here, and neither React Aria nor the ARIA spec allows it: a control inside an option
 * is unreachable. That row wants `List` with a `Checkbox` in its slot, or `useGridList`, which is
 * the pattern for focusable content inside rows and is not built.
 *
 * Horizontal is the same component turned on its side, with scroll snapping: that is the
 * selectable strip a carousel cannot be, since `Carousel` is a scroll region for browsing rather
 * than a set of options to choose from.
 */
export function SelectableList(props: SelectableListProps) {
  const { defaults, slots } = useComponentConfig('SelectableList');
  const {
    children,
    orientation = defaults?.orientation ?? 'vertical',
    selectionMode = defaults?.selectionMode ?? 'single',
    contained,
    wrapFocus = false,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const ariaProps = {
    ...rest,
    children,
    selectionMode,
    shouldFocusWrap: wrapFocus,
    // A listbox with nothing selected is still a listbox; this only stops a click clearing it.
    disallowEmptySelection: false,
  };

  const state = useListState(ariaProps);
  const ref = useRef<HTMLUListElement>(null);
  const { direction } = useLocale();
  const collator = useCollator({ usage: 'search', sensitivity: 'base' });

  /*
   * The keyboard delegate is built here rather than left to useListBox, which does not pass the
   * text direction into it. Without a direction its left-of and right-of both resolve to "next",
   * so a horizontal list moves forwards on either arrow and cannot be walked back. Building it
   * here also keeps the collator, which is what typeahead matches with.
   */
  const keyboardDelegate = useMemo(
    () =>
      new ListKeyboardDelegate({
        collection: state.collection,
        disabledKeys: state.disabledKeys,
        ref,
        collator,
        orientation,
        direction,
      }),
    [state.collection, state.disabledKeys, collator, orientation, direction],
  );

  const { listBoxProps } = useListBox({ ...ariaProps, orientation, keyboardDelegate }, state, ref);

  const slot = (name: SelectableListSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <ul
      {...listBoxProps}
      ref={ref}
      className={resolveSlotClass(
        'grange-selectable-list',
        `${listStyles.list} ${styles.list}`,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={style}
      data-contained={contained || undefined}
      data-orientation={orientation}
    >
      {[...state.collection].map((item) => (
        <Row
          key={item.key}
          item={item}
          state={state}
          className={slot('item', 'grange-selectable-list-item', `${listStyles.item} ${styles.item}`)}
          labelClass={slot('label', 'grange-selectable-list-item-label', listStyles.label)}
        />
      ))}
    </ul>
  );
}

function Row({
  item,
  state,
  className,
  labelClass,
}: {
  item: CollectionNode;
  state: ListState<unknown>;
  className: string;
  labelClass: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { optionProps, isSelected, isDisabled, isFocusVisible } = useOption({ key: item.key }, state, ref);
  const props = item.props as SelectableListItemProps;
  const lines = props.overline != null ? 3 : props.supportingText != null ? 2 : 1;

  return (
    <li
      {...optionProps}
      ref={ref}
      className={className}
      data-lines={String(lines)}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      {props.leading && <span className={listStyles.leading}>{props.leading}</span>}
      <span className={listStyles.text}>
        {props.overline != null && <span className={listStyles.overline}>{props.overline}</span>}
        <span className={labelClass}>{item.rendered}</span>
        {props.supportingText != null && <span className={listStyles.supporting}>{props.supportingText}</span>}
      </span>
      {props.trailingText != null && <span className={listStyles.trailingText}>{props.trailingText}</span>}
      {props.trailing && <span className={listStyles.trailing}>{props.trailing}</span>}
    </li>
  );
}
