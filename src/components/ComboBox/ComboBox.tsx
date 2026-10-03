import { useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { mergeProps, useButton, useComboBox, useFilter, useFocusRing, useHover } from 'react-aria';
import { Item, useComboBoxState, type ComboBoxProps as AriaComboBoxProps } from 'react-stately';
import { Popover } from '../../overlays/Popover';
import { OptionList, type OptionListColumn, type OptionListItemProps } from '../Select/OptionList';
import { FieldShell } from '../TextField/FieldShell';
import {
  resolveSlotClass,
  useComponentConfig,
  type ComboBoxSlot,
  type SlotOverrides,
} from '../../config/config';
import { describedBy, type TextFieldVariant } from '../TextField/specs';
import textStyles from '../TextField/TextField.module.scss';
import menuStyles from '../Menu/Menu.module.scss';
import selectStyles from '../Select/Select.module.scss';

type Key = NonNullable<AriaComboBoxProps<never>['disabledKeys']> extends Iterable<infer K> ? K : never;
type CollectionChildren = AriaComboBoxProps<object>['children'];

export type ComboBoxItemProps = OptionListItemProps;
export type ComboBoxColumn = OptionListColumn;

/**
 * One option. Identified by its React `key`, as the menu's and the select's items are, because
 * that is this collection builder's convention rather than a choice made here.
 */
export const ComboBoxItem = Item as (props: ComboBoxItemProps) => ReactElement;

export interface ComboBoxProps {
  /** ComboBoxItem children, which the collection reads rather than renders. */
  children: CollectionChildren;
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  /** The chosen option's key. */
  selectedKey?: Key | null;
  defaultSelectedKey?: Key;
  onSelectionChange?: (key: Key | null) => void;
  /** What is typed in the field, which is not the same thing as what is chosen. */
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (value: string) => void;
  disabledKeys?: Iterable<Key>;
  /**
   * Lets the field keep text that matches no option. Off by default: a combo box with a fixed
   * list reverts to the chosen option's label when it loses focus, which is what makes it a
   * picker rather than a text field with suggestions.
   */
  allowsCustomValue?: boolean;
  /** When the list opens: as soon as anything is typed, on focus, or only on the button. */
  menuTrigger?: 'input' | 'focus' | 'manual';
  /** Shown in the list when nothing matches what has been typed. */
  emptyState?: ReactNode;
  /**
   * The chevron that opens the whole list. On for a picker, off for a field that only suggests
   * as you type — which is what `Autocomplete` is.
   */
  showOpenButton?: boolean;
  /**
   * Lays the list out in columns, with a header. Each item then carries `cells`; its `children`
   * stay the label, which is what typeahead matches and what is announced.
   */
  columns?: readonly ComboBoxColumn[];
  placeholder?: string;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  validationBehavior?: 'aria' | 'native';
  /** Submitted with the form under this name: the chosen key, or the text when custom values are allowed. */
  name?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ComboBoxSlot>;
}

/**
 * A text field that filters a list of options, on React Aria's useComboBox.
 *
 * It is the field half of `Select` with typing added, and it shares both halves rather than
 * reproducing them: the chrome is `FieldShell`, which `TextField` uses, and the list is
 * `OptionList`, which `Select` uses. So the three look identical and cannot drift.
 *
 * What the hook brings is the part that is genuinely hard: the input and the list are two
 * things that have to agree about one value. Typing filters without moving the selection,
 * the arrows move through what is showing rather than through everything, Escape reverts rather
 * than clearing, blurring commits or reverts depending on whether custom values are allowed,
 * and `aria-activedescendant` points at the focused option while focus itself stays in the
 * input — which is what lets a screen reader read the options as you arrow through them.
 *
 * Filtering is locale-aware by default, through `useFilter`: "é" matches "e" and case is
 * ignored, which a `toLowerCase().includes()` filter gets wrong in most of the world.
 */
export function ComboBox(props: ComboBoxProps) {
  const { defaults, slots } = useComponentConfig('ComboBox');
  const {
    children,
    label,
    variant = defaults?.variant ?? 'filled',
    allowsCustomValue = defaults?.allowsCustomValue ?? false,
    menuTrigger = defaults?.menuTrigger ?? 'input',
    emptyState = 'No matches',
    showOpenButton = defaults?.showOpenButton ?? true,
    columns,
    placeholder,
    supportingText,
    error,
    errorText,
    leadingIcon,
    disabled,
    readOnly,
    required,
    validationBehavior = 'aria',
    name,
    className,
    classNames,
    style,
    ...rest
  } = props;

  // Locale-aware matching: "é" matches "e" and case is ignored, which a lowercase includes()
  // filter gets wrong in most of the world.
  const { contains } = useFilter({ sensitivity: 'base' });

  const ariaProps = {
    ...rest,
    children,
    label,
    placeholder,
    name,
    allowsCustomValue,
    menuTrigger,
    defaultFilter: contains,
    /*
     * Without this the hook closes the list the moment the filter matches nothing, so an empty
     * state has nowhere to be shown — the branch that renders it is simply never reached.
     */
    allowsEmptyCollection: emptyState != null,
    description: supportingText,
    errorMessage: error ? errorText : undefined,
    isInvalid: error,
    isDisabled: disabled,
    isReadOnly: readOnly,
    isRequired: required,
    validationBehavior,
  };

  const state = useComboBoxState(ariaProps);
  const inputRef = useRef<HTMLInputElement>(null);
  const listBoxRef = useRef<HTMLUListElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    labelProps,
    inputProps,
    listBoxProps,
    buttonProps: openOptions,
    descriptionProps,
    errorMessageProps,
    isInvalid,
    validationErrors,
  } = useComboBox(
    { ...ariaProps, inputRef, listBoxRef, popoverRef, buttonRef },
    state,
  );

  // buttonProps are button options and not DOM props, which is the fourth component here where
  // spreading them straight onto a <button> would have looked right and done nothing.
  const { buttonProps } = useButton(openOptions, buttonRef);
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible, isFocused } = useFocusRing({ isTextInput: true, within: true });

  const invalid = error || isInvalid;
  const message = errorText ?? (validationErrors.length > 0 ? validationErrors.join(' ') : undefined);
  const showingError = invalid && message != null;
  const describes = describedBy([
    { id: errorMessageProps.id, shown: showingError },
    { id: descriptionProps.id, shown: !showingError && supportingText != null },
  ]);

  const slot = (slotName: ComboBoxSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[slotName] ?? []),
      classNames?.[slotName],
      slotName === 'root' ? className : undefined,
    );

  return (
    <FieldShell
      variant={variant}
      style={style}
      classes={{
        root: slot('root', 'grange-combo-box', textStyles.root),
        container: slot('container', 'grange-combo-box-container', textStyles.container),
        label: slot('label', 'grange-combo-box-label', textStyles.label),
        supporting: slot('supporting', 'grange-combo-box-supporting', textStyles.supporting),
        leadingIcon: slot('leadingIcon', 'grange-combo-box-leading-icon', textStyles.icon),
      }}
      state={{
        populated: state.inputValue.length > 0 || Boolean(placeholder) || isFocused,
        focused: isFocused || state.isOpen,
        focusVisible: isFocusVisible,
        hovered: isHovered,
        error: invalid,
        disabled,
      }}
      label={label}
      labelProps={labelProps}
      containerProps={hoverProps}
      leadingIcon={leadingIcon}
      trailing={
        showOpenButton && <OpenButton buttonProps={buttonProps} buttonRef={buttonRef} isOpen={state.isOpen} />
      }
      supporting={showingError ? message : supportingText}
      supportingProps={showingError ? errorMessageProps : descriptionProps}
    >
      <input
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
        aria-describedby={describes}
        className={slot('input', 'grange-combo-box-input', textStyles.input)}
      />

      {state.isOpen && (
        <Popover
          state={state}
          triggerRef={inputRef}
          popoverRef={popoverRef}
          matchTriggerWidth
          // Non-modal, because focus stays in the input: the list is read through
          // aria-activedescendant rather than by moving into it, so making the page behind inert
          // would be both unnecessary and a trap for the field that is still focused.
          nonModal
          className={menuStyles.popover}
        >
          <OptionList
            state={state}
            listProps={listBoxProps as Record<string, unknown>}
            itemClass={slot('item', 'grange-combo-box-item', menuStyles.item)}
            emptyState={emptyState}
            listRef={listBoxRef}
            columns={columns}
          />
        </Popover>
      )}
    </FieldShell>
  );
}

