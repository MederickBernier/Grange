import { useMemo, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { useButton, useFocusRing, useHover, useOverlayTrigger, useTag, useTagGroup } from 'react-aria';
import {
  Item,
  useListState,
  useOverlayTriggerState,
  type ListProps as StatelyListProps,
  type ListState,
} from 'react-stately';
import { Popover } from '../../overlays/Popover';
import { OptionList, type OptionListItemProps } from '../Select/OptionList';
import { FieldShell } from '../TextField/FieldShell';
import {
  resolveSlotClass,
  useComponentConfig,
  type MultiSelectSlot,
  type SlotOverrides,
} from '../../config/config';
import { useControlledState } from '../../utils';
import type { TextFieldVariant } from '../TextField/specs';
import textStyles from '../TextField/TextField.module.scss';
import menuStyles from '../Menu/Menu.module.scss';
import selectStyles from '../Select/Select.module.scss';
import styles from './MultiSelect.module.scss';

/**
 * Derived from React Aria's own types rather than imported from @react-types/shared, which is
 * only a transitive package here and would have to be declared to resolve under pnpm. Their
 * `Key` is narrower than React's: no bigint.
 */
type Key = NonNullable<StatelyListProps<unknown>['disabledKeys']> extends Iterable<infer K> ? K : never;
type CollectionChildren = StatelyListProps<unknown>['children'];

export type MultiSelectItemProps = OptionListItemProps;

/** One option. Identified by its React `key`, as the select's and the combo box's items are. */
export const MultiSelectItem = Item as (props: MultiSelectItemProps) => ReactElement;

export interface MultiSelectProps {
  /** MultiSelectItem children, which the collection reads rather than renders. */
  children: CollectionChildren;
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  selectedKeys?: Iterable<Key>;
  defaultSelectedKeys?: Iterable<Key>;
  onSelectionChange?: (keys: Set<Key>) => void;
  disabledKeys?: Iterable<Key>;
  /** Shown in the field while nothing is chosen. */
  placeholder?: string;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
  /** Names the group of chips for assistive tech. Defaults to the label. */
  tagGroupLabel?: string;
  disabled?: boolean;
  /** Each chosen key posts under this name, so the form receives a list. */
  name?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<MultiSelectSlot>;
}

/**
 * Several options chosen at once, shown as removable chips in the field.
 *
 * There is no `useMultiSelect` in React Aria, so this is assembled from the two hooks that cover
 * its halves, and the assembly is the interesting part:
 *
 * - The options are a `useListBox` in multiple-selection mode, inside the same `Popover` and the
 *   same `OptionList` the select and the combo box use.
 * - The chips are a **real tag group**, not a row of buttons. `useTagGroup` makes them a grid
 *   with its own arrow-key navigation and a live region, so removing one is announced; a row of
 *   chips would leave a screen reader no way to walk them and no word when one disappears.
 *
 * The two are separate widgets inside one field, which is deliberate rather than convenient: a
 * tag group and a listbox both want the arrow keys, and putting them under one tab stop would
 * mean choosing which. So Tab reaches the chips, then the chevron, and the chevron opens the list.
 *
 * The chosen keys post as one hidden input each, which is how a form receives a list under one
 * name instead of a joined string the server has to split.
 */
export function MultiSelect(props: MultiSelectProps) {
  const { defaults, slots } = useComponentConfig('MultiSelect');
  const {
    children,
    label,
    variant = defaults?.variant ?? 'filled',
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    disabledKeys,
    placeholder,
    supportingText,
    error,
    errorText,
    leadingIcon,
    tagGroupLabel,
    disabled,
    name,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const [keys, setKeys] = useControlledState<Set<Key>>(
    selectedKeys === undefined ? undefined : new Set(selectedKeys),
    new Set(defaultSelectedKeys ?? []),
    onSelectionChange,
  );

  const state = useListState({
    children,
    selectionMode: 'multiple' as const,
    selectedKeys: [...keys],
    onSelectionChange: (next) => setKeys(next === 'all' ? new Set() : new Set(next)),
    disabledKeys,
  });

  const overlay = useOverlayTriggerState({
    // Focus goes back to the chevron when the list closes. usePopover does not restore it, and
    // without this the page is left with nothing focused after Escape.
    onOpenChange: (isOpen) => {
      if (!isOpen) triggerRef.current?.focus();
    },
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'listbox' }, overlay, triggerRef);
  // triggerProps are button options and not DOM props, as everywhere else here.
  const { buttonProps } = useButton(triggerProps, triggerRef);

  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible, isFocused } = useFocusRing({ within: true });

  /** The chosen options, in the collection's order rather than the order they were pressed. */
  const chosen = useMemo(
    () => [...state.collection].filter((item) => keys.has(item.key)),
    [state.collection, keys],
  );

  const remove = (removed: Set<Key>) => {
    const next = new Set(keys);
    for (const key of removed) next.delete(key);
    setKeys(next);
  };

  const slot = (slotName: MultiSelectSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[slotName] ?? []),
      classNames?.[slotName],
      slotName === 'root' ? className : undefined,
    );

  const showingError = Boolean(error) && errorText != null;
  const name_ = typeof label === 'string' ? label : (aria['aria-label'] ?? 'Choose');

  return (
    <FieldShell
      variant={variant}
      style={style}
      classes={{
        root: slot('root', 'grange-multi-select', `${textStyles.root} ${styles.root}`),
        container: slot('container', 'grange-multi-select-container', textStyles.container),
        label: slot('label', 'grange-multi-select-label', textStyles.label),
        supporting: slot('supporting', 'grange-multi-select-supporting', textStyles.supporting),
        leadingIcon: slot('leadingIcon', 'grange-multi-select-leading-icon', textStyles.icon),
      }}
      state={{
        populated: chosen.length > 0 || Boolean(placeholder) || isFocused || overlay.isOpen,
        focused: isFocused || overlay.isOpen,
        focusVisible: isFocusVisible,
        hovered: isHovered,
        error,
        disabled,
      }}
      label={label}
      containerProps={{ ...hoverProps, ...focusProps }}
      leadingIcon={leadingIcon}
      trailing={
        <TriggerButton
          buttonProps={buttonProps}
          buttonRef={triggerRef}
          label={name_}
          isOpen={overlay.isOpen}
          disabled={disabled}
        />
      }
      supporting={showingError ? errorText : supportingText}
    >
      <Tags
        items={chosen.map((item) => ({ key: item.key, label: item.rendered }))}
        label={tagGroupLabel ?? name_}
        placeholder={placeholder}
        disabled={disabled}
        tagClass={slot('tag', 'grange-multi-select-tag', styles.tag)}
        onRemove={remove}
      />

      {/*
        One hidden input per chosen key. A form then receives a list under one name, which is what
        FormData already understands, rather than a joined string the server has to split.
      */}
      {name !== undefined &&
        [...keys].map((key) => <input key={String(key)} type="hidden" name={name} value={String(key)} />)}

      {overlay.isOpen && (
        <Popover state={overlay} triggerRef={triggerRef} matchTriggerWidth className={menuStyles.popover}>
          <OptionList
            state={state}
            /*
             * autoFocus matters more than it looks. useOverlay listens for Escape on the overlay
             * element, so with focus left on the trigger the key never reaches it and the list
             * cannot be closed from the keyboard — and the arrows would do nothing either.
             * Unlike a select, nothing else here moves focus in.
             */
            listProps={{
              ...overlayProps,
              'aria-label': name_,
              autoFocus: 'first',
              /*
               * By default Escape in a multiple-selection listbox *clears the selection* and
               * stops there — it does not reach the popover, so the list cannot be closed with
               * it and everything chosen is thrown away instead. Opting out puts Escape back to
               * meaning "close", which is what it means everywhere else in this library.
               */
              escapeKeyBehavior: 'none',
            }}
            itemClass={slot('item', 'grange-multi-select-item', menuStyles.item)}
          />
        </Popover>
      )}
    </FieldShell>
  );
}

