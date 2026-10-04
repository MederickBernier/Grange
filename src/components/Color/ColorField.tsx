import { useRef, type CSSProperties, type ReactNode } from 'react';
import { mergeProps, useColorField, useFocusRing, useHover } from 'react-aria';
import { useColorFieldState, type Color as AriaColor, type ColorSpace } from 'react-stately';
import { FieldShell } from '../TextField/FieldShell';
import { describedBy, type TextFieldVariant } from '../TextField/specs';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type TextFieldSlot,
} from '../../config/config';
import textStyles from '../TextField/TextField.module.scss';
import styles from './Color.module.scss';

export interface ColorFieldProps {
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  value?: string | AriaColor | null;
  defaultValue?: string | AriaColor | null;
  onChange?: (value: AriaColor | null) => void;
  /** Which space the typed value is read and written in. Hex by default. */
  colorSpace?: ColorSpace;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Shows the colour that was typed, as a square at the start of the field. */
  showSwatch?: boolean;
  name?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TextFieldSlot>;
}

/**
 * A text field that holds a colour — the catalog's ColorInput.
 *
 * It wears `FieldShell`, like every other field here, so it floats its label and draws its
 * supporting text the same way. What `useColorField` adds is the parsing: it accepts the
 * formats a person actually types, normalises what they typed when the field loses focus, and
 * steps the value with the arrow keys — which is how you nudge a hex by one.
 *
 * **An unparseable value is not an error here.** The hook simply does not commit it, and the
 * field reverts on blur. A red ring for a half-typed `#ab` would fire on the way to every
 * valid colour.
 */
export function ColorField(props: ColorFieldProps) {
  const { defaults, slots } = useComponentConfig('ColorField');
  const {
    label,
    variant = defaults?.variant ?? 'filled',
    supportingText,
    error,
    errorText,
    disabled,
    readOnly,
    required,
    showSwatch = defaults?.showSwatch ?? true,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const ariaProps = {
    ...rest,
    label,
    description: supportingText,
    errorMessage: error ? errorText : undefined,
    isInvalid: error,
    isDisabled: disabled,
    isReadOnly: readOnly,
    isRequired: required,
  };

  const state = useColorFieldState(ariaProps);
  const inputRef = useRef<HTMLInputElement>(null);
  const { labelProps, inputProps, descriptionProps, errorMessageProps, isInvalid, validationErrors } =
    useColorField(ariaProps, state, inputRef);
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible, isFocused } = useFocusRing({ isTextInput: true, within: true });

  const invalid = error || isInvalid;
  const message = errorText ?? (validationErrors.length > 0 ? validationErrors.join(' ') : undefined);
  const showingError = invalid && message != null;
  const describes = describedBy([
    { id: errorMessageProps.id, shown: showingError },
    { id: descriptionProps.id, shown: !showingError && supportingText != null },
  ]);

  const slot = (name: TextFieldSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <FieldShell
      variant={variant}
      style={style}
      classes={{
        root: slot('root', 'grange-color-field', textStyles.root),
        container: slot('container', 'grange-color-field-container', textStyles.container),
        label: slot('label', 'grange-color-field-label', textStyles.label),
        supporting: slot('supporting', 'grange-color-field-supporting', textStyles.supporting),
        leadingIcon: slot('leadingIcon', 'grange-color-field-leading-icon', textStyles.icon),
      }}
      state={{
        populated: state.inputValue.length > 0 || isFocused,
        focused: isFocused,
        focusVisible: isFocusVisible,
        hovered: isHovered,
        error: invalid,
        disabled,
      }}
      label={label}
      labelProps={labelProps}
      containerProps={hoverProps}
      leadingIcon={
        showSwatch ? (
          // Decoration: the field's own value already says what the colour is, so announcing
          // the square as well would say it twice.
          <span className={styles.fieldSwatch} aria-hidden="true">
            {/* Over a chequerboard, so a translucent value reads as translucent. */}
            <span
              className={styles.fieldSwatchColor}
              style={{ background: state.colorValue?.toString('css') ?? 'transparent' }}
            />
          </span>
        ) : undefined
      }
      supporting={showingError ? message : supportingText}
      supportingProps={showingError ? errorMessageProps : descriptionProps}
    >
      <input
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
        aria-describedby={describes}
        className={slot('input', 'grange-color-field-input', textStyles.input)}
      />
    </FieldShell>
  );
}
