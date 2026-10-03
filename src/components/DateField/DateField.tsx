import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useDateField, useFocusRing, useHover, useLocale } from 'react-aria';
import { useDateFieldState } from 'react-stately';
import type { CalendarDate, DateValue } from '@internationalized/date';
import { createCalendar } from '@internationalized/date';
import { FieldShell } from '../TextField/FieldShell';
import { describedBy, type TextFieldVariant } from '../TextField/specs';
import {
  resolveSlotClass,
  useComponentConfig,
  type DateFieldSlot,
  type SlotOverrides,
} from '../../config/config';
import { Segment } from './Segment';
import textStyles from '../TextField/TextField.module.scss';
import styles from './DateField.module.scss';

export interface DateFieldProps {
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  value?: CalendarDate | null;
  defaultValue?: CalendarDate | null;
  onChange?: (value: CalendarDate | null) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  /** How precise to go. A day by default; `minute` adds the time segments. */
  granularity?: 'day' | 'hour' | 'minute' | 'second';
  /** 12 or 24 hour, when there are time segments. Left out, it follows the locale. */
  hourCycle?: 12 | 24;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  validationBehavior?: 'aria' | 'native';
  name?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<DateFieldSlot>;
}

/**
 * A date typed in segments rather than into a text box — the catalog's DateInput, and
 * `TimeField`'s sibling.
 *
 * Each part is its own target: the arrows change it, typing fills it, and the order of the parts
 * and the separators between them follow the locale. That is the whole reason this is not an
 * `<input type="date">` or a text field with a format string — a British user types the day
 * first and an American user types the month first, into the same component, with nothing here
 * knowing which.
 *
 * The geometry is the text field's, which is captured; the time picker's own input mode draws
 * much larger segment boxes from TimeInputTokens, and that is specific to the picker rather than
 * to a field. Only the behaviour is shared, through `Segment`.
 */
export function DateField(props: DateFieldProps) {
  const { defaults, slots } = useComponentConfig('DateField');
  const {
    label,
    variant = defaults?.variant ?? 'filled',
    supportingText,
    error,
    errorText,
    leadingIcon,
    trailingIcon,
    disabled,
    readOnly,
    required,
    validationBehavior = 'aria',
    className,
    classNames,
    style,
    ...rest
  } = props;

  const { locale } = useLocale();
  const ariaProps = {
    ...rest,
    label,
    isDisabled: disabled,
    isReadOnly: readOnly,
    isRequired: required,
    isInvalid: error,
    description: supportingText,
    errorMessage: error ? errorText : undefined,
    validationBehavior,
  };

  const state = useDateFieldState({ ...ariaProps, locale, createCalendar });
  const ref = useRef<HTMLDivElement>(null);
  const { labelProps, fieldProps, descriptionProps, errorMessageProps, isInvalid, validationErrors } =
    useDateField(ariaProps, state, ref);

  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible, isFocused } = useFocusRing({ within: true });

  // The hook's verdict as well as the prop, which is what lets a Form push an error in by name.
  const invalid = error || isInvalid;
  const message = errorText ?? (validationErrors.length > 0 ? validationErrors.join(' ') : undefined);
  const showingError = invalid && message != null;
  const describes = describedBy([
    { id: errorMessageProps.id, shown: showingError },
    { id: descriptionProps.id, shown: !showingError && supportingText != null },
  ]);

  const slot = (name: DateFieldSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <FieldShell
      variant={variant}
      style={style}
      classes={{
        root: slot('root', 'grange-date-field', textStyles.root),
        container: slot('container', 'grange-date-field-container', textStyles.container),
        label: slot('label', 'grange-date-field-label', textStyles.label),
        supporting: slot('supporting', 'grange-date-field-supporting', textStyles.supporting),
        leadingIcon: slot('leadingIcon', 'grange-date-field-leading-icon', textStyles.icon),
        trailingIcon: slot('trailingIcon', 'grange-date-field-trailing-icon', textStyles.icon),
      }}
      state={{
        // A date field always shows something — the placeholder segments — so the label has
        // nowhere to sit inside it and floats from the start.
        populated: true,
        focused: isFocused,
        focusVisible: isFocusVisible,
        hovered: isHovered,
        error: invalid,
        disabled,
      }}
      label={label}
      labelProps={labelProps}
      containerProps={hoverProps}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      supporting={showingError ? message : supportingText}
      supportingProps={showingError ? errorMessageProps : descriptionProps}
    >
      <div
        {...fieldProps}
        {...focusProps}
        ref={ref}
        aria-describedby={describes}
        className={slot('input', 'grange-date-field-input', styles.segments)}
      >
        {state.segments.map((segment, i) => (
          <Segment key={i} segment={segment} state={state} className={styles.segment} />
        ))}
      </div>
    </FieldShell>
  );
}

export type VariantDateFieldProps = Omit<DateFieldProps, 'variant'>;

/** The filled variant, to match the other fields. */
export function FilledDateField(props: VariantDateFieldProps) {
  return <DateField {...props} variant="filled" />;
}

/** The outlined variant. */
export function OutlinedDateField(props: VariantDateFieldProps) {
  return <DateField {...props} variant="outlined" />;
}