/**
 * The chevron.
 *
 * Labelled by hand, unlike the combo box's: there is no input for `useOverlayTrigger` to borrow
 * a name from, so without this the button would be announced as nothing at all.
 */
function TriggerButton({
  buttonProps,
  buttonRef,
  label,
  isOpen,
  disabled,
}: {
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  label: string;
  isOpen: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      aria-label={label}
      className={`${textStyles.icon} ${selectStyles.arrow}`}
      data-open={isOpen || undefined}
      disabled={disabled}
    >
      <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
        <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
      </svg>
    </button>
  );
}

/**
 * The chips, as a tag group.
 *
 * A second collection, and it has to be one: `useTagGroup` and `useTag` work over a `ListState`,
 * and the state the options live in holds every option rather than only the chosen ones.
 */
function Tags({
  items,
  label,
  placeholder,
  disabled,
  tagClass,
  onRemove,
}: {
  items: Array<{ key: Key; label: ReactNode }>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  tagClass: string;
  onRemove: (keys: Set<Key>) => void;
}) {
  const state = useListState({
    children: items.map((item) => <Item key={String(item.key)}>{item.label}</Item>),
  });
  const ref = useRef<HTMLDivElement>(null);
  /*
   * `aria-label`, not `label`. Given a `label` the hook generates an id and expects its
   * `labelProps` to be rendered on an element; the field's own label is not that element, so the
   * grid would be labelled by an id that exists nowhere — a name that resolves to nothing while
   * looking wired up. A string name needs no element.
   *
   * And no isDisabled, because the hook has no such option: a disabled field withholds onRemove
   * instead, which makes `allowsRemoving` false and takes the remove buttons away. The tags stay
   * readable and walkable, they just cannot be dismissed.
   */
  const { gridProps } = useTagGroup(
    { 'aria-label': label, onRemove: disabled ? undefined : onRemove },
    state,
    ref,
  );

  if (items.length === 0) {
    // Nothing chosen: the placeholder and no grid. An empty grid is announced as a table with
    // no rows, which is worse than silence.
    return <span className={styles.placeholder}>{placeholder}</span>;
  }

  return (
    <div {...gridProps} ref={ref} className={styles.tags}>
      {[...state.collection].map((item) => (
        <Tag key={item.key} item={item} state={state} className={tagClass} />
      ))}
    </div>
  );
}

