import { forwardRef, useRef, type CSSProperties, type ReactNode } from 'react';
import { mergeProps, useButton, useFocusRing, useHover, useLocale, useNumberField, useObjectRef } from 'react-aria';
import { useNumberFieldState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type NumberFieldSlot,
  type SlotOverrides,
} from '../../config/config';
import { FieldShell } from '../TextField/FieldShell';
import { describedBy, type TextFieldVariant } from '../TextField/specs';
import textStyles from '../TextField/TextField.module.scss';
import styles from './NumberField.module.scss';

export interface NumberFieldProps {
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  /** How much the steppers and the arrow keys move. Defaults to 1. */
  step?: number;
  /**
   * Passed to `Intl.NumberFormat`, which is what decides how the value reads *and* what counts
   * as a valid thing to type: `{ style: 'currency', currency: 'EUR' }` accepts "€1.234,56" in a
   * German locale and "€1,234.56" in an English one, without the component knowing either.
   */
  formatOptions?: Intl.NumberFormatOptions;
  /** Hides the stepper buttons, for a field where typing is the only sensible way in. */
  hideStepper?: boolean;
  incrementLabel?: string;
  decrementLabel?: string;
  placeholder?: string;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  validationBehavior?: 'aria' | 'native';
  name?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<NumberFieldSlot>;
}

/**
 * A number field, on React Aria's useNumberField.
 *
 * It is not `<input type="number">`, and that is the point. A native number input disagrees with
 * itself across browsers about the spinner, loses the value to a stray letter, cannot be given a
 * currency or a percent format, and reads a decimal comma as nothing at all. This parses and
 * formats through `Intl.NumberFormat` for the current locale, so a German user types "1.234,56"
 * and an English one types "1,234.56" into the same component.
 *
 * The stepper buttons are not in the M3 spec, which draws a number as ordinary text in a text
 * field. They are here because a number field without them is a worse control, and their
 * geometry is chosen rather than captured; `specs.ts` says so. `hideStepper` removes them.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(props, forwardedRef) {
    const { defaults, slots } = useComponentConfig('NumberField');
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
      disabled,
      readOnly,
      required,
      validationBehavior = 'aria',
      name,
      hideStepper = defaults?.hideStepper ?? false,
      incrementLabel,
      decrementLabel,
      placeholder,
      className,
      classNames,
      style,
      ...rest
    } = props;

    const { locale } = useLocale();
    const ref = useObjectRef(forwardedRef);
    const description = supportingText;

    const ariaProps = {
      ...rest,
      name,
      label,
      description,
      errorMessage: error ? errorText : undefined,
      isInvalid: error,
      isDisabled: disabled,
      isReadOnly: readOnly,
      isRequired: required,
      validationBehavior,
    };

    const state = useNumberFieldState({ ...ariaProps, locale });
    const {
      labelProps,
      groupProps,
      inputProps,
      incrementButtonProps,
      decrementButtonProps,
      descriptionProps,
      errorMessageProps,
      isInvalid,
      validationErrors,
    } = useNumberField(ariaProps, state, ref);

    // The hook's verdict as well as the prop, which is what lets a Form push an error in by name.
    const invalid = error || isInvalid;
    const message = errorText ?? (validationErrors.length > 0 ? validationErrors.join(' ') : undefined);

    const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
    const { focusProps, isFocusVisible, isFocused } = useFocusRing({ isTextInput: true, within: true });

    // The label floats once there is anything to sit above it.
    const populated = state.inputValue.length > 0 || Boolean(placeholder) || isFocused;

    const slot = (name: NumberFieldSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    const stepperClass = slot('stepper', 'grange-number-field-stepper', styles.stepper);
    const showingError = invalid && message != null;
    // Only the message on screen: the hook links both, and the other one is not rendered.
    const describes = describedBy([
      { id: errorMessageProps.id, shown: showingError },
      { id: descriptionProps.id, shown: !showingError && description != null },
    ]);

    return (
      <FieldShell
        variant={variant}
        style={style}
        classes={{
          root: slot('root', 'grange-number-field', `${textStyles.root} ${styles.root}`),
          container: slot('container', 'grange-number-field-container', textStyles.container),
          label: slot('label', 'grange-number-field-label', textStyles.label),
          supporting: slot('supporting', 'grange-number-field-supporting', textStyles.supporting),
          leadingIcon: slot('leadingIcon', 'grange-number-field-leading-icon', textStyles.icon),
          trailingIcon: slot('trailingIcon', 'grange-number-field-trailing-icon', textStyles.icon),
        }}
        state={{
          populated,
          focused: isFocused,
          focusVisible: isFocusVisible,
          hovered: isHovered,
          error: invalid,
          disabled,
        }}
        label={label}
        /*
         * labelProps goes on untouched. The hook generates an id for the label and points both
         * the group's aria-labelledby and the input's at it; overriding that id leaves the input
         * labelled by an element that does not exist, and the field loses its accessible name
         * without anything looking wrong.
         */
        labelProps={labelProps}
        containerProps={mergeProps(groupProps, hoverProps)}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        trailing={
          !hideStepper && (
            <span className={stepperClass}>
              <StepButton
                {...incrementButtonProps}
                label={incrementLabel ?? 'Increase'}
                className={styles.step}
                direction="up"
              />
              <StepButton
                {...decrementButtonProps}
                label={decrementLabel ?? 'Decrease'}
                className={styles.step}
                direction="down"
              />
            </span>
          )
        }
        prefix={prefix}
        suffix={suffix}
        supporting={showingError ? message : description}
        supportingProps={showingError ? errorMessageProps : descriptionProps}
      >
        {/*
          mergeProps, not two spreads: useFocusRing also returns onFocus and onBlur, and
          spreading it second replaces the hook's own onBlur — which is what commits the typed
          text to a number. The field still types and still formats on mount, so nothing looks
          broken; it simply never reports a value.
        */}
        <input
          {...mergeProps(inputProps, focusProps)}
          ref={ref}
          placeholder={placeholder}
          aria-describedby={describes}
          className={slot('input', 'grange-number-field-input', textStyles.input)}
        />
        {/*
          The value, for the form. React Aria strips name and form off the visible input on
          purpose — it holds formatted text like "€1,234.56", which is not what should be posted —
          and expects a hidden input to carry the number. Without this the field never appears in
          the submitted data at all, and nothing about it looks wrong.
        */}
        {name !== undefined && (
          <input
            type="hidden"
            name={name}
            value={Number.isNaN(state.numberValue) ? '' : String(state.numberValue)}
          />
        )}
      </FieldShell>
    );
  },
);

