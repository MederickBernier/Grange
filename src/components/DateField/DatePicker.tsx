import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useButton, useDateField, useDatePicker, useFocusRing, useHover, useLocale } from 'react-aria';
import { useDateFieldState, useDatePickerState } from 'react-stately';
import { createCalendar, type CalendarDate, type DateValue } from '@internationalized/date';
import { Calendar } from '../Calendar/Calendar';
import { Popover } from '../../overlays/Popover';
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
import menuStyles from '../Menu/Menu.module.scss';
import fieldStyles from './DateField.module.scss';
import styles from './DatePicker.module.scss';

export interface DatePickerProps {
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  value?: CalendarDate | null;
  defaultValue?: CalendarDate | null;
  onChange?: (value: CalendarDate | null) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  /** Marks individual dates as unavailable, rather than a whole range. */
  isDateUnavailable?: (date: DateValue) => boolean;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
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
 * A date field with a calendar in a popover — the docked picker the M3 spec draws.
 *
 * Two ways in, one value: the segments for someone who knows the date, the grid for someone
 * choosing one. `useDatePicker` is what keeps them agreeing — it owns the value, hands the field
 * its segments and the calendar its month, and makes opening the popover show the month the
 * value is in rather than this one.
 *
 * The modal variant is not a different component: put a `Calendar` in a `Dialog`, which the
 * calendar's own story shows. This is the inline one.
 */
export function DatePicker(props: DatePickerProps) {
  const { defaults, slots } = useComponentConfig('DatePicker');
  const {
    label,
    variant = defaults?.variant ?? 'filled',
    supportingText,
    error,
    errorText,
    leadingIcon,
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

  const state = useDatePickerState(ariaProps);
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    labelProps,
    groupProps,
    fieldProps,
    buttonProps: openCalendar,
    calendarProps,
    descriptionProps,
    errorMessageProps,
    isInvalid,
    validationErrors,
  } = useDatePicker(ariaProps, state, groupRef);

  // The segments are their own field state, which is what useDatePicker's fieldProps are for.
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldState = useDateFieldState({ ...fieldProps, locale, createCalendar });
  const { fieldProps: segmentsProps } = useDateField(fieldProps, fieldState, fieldRef);

  // buttonProps are button options and not DOM props, as everywhere else here.
  const { buttonProps } = useButton(openCalendar, buttonRef);
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible, isFocused } = useFocusRing({ within: true });

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
        root: slot('root', 'grange-date-picker', textStyles.root),
        container: slot('container', 'grange-date-picker-container', textStyles.container),
        label: slot('label', 'grange-date-picker-label', textStyles.label),
        supporting: slot('supporting', 'grange-date-picker-supporting', textStyles.supporting),
        leadingIcon: slot('leadingIcon', 'grange-date-picker-leading-icon', textStyles.icon),
      }}
      state={{
        populated: true,
        focused: isFocused || state.isOpen,
        focusVisible: isFocusVisible,
        hovered: isHovered,
        error: invalid,
        disabled,
      }}
      label={label}
      labelProps={labelProps}
      // The group is what the label names: the segments and the button are one control together.
      containerProps={{ ...groupProps, ...hoverProps, ref: groupRef } as React.HTMLAttributes<HTMLElement>}
      leadingIcon={leadingIcon}
      trailing={
        /*
         * No aria-label. useDatePicker labels this button by the field, through an
         * aria-labelledby that wins over any label given here — the third component in this
         * library where that is true, after the combo box's chevron and a menu opened from a
         * button. A prop for it would sit in the API looking like it worked.
         */
        <button
          {...buttonProps}
          ref={buttonRef}
          className={`${textStyles.icon} ${styles.calendarButton}`}
          data-open={state.isOpen || undefined}
        >
          <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            {/* Material Symbols calendar_today */}
            <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
          </svg>
        </button>
      }
      supporting={showingError ? message : supportingText}
      supportingProps={showingError ? errorMessageProps : descriptionProps}
    >
      <div
        {...segmentsProps}
        {...focusProps}
        ref={fieldRef}
        aria-describedby={describes}
        className={slot('input', 'grange-date-picker-input', fieldStyles.segments)}
      >
        {fieldState.segments.map((segment, i) => (
          <Segment key={i} segment={segment} state={fieldState} className={fieldStyles.segment} />
        ))}
      </div>

      {state.isOpen && (
        <Popover state={state} triggerRef={groupRef} placement="bottom" className={menuStyles.popover}>
          <div className={styles.panel}>
            {/*
              Cast because React Aria's types are generic over DateValue — the same hooks drive
              a date-time picker — while Calendar's public props are a CalendarDate, so that
              `onChange` hands an app the type it actually configured. Narrowing at the one place
              that knows the value is a plain date beats widening the API for everyone.
            */}
            <Calendar
              {...(calendarProps as React.ComponentProps<typeof Calendar>)}
              // Focus goes into the grid, or neither the arrows nor Escape would do anything —
              // the same thing the combo box's list and the context menu both needed.
              autoFocus
              classNames={{ root: styles.calendar }}
            />
          </div>
        </Popover>
      )}
    </FieldShell>
  );
}

export type VariantDatePickerProps = Omit<DatePickerProps, 'variant'>;

/** The filled variant. */
export function FilledDatePicker(props: VariantDatePickerProps) {
  return <DatePicker {...props} variant="filled" />;
}

/** The outlined variant. */
export function OutlinedDatePicker(props: VariantDatePickerProps) {
  return <DatePicker {...props} variant="outlined" />;
}