type CollectionNode = ListState<unknown>['collection'] extends Iterable<infer N> ? N : never;

function Tag({
  item,
  state,
  className,
}: {
  item: CollectionNode;
  state: ListState<unknown>;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /*
   * `item` is the only option useTag takes. The remove handler is not passed here: useTagGroup
   * stores it against the state in a WeakMap, so this has to be called with the same state the
   * group was, and passing onRemove again would be a prop the hook ignores.
   */
  const { rowProps, gridCellProps, removeButtonProps, allowsRemoving } = useTag({ item }, state, ref);
  const removeRef = useRef<HTMLButtonElement>(null);
  // removeButtonProps carries onPress and isDisabled: options, not DOM props.
  const { buttonProps } = useButton(removeButtonProps, removeRef);

  return (
    <div {...rowProps} ref={ref} className={className}>
      <div {...gridCellProps} className={styles.tagCell}>
        <span className={styles.tagLabel}>{item.rendered}</span>
        {allowsRemoving && (
          <button {...buttonProps} ref={removeRef} className={styles.tagRemove}>
            <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export type VariantMultiSelectProps = Omit<MultiSelectProps, 'variant'>;

/** The filled variant. */
export function FilledMultiSelect(props: VariantMultiSelectProps) {
  return <MultiSelect {...props} variant="filled" />;
}

/** The outlined variant. */
export function OutlinedMultiSelect(props: VariantMultiSelectProps) {
  return <MultiSelect {...props} variant="outlined" />;
}
