import { useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { HiddenSelect, useButton, useFocusRing, useHover, useSelect } from 'react-aria';
import { Item, useSelectState, type SelectProps as AriaSelectProps } from 'react-stately';
import { Popover } from '../../overlays/Popover';
import { OptionList } from './OptionList';
import {
  resolveSlotClass,
  useComponentConfig,
  type SelectSlot,
  type SlotOverrides,
} from '../../config/config';
import { describedBy, type TextFieldVariant } from '../TextField/specs';
import textFieldStyles from '../TextField/TextField.module.scss';
import menuStyles from '../Menu/Menu.module.scss';
import styles from './Select.module.scss';

type Key = NonNullable<AriaSelectProps<unknown>['disabledKeys']> extends Iterable<infer K> ? K : never;
type CollectionChildren = AriaSelectProps<unknown>['children'];

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
    // The name goes to the state as well as to the hidden select: it is what the validation
    // state looks itself up by in FormValidationContext, so without it a form cannot address
    // this field at all.
    name,
    isDisabled: disabled,
    isRequired: required,
    isInvalid: error,
    errorMessage: error ? errorText : undefined,
    description: error && errorText ? undefined : supportingText,
  };

  const state = useSelectState(ariaProps);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const {
    labelProps,
    triggerProps,
    valueProps,
    menuProps,
    descriptionProps,
    errorMessageProps,
    isInvalid,
    validationErrors,
  } = useSelect(ariaProps, state, triggerRef);
  // triggerProps are button options, not DOM props: they have to go through useButton to come
  // out with the press handling attached.
  const { buttonProps } = useButton(triggerProps, triggerRef);
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  /*
   * The hook's verdict as well as the prop. useSelect reads FormValidationContext and finds this
   * field's name in it, so a Form can push an error in by name — but only if it is read back
   * here. Without this the trigger gets aria-invalid and no message is ever drawn.
   */
  const invalid = error || isInvalid;
  const errorMessage = errorText ?? (validationErrors.length > 0 ? validationErrors.join(' ') : undefined);
  const description = supportingText;

  const showingError = invalid && errorMessage != null;
  /*
   * Only the message that is rendered. M3 replaces the supporting text with the error rather
   * than showing both, and the hook links both unconditionally, which would leave the trigger
   * described by an element that is not in the DOM.
   */
  const describes = describedBy([
    { id: errorMessageProps.id, shown: showingError },
    { id: descriptionProps.id, shown: !showingError && description != null },
  ]);
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
      data-error={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      {/* A real select, kept out of sight, so the value posts with the form. */}
      <HiddenSelect state={state} triggerRef={triggerRef} label={label} name={name} isDisabled={disabled} />

      <button
        {...buttonProps}
        {...hoverProps}
        {...focusProps}
        aria-describedby={describes}
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

      {(description != null || showingError) && (
        <div className={textFieldStyles.supporting}>
          {showingError ? (
            <span {...errorMessageProps}>{errorMessage}</span>
          ) : (
            <span {...descriptionProps}>{description}</span>
          )}
        </div>
      )}

      {state.isOpen && (
        <Popover state={state} triggerRef={triggerRef} matchTriggerWidth className={menuStyles.popover}>
          <OptionList
            state={state}
            listProps={menuProps as Record<string, unknown>}
            itemClass={slot('item', 'grange-select-item', menuStyles.item)}
            // A select always has something chosen once something has been: pressing the chosen
            // option again closes the list rather than emptying it.
            disallowEmptySelection
          />
        </Popover>
      )}
    </div>
  );
}
