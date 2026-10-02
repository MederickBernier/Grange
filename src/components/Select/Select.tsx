import { useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import {
  HiddenSelect,
  useButton,
  useFocusRing,
  useHover,
  useListBox,
  useOption,
  useSelect,
} from 'react-aria';
import { Item, useSelectState, type SelectProps as AriaSelectProps, type SelectState } from 'react-stately';
import { Popover } from '../../overlays/Popover';
import { resolveSlotClass, useComponentConfig, type SelectSlot, type SlotOverrides } from '../../config/config';
import type { TextFieldVariant } from '../TextField/specs';
import textFieldStyles from '../TextField/TextField.module.scss';
import menuStyles from '../Menu/Menu.module.scss';
import styles from './Select.module.scss';

type Key = NonNullable<AriaSelectProps<unknown>['disabledKeys']> extends Iterable<infer K> ? K : never;
type CollectionChildren = AriaSelectProps<unknown>['children'];
type CollectionNode = SelectState<unknown>['collection'] extends Iterable<infer N> ? N : never;

export interface SelectItemProps {
  /**
   * The label. Identified by its React `key`, as the menu items are: `<SelectItem key="gb">`.
   */
  children: ReactNode;
  icon?: ReactNode;
  supportingText?: ReactNode;
  textValue?: string;
}

/** One option. Described rather than rendered, so the collection can give typeahead. */
export const SelectItem = Item as (props: SelectItemProps) => ReactElement;

export interface SelectProps {
  /** SelectItem children. */
  children: CollectionChildren;
  /** Floats from inside the field to its edge once something is chosen, as a text field's does. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  selectedKey?: Key | null;
  defaultSelectedKey?: Key;
  onSelectionChange?: (key: Key | null) => void;
  disabledKeys?: Iterable<Key>;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  /** Submitted with the form under this name, through a real hidden select. */
  name?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SelectSlot>;
}

/**
 * A select: a field that opens a list of options.
 *
 * The trigger wears the text field's clothes, reusing that stylesheet rather than copying it, so
 * the two line up and stay lined up. The list reuses the menu's rows for the same reason.
 *
 * useSelect brings the behaviour a native select has and a div never does: typeahead on the
 * closed trigger, Home and End, the list opening on the arrows, and a real hidden select
 * underneath so it submits in a form.
 */
export function Select(props: SelectProps) {
  const { defaults, slots } = useComponentConfig('Select');
  const {
    label,
    variant = defaults?.variant ?? 'filled',
    placeholder = '',
    supportingText,
    error,
    errorText,
    leadingIcon,
    disabled,
    required,
    name,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const ariaProps = {
    ...rest,
    label,
    placeholder,
    isDisabled: disabled,
    isRequired: required,
    isInvalid: error,
    errorMessage: error ? errorText : undefined,
    description: error && errorText ? undefined : supportingText,
  };

  const state = useSelectState(ariaProps);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { labelProps, triggerProps, valueProps, menuProps, descriptionProps, errorMessageProps } =
    useSelect(ariaProps, state, triggerRef);
  // triggerProps are button options, not DOM props: they have to go through useButton to come
  // out with the press handling attached.
  const { buttonProps } = useButton(triggerProps, triggerRef);
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const description = error && errorText ? undefined : supportingText;
  const populated = state.selectedItem != null || Boolean(placeholder) || state.isOpen;

  const slot = (name_: SelectSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name_] ?? []),
      classNames?.[name_],
      name_ === 'root' ? className : undefined,
    );

  return (
    <div
      className={slot('root', 'grange-select', `${textFieldStyles.root} ${styles.root}`)}
      style={style}
      data-variant={variant}
      data-populated={populated || undefined}
      data-focused={state.isOpen || isFocusVisible || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-hovered={isHovered || undefined}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
    >
      {/* A real select, kept out of sight, so the value posts with the form. */}
      <HiddenSelect state={state} triggerRef={triggerRef} label={label} name={name} isDisabled={disabled} />

      <button
        {...buttonProps}
        {...hoverProps}
        {...focusProps}
        ref={triggerRef}
        className={slot('trigger', 'grange-select-trigger', `${textFieldStyles.container} ${styles.trigger}`)}
      >
        {variant === 'outlined' && (
          <fieldset className={textFieldStyles.outline} aria-hidden="true">
            <legend className={textFieldStyles.notch}>
              <span>{label}</span>
            </legend>
          </fieldset>
        )}

        {leadingIcon && <span className={textFieldStyles.icon}>{leadingIcon}</span>}

        <span className={textFieldStyles.field}>
          {label != null && (
            <span {...labelProps} className={slot('label', 'grange-select-label', textFieldStyles.label)}>
              {label}
            </span>
          )}
          <span {...valueProps} className={styles.value}>
            {state.selectedItem ? state.selectedItem.rendered : placeholder}
          </span>
        </span>

        <span className={`${textFieldStyles.icon} ${styles.arrow}`} aria-hidden="true">
          <svg viewBox="0 -960 960 960" focusable="false">
            <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
          </svg>
        </span>
      </button>

      {(description != null || (error && errorText != null)) && (
        <div className={textFieldStyles.supporting}>
          {error && errorText != null ? (
            <span {...errorMessageProps}>{errorText}</span>
          ) : (
            <span {...descriptionProps}>{description}</span>
          )}
        </div>
      )}

      {state.isOpen && (
        <Popover
          state={state}
          triggerRef={triggerRef}
          matchTriggerWidth
          className={menuStyles.popover}
        >
          <ListBox {...menuProps} state={state} itemClass={slot('item', 'grange-select-item', menuStyles.item)} />
        </Popover>
      )}
    </div>
  );
}

function ListBox({
  state,
  itemClass,
  ...props
}: {
  state: SelectState<unknown>;
  itemClass: string;
} & Record<string, unknown>) {
  const ref = useRef<HTMLUListElement>(null);
  const { listBoxProps } = useListBox({ ...props, disallowEmptySelection: true }, state, ref);

  return (
    <ul {...listBoxProps} ref={ref} className={menuStyles.menu}>
      {[...state.collection].map((item) => (
        <Option key={item.key} item={item} state={state} className={itemClass} />
      ))}
    </ul>
  );
}

function Option({
  item,
  state,
  className,
}: {
  item: CollectionNode;
  state: SelectState<unknown>;
  className: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { optionProps, isSelected, isDisabled, isFocused } = useOption({ key: item.key }, state, ref);
  const props = item.props as SelectItemProps;

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
