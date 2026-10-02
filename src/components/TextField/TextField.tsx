import { forwardRef, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useButton, useFocusRing, useHover, useObjectRef, useTextField } from 'react-aria';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type TextFieldSlot,
} from '../../config/config';
import { counterText, textField as spec, type TextFieldVariant } from './specs';
import styles from './TextField.module.scss';

export type { TextFieldVariant };

export interface TextFieldProps {
  /** Floats from inside the field to its top edge once there is a value or focus. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Only visible once the label has floated, or when there is no label at all. */
  placeholder?: string;
  /** Guidance under the field. Replaced by `errorText` while in error. */
  supportingText?: ReactNode;
  error?: boolean;
  /** Shown in place of the supporting text, and announced, while in error. */
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Static text before the input, such as a currency symbol. */
  prefix?: string;
  suffix?: string;
  /** Renders a textarea that grows with `rows`. */
  multiline?: boolean;
  rows?: number;
  /** Caps the length and shows a counter under the field. */
  maxLength?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /**
   * How required and invalid are communicated. `aria` is the default and leaves the messaging to
   * `errorText`, which is what the spec draws; `native` adds the real `required` attribute so the
   * browser validates and shows its own bubble.
   */
  validationBehavior?: 'aria' | 'native';
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
  /**
   * The eye at the end of a password field that shows what has been typed. On by default for
   * `type="password"`, which is what the spec draws, and `false` turns it off for a field where
   * the value should never be shown.
   */
  revealable?: boolean;
  /** The reveal button's label, by state. */
  revealLabel?: string;
  hideLabel?: string;
  name?: string;
  autoComplete?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TextFieldSlot>;
}

/**
 * A text field, filled or outlined, on React Aria's useTextField so the label, the supporting
 * text and the error message are wired to the input with the right ids rather than only sitting
 * near it.
 *
 * The outlined variant's floating label breaks the border with a real `<legend>` inside a
 * `<fieldset>`, which reserves exactly as much space as the label needs. Faking it with a
 * background colour behind the label only works when you know what the field is sitting on.
 */
