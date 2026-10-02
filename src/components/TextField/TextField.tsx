import { forwardRef, useId, type CSSProperties, type ReactNode } from 'react';
import { useFocusRing, useHover, useObjectRef, useTextField } from 'react-aria';
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
      className,
      classNames,
      style,
      onChange,
      ...rest
    } = props;

    const ref = useObjectRef(forwardedRef as React.ForwardedRef<HTMLInputElement>);
    const description = error && errorText ? undefined : supportingText;

    const ariaProps = {
      ...rest,
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