/**
 * The chevron that opens the list.
 *
 * Deliberately unlabelled. `useComboBox` labels this button by the field itself, through an
 * `aria-labelledby` pointing at the label, so a screen reader says "City, show suggestions". An
 * `aria-label` here would be ignored — labelledby wins — and would sit in the markup looking
 * like it did something.
 */
function OpenButton({
  buttonProps,
  buttonRef,
  isOpen,
}: {
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
}) {
  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      className={`${textStyles.icon} ${selectStyles.arrow}`}
      data-open={isOpen || undefined}
    >
      <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
        <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
      </svg>
    </button>
  );
}

/**
 * The catalog's MultiColumnComboBox: the same combo box with the list laid out in columns.
 *
 * A wrapper rather than its own component, because the columns are presentation. An option is
 * still one option named by its label; a real tabular list would need `useGridList`, and making
 * every cell a focus stop is the wrong trade for a list you pick one thing from.
 */
export function MultiColumnComboBox(props: ComboBoxProps & { columns: readonly ComboBoxColumn[] }) {
  return <ComboBox {...props} />;
}

export type VariantComboBoxProps = Omit<ComboBoxProps, 'variant'>;

/** The filled variant, to match `FilledTextField` and `FilledNumberField`. */
export function FilledComboBox(props: VariantComboBoxProps) {
  return <ComboBox {...props} variant="filled" />;
}

/** The outlined variant. */
export function OutlinedComboBox(props: VariantComboBoxProps) {
  return <ComboBox {...props} variant="outlined" />;
}