export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(
  function TextField(props, forwardedRef) {
    const { defaults, slots } = useComponentConfig('TextField');
    const {
      label,
      variant = defaults?.variant ?? 'filled',
      supportingText,
      error,
      errorText,
      leadingIcon,
      trailingIcon,
      prefix,
      suffix,
      multiline = false,
      rows = 3,
      maxLength,
      disabled,
      readOnly,
      required,
      validationBehavior = 'aria',
      placeholder,
      revealable,
      revealLabel = 'Show password',
      hideLabel = 'Hide password',
      className,
      classNames,
      style,
      onChange,
      ...rest
    } = props;

    const ref = useObjectRef(forwardedRef as React.ForwardedRef<HTMLInputElement>);
    const description = error && errorText ? undefined : supportingText;

    const [revealed, setRevealed] = useState(false);
    const isPassword = rest.type === 'password';
    const showReveal = (revealable ?? isPassword) && isPassword && !multiline;
    // While revealed the input really is a text input, which is the only way a browser shows the
    // characters. Hiding it again puts the type back, so autofill and password managers still
    // recognise the field.
    const effectiveType = showReveal && revealed ? 'text' : rest.type;

    const ariaProps = {
      ...rest,
      type: effectiveType,
      label,
      placeholder,
      description,
      errorMessage: error ? errorText : undefined,
      isInvalid: error,
      isDisabled: disabled,
      isReadOnly: readOnly,
      isRequired: required,
      validationBehavior,
      onChange,
      maxLength,
      inputElementType: multiline ? ('textarea' as const) : ('input' as const),
    };

    const { labelProps, inputProps, descriptionProps, errorMessageProps } = useTextField(
      ariaProps,
      ref,
    );
    const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
    const { focusProps, isFocusVisible, isFocused } = useFocusRing({ isTextInput: true, within: true });

    // The label floats once there is anything to sit above: a value, focus, or a placeholder
    // showing through.
    const value = (props.value ?? inputProps.value ?? '') as string;
    const populated = value.length > 0 || Boolean(placeholder) || isFocused;
    const counterId = useId();
    const showCounter = maxLength !== undefined;

    const slot = (name: TextFieldSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    // The counter is announced with the field, alongside whatever React Aria already linked.
    const describedBy =
      [inputProps['aria-describedby'], showCounter ? counterId : null].filter(Boolean).join(' ') ||
      undefined;
    const inputClass = slot('input', 'grange-text-field-input', styles.input);

    return (
      <div
        className={slot('root', 'grange-text-field', styles.root)}
        style={style}
        data-variant={variant}
        data-populated={populated || undefined}
        data-focused={isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-hovered={isHovered || undefined}
        data-error={error || undefined}
        data-disabled={disabled || undefined}
        data-multiline={multiline || undefined}
      >
        <div {...hoverProps} className={slot('container', 'grange-text-field-container', styles.container)}>
          {variant === 'outlined' && (
            // A real fieldset and legend, so the notch is exactly the label's width and the
            // border closes up again when the label drops back inside.
            <fieldset className={styles.outline} aria-hidden="true">
              <legend className={styles.notch}>
                <span>{label}</span>
              </legend>
            </fieldset>
          )}

          {leadingIcon && (
            <span className={slot('leadingIcon', 'grange-text-field-leading-icon', styles.icon)}>
              {leadingIcon}
            </span>
          )}

          <div className={styles.field}>
            {label != null && (
              <label {...labelProps} className={slot('label', 'grange-text-field-label', styles.label)}>
                {label}
              </label>
            )}
            <div className={styles.inputRow}>
              {prefix && <span className={styles.affix}>{prefix}</span>}
              {multiline ? (
                <textarea
                  {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                  {...focusProps}
                  ref={ref as unknown as React.Ref<HTMLTextAreaElement>}
                  rows={rows}
                  aria-describedby={describedBy}
                  className={inputClass}
                />
              ) : (
                <input
                  {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
                  {...focusProps}
                  ref={ref}
                  aria-describedby={describedBy}
                  className={inputClass}
                />
              )}
              {suffix && <span className={styles.affix}>{suffix}</span>}
            </div>
          </div>

          {trailingIcon && (
            <span className={slot('trailingIcon', 'grange-text-field-trailing-icon', styles.icon)}>
              {trailingIcon}
            </span>
          )}

          {showReveal && (
            <RevealButton
              className={slot('reveal', 'grange-text-field-reveal', styles.reveal)}
              revealed={revealed}
              label={revealed ? hideLabel : revealLabel}
              disabled={disabled}
              onToggle={() => setRevealed((was) => !was)}
            />
          )}

          {variant === 'filled' && <span className={styles.indicator} aria-hidden="true" />}
        </div>

        {(description != null || (error && errorText != null) || showCounter) && (
          <div className={slot('supporting', 'grange-text-field-supporting', styles.supporting)}>
            <span>
              {error && errorText != null ? (
                <span {...errorMessageProps}>{errorText}</span>
              ) : description != null ? (
                <span {...descriptionProps}>{description}</span>
              ) : null}
            </span>
            {showCounter && (
              <span id={counterId} className={styles.counter}>
                {counterText(value.length, maxLength)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

export type VariantTextFieldProps = Omit<TextFieldProps, 'variant'>;

/** `md-filled-text-field`. */
export const FilledTextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, VariantTextFieldProps>(
  function FilledTextField(props, ref) {
    return <TextField {...props} ref={ref} variant="filled" />;
  },
);

/** `md-outlined-text-field`. */
export const OutlinedTextField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  VariantTextFieldProps
>(function OutlinedTextField(props, ref) {
  return <TextField {...props} ref={ref} variant="outlined" />;
});

/**
 * The reveal toggle.
 *
 * A plain `<button>` routed through `useButton`, not an `IconButton`: it has to sit inside the
 * field's container at the icon's size, and an IconButton would bring its own 40px box, state
 * layer and ripple into a 56px row. `useButton` is still what gives it the press behavior and
 * keeps `type="button"` on it, so it cannot submit the form the field is in.
 *
 * It is `aria-pressed`, which is what says whether the password is showing. Focus stays on the
 * button after a toggle, so it can be pressed again without hunting for it.
 */
function RevealButton({
  className,
  revealed,
  label,
  disabled,
  onToggle,
}: {
  className: string;
  revealed: boolean;
  label: string;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(
    { onPress: onToggle, isDisabled: disabled, 'aria-label': label, 'aria-pressed': revealed },
    ref,
  );

  return (
    <button {...buttonProps} ref={ref} className={className}>
      <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
        {revealed ? (
          // Material Symbols visibility_off
          <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q142 0 261.5 78T912-500q-22 57-58.5 104T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-146 0-266.5-81.5T28-500q21-53 53-98.5t73-81.5L56-856l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Z" />
        ) : (
          // Material Symbols visibility
          <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T28-500q66-137 186-218.5T480-800q146 0 266 81.5T932-500q-66 137-186 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
        )}
      </svg>
    </button>
  );
}
