import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useButton, useDateField, useDateRangePicker, useFocusRing, useHover, useLocale } from 'react-aria';
import { useDateFieldState, useDateRangePickerState } from 'react-stately';
import { createCalendar, type CalendarDate, type DateValue } from '@internationalized/date';
import { RangeCalendar } from '../Calendar/Calendar';
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

export interface DateRangeValue {
  start: CalendarDate;
  end: CalendarDate;
}

export interface DateRangePickerProps {
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  variant?: TextFieldVariant;
  value?: DateRangeValue | null;
  defaultValue?: DateRangeValue | null;
  onChange?: (value: DateRangeValue | null) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  /** Marks individual dates as unavailable, rather than a whole range. */
  isDateUnavailable?: (date: DateValue) => boolean;
  /** How many months the calendar shows at once. Two is the usual choice for a range. */
  visibleMonths?: 1 | 2 | 3;
  supportingText?: ReactNode;
  error?: boolean;
  errorText?: ReactNode;
  leadingIcon?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  validationBehavior?: 'aria' | 'native';
  /** Posts as `${name}-start` and `${name}-end`, which is what a form can read back. */
  name?: string;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<DateFieldSlot>;
}

/**
 * Two date fields and a range calendar over one span.
 *
 * `useDateRangePicker` is doing more than it looks. The two fields are not independent: the end
 * cannot precede the start, typing into either re-validates the pair rather than the part, the
 * calendar has to know which end is being chosen next, and the whole thing is one labelled group
 * rather than two fields that happen to sit together. None of that is arithmetic worth
 * hand-rolling.
 *
 * The calendar shows two months by default, because choosing a span across a month boundary with
 * one month visible means paging back and forth to see both ends.
 */
export function DateRangePicker(props: DateRangePickerProps) {
  const { defaults, slots } = useComponentConfig('DateRangePicker');
  const {
    label,
    variant = defaults?.variant ?? 'filled',
    visibleMonths = defaults?.visibleMonths ?? 2,
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

  const state = useDateRangePickerState(ariaProps);
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    labelProps,
    groupProps,
    startFieldProps,
    endFieldProps,
    buttonProps: openCalendar,
    calendarProps,
    descriptionProps,
    errorMessageProps,
    isInvalid,
    validationErrors,
  } = useDateRangePicker(ariaProps, state, groupRef);

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
        root: slot('root', 'grange-date-range-picker', textStyles.root),
        container: slot('container', 'grange-date-range-picker-container', textStyles.container),
        label: slot('label', 'grange-date-range-picker-label', textStyles.label),
        supporting: slot('supporting', 'grange-date-range-picker-supporting', textStyles.supporting),
        leadingIcon: slot('leadingIcon', 'grange-date-range-picker-leading-icon', textStyles.icon),
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
      containerProps={{ ...groupProps, ...hoverProps, ref: groupRef } as React.HTMLAttributes<HTMLElement>}
      leadingIcon={leadingIcon}
      trailing={
        // Unlabelled, as the date picker's is: useDateRangePicker names it by the field.
        <button
          {...buttonProps}
          ref={buttonRef}
          className={`${textStyles.icon} ${styles.calendarButton}`}
          data-open={state.isOpen || undefined}
        >
          <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
          </svg>
        </button>
      }
      supporting={showingError ? message : supportingText}
      supportingProps={showingError ? errorMessageProps : descriptionProps}
    >
      <div {...focusProps} aria-describedby={describes} className={styles.rangeFields}>
        <RangeSegments
          props={startFieldProps}
          locale={locale}
          slotClass={slot('input', 'grange-date-range-picker-start')}
        />
        <span aria-hidden="true" className={styles.rangeDash}>
          –
        </span>
        <RangeSegments
          props={endFieldProps}
          locale={locale}
          slotClass={slot('input', 'grange-date-range-picker-end')}
        />
      </div>

      {state.isOpen && (
        <Popover state={state} triggerRef={groupRef} placement="bottom" className={menuStyles.popover}>
          <div className={styles.panel}>
            <RangeCalendar
              {...(calendarProps as React.ComponentProps<typeof RangeCalendar>)}
              visibleMonths={visibleMonths}
              autoFocus
              classNames={{ root: styles.calendar }}
            />
          </div>
        </Popover>
      )}
    </FieldShell>
  );
}

/**
 * One end of the range.
 *
 * Each end is its own field state, which is what `startFieldProps` and `endFieldProps` are for:
 * the segments of the start and the segments of the end are separate spinbuttons that happen to
 * validate together.
 */
function RangeSegments({
  props,
  locale,
  slotClass,
}: {
  props: Parameters<typeof useDateField>[0];
  locale: string;
  slotClass: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useDateFieldState({ ...props, locale, createCalendar });
  const { fieldProps } = useDateField(props, state, ref);

  return (
    <div {...fieldProps} ref={ref} className={`${slotClass} ${fieldStyles.segments}`}>
      {state.segments.map((segment, i) => (
        <Segment key={i} segment={segment} state={state} className={fieldStyles.segment} />
      ))}
    </div>
  );
}