/**
 * One stepper button.
 *
 * `incrementButtonProps` and `decrementButtonProps` are button *options*, not DOM props: spread
 * straight onto a `<button>` they look right and do nothing, because what they carry is
 * `onPressStart` and the hook's own hold-to-repeat behaviour. They have to go through
 * `useButton`, which is also what keeps the press from stealing focus off the input.
 */
function StepButton({
  label,
  className,
  direction,
  ...options
}: Parameters<typeof useButton>[0] & { label: string; className?: string; direction: 'up' | 'down' }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton({ ...options, 'aria-label': label }, ref);

  return (
    <button {...buttonProps} ref={ref} className={className} data-direction={direction}>
      <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
        {direction === 'up' ? (
          // Material Symbols keyboard_arrow_up
          <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
        ) : (
          <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
        )}
      </svg>
    </button>
  );
}

export type VariantNumberFieldProps = Omit<NumberFieldProps, 'variant'>;

/** The filled variant, to match `FilledTextField`. */
export const FilledNumberField = forwardRef<HTMLInputElement, VariantNumberFieldProps>(
  function FilledNumberField(props, ref) {
    return <NumberField {...props} ref={ref} variant="filled" />;
  },
);

/** The outlined variant, to match `OutlinedTextField`. */
export const OutlinedNumberField = forwardRef<HTMLInputElement, VariantNumberFieldProps>(
  function OutlinedNumberField(props, ref) {
    return <NumberField {...props} ref={ref} variant="outlined" />;
  },
);
