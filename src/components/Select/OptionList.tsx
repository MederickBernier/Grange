import { useRef, type ReactNode, type RefObject } from 'react';
import { useListBox, useOption } from 'react-aria';
import type { ListState } from 'react-stately';
import menuStyles from '../Menu/Menu.module.scss';

/**
 * The list of options behind `Select` and `ComboBox`, and whatever else opens one.
 *
 * Extracted for the same reason `FieldShell` was: a select, a combo box and a multi-select all
 * draw the same rows and would otherwise each grow their own copy. The rows borrow the menu's
 * geometry from ListTokens, so an option and a menu item are the same size and the same shape.
 *
 * It is generic over the state because `SelectState` and `ComboBoxState` are different types that
 * both satisfy what `useListBox` and `useOption` need — a collection and a selection manager —
 * which is exactly the shape of `ListState`.
 */
export interface OptionListItemProps {
  children: ReactNode;
  icon?: ReactNode;
  supportingText?: ReactNode;
  textValue?: string;
  isDisabled?: boolean;
}

export interface OptionListProps {
  state: ListState<unknown>;
  /** The resolved class for a row, from the caller's own config key. */
  itemClass: string;
  /** The props the field's hook hands over for the list: ids, labelling, autofocus behaviour. */
  listProps?: Record<string, unknown>;
  /** A select cannot be emptied by pressing the chosen option again; a combo box can. */
  disallowEmptySelection?: boolean;
  /** Shown in place of the rows when the filter has matched nothing. */
  emptyState?: ReactNode;
  /**
   * The list element's ref, when the caller needs it too. A combo box does: `useComboBox` scrolls
   * the focused option into view through it, and it has to be the same element this renders.
   */
  listRef?: RefObject<HTMLUListElement | null>;
}

export function OptionList({
  state,
  itemClass,
  listProps,
  disallowEmptySelection = false,
  emptyState,
  listRef,
}: OptionListProps) {
  const ownRef = useRef<HTMLUListElement>(null);
  const ref = listRef ?? ownRef;
  const { listBoxProps } = useListBox({ ...listProps, disallowEmptySelection }, state, ref);
  const items = [...state.collection];

  return (
    <ul {...listBoxProps} ref={ref} className={menuStyles.menu}>
      {items.length === 0 && emptyState != null ? (
        // Not an option: there is nothing to choose, and announcing it as one would be a lie.
        <li className={menuStyles.item} role="presentation">
          <span className={menuStyles.text}>
            <span className={menuStyles.supporting}>{emptyState}</span>
          </span>
        </li>
      ) : (
        items.map((item) => <Option key={item.key} item={item} state={state} className={itemClass} />)
      )}
    </ul>
  );
}

type CollectionNode = ListState<unknown>['collection'] extends Iterable<infer N> ? N : never;

function Option({
  item,
  state,
  className,
}: {
  item: CollectionNode;
  state: ListState<unknown>;
  className: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { optionProps, isSelected, isDisabled, isFocused } = useOption({ key: item.key }, state, ref);
  const props = item.props as OptionListItemProps;

  return (
    <li
      {...optionProps}
      ref={ref}
      className={className}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
      data-focused={isFocused || undefined}
      data-two-line={props.supportingText ? 'true' : undefined}
    >
      {props.icon && <span className={menuStyles.icon}>{props.icon}</span>}
      <span className={menuStyles.text}>
        <span className={menuStyles.label}>{item.rendered}</span>
        {props.supportingText && <span className={menuStyles.supporting}>{props.supportingText}</span>}
      </span>
    </li>
  );
}
