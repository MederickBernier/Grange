import { useRef, type CSSProperties, type ReactNode } from 'react';
import {
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
  useLocale,
  useRangeCalendar,
} from 'react-aria';
import {
  useCalendarState,
  useRangeCalendarState,
  type CalendarState,
  type RangeCalendarState,
} from 'react-stately';
import {
  createCalendar,
  getLocalTimeZone,
  getWeeksInMonth,
  isToday as isDateToday,
  type CalendarDate,
  type DateValue,
} from '@internationalized/date';
import { IconButton } from '../Button/Button';
import { resolveSlotClass, useComponentConfig, type CalendarSlot, type SlotOverrides } from '../../config/config';
import styles from './Calendar.module.scss';

interface CommonProps {
  /** The visible label for the whole calendar. */
  label?: ReactNode;
  minValue?: CalendarDate;
  maxValue?: CalendarDate;
  /**
   * Marks individual dates as unavailable — a closed day, a booked one — rather than a range.
   *
   * Takes a `DateValue` rather than a `CalendarDate`, because that is what React Aria hands it:
   * the same callback is used by the date-time pickers, where the value carries a time as well.
   */
  isDateUnavailable?: (date: DateValue) => boolean;
  /**
   * Which month is on screen, and when it changes. A date picker drives these, so that opening
   * it shows the month the value is in rather than this one.
   */
  focusedValue?: CalendarDate;
  defaultFocusedValue?: CalendarDate;
  onFocusChange?: (date: CalendarDate) => void;
  /** Takes focus when it appears, which a calendar in a popover needs. */
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<CalendarSlot>;
}

export interface CalendarProps extends CommonProps {
  value?: CalendarDate | null;
  defaultValue?: CalendarDate | null;
  onChange?: (value: CalendarDate) => void;
}

export interface RangeCalendarProps extends CommonProps {
  value?: { start: CalendarDate; end: CalendarDate } | null;
  defaultValue?: { start: CalendarDate; end: CalendarDate } | null;
  onChange?: (value: { start: CalendarDate; end: CalendarDate }) => void;
}

/**
 * A month grid for picking one date.
 *
 * React Aria does the part that is genuinely hard and easy to get quietly wrong: which day the
 * week starts on, the weekday names, the month and year names, and the arithmetic for calendars
 * that are not Gregorian. All of that follows the locale rather than an assumption, which is why
 * `createCalendar` is handed over rather than a hand-rolled month table.
 *
 * The modal panel is not here. A calendar goes inside a `Dialog`, which already owns the scrim,
 * the focus trap and the scroll lock.
 */
export function Calendar(props: CalendarProps) {
  const { slots } = useComponentConfig('Calendar');
  const { className, classNames, style, disabled, readOnly, ...rest } = props;
  const { locale } = useLocale();

  const state = useCalendarState({
    ...rest,
    isDisabled: disabled,
    isReadOnly: readOnly,
    locale,
    createCalendar,
  });
  const ref = useRef<HTMLDivElement>(null);
  const aria = useCalendar({ ...rest, isDisabled: disabled, isReadOnly: readOnly }, state);

  return (
    <Shell
      aria={aria}
      state={state}
      slots={slots}
      classNames={classNames}
      className={className}
      style={style}
      containerRef={ref}
    />
  );
}

/** The same grid, picking a span of dates. The run between the ends is tinted as one block. */
export function RangeCalendar(props: RangeCalendarProps) {
  const { slots } = useComponentConfig('Calendar');
  const { className, classNames, style, disabled, readOnly, ...rest } = props;
  const { locale } = useLocale();

  const state = useRangeCalendarState({
    ...rest,
    isDisabled: disabled,
    isReadOnly: readOnly,
    locale,
    createCalendar,
    visibleDuration: { months: 1 },
  });
  const ref = useRef<HTMLDivElement>(null);
  const aria = useRangeCalendar({ ...rest, isDisabled: disabled, isReadOnly: readOnly }, state, ref);

  return (
    <Shell
      aria={aria as CalendarAria}
      state={state}
      slots={slots}
      classNames={classNames}
      className={className}
      style={style}
      containerRef={ref}
    />
  );
}

type AnyCalendarState = CalendarState | RangeCalendarState;
/** Derived from the hook, so it stays right if React Aria changes it. */
type CalendarAria = ReturnType<typeof useCalendar>;

function Shell({
  aria,
  state,
  slots,
  classNames,
  className,
  style,
  containerRef,
}: {
  aria: CalendarAria;
  state: AnyCalendarState;
  slots?: Partial<Record<string, Array<string | { replace: string | undefined }>>>;
  classNames?: SlotOverrides<CalendarSlot>;
  className?: string;
  style?: CSSProperties;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const slot = (name: CalendarSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const { calendarProps, prevButtonProps, nextButtonProps, title } = aria;

  return (
    <div
      {...calendarProps}
      ref={containerRef}
      className={slot('root', 'grange-calendar', styles.calendar)}
      style={style}
    >
      <div className={slot('header', 'grange-calendar-header', styles.header)}>
        <IconButton
          onPress={prevButtonProps.onPress}
          disabled={prevButtonProps.isDisabled}
          aria-label="Previous month"
        >
          <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            <path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" />
          </svg>
        </IconButton>
        <span className={styles.title}>{title}</span>
        <IconButton
          onPress={nextButtonProps.onPress}
          disabled={nextButtonProps.isDisabled}
          aria-label="Next month"
        >
          <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
          </svg>
        </IconButton>
      </div>
      <Grid state={state} cellClass={slot('cell', 'grange-calendar-cell', styles.cell)} />
    </div>
  );
}

function Grid({ state, cellClass }: { state: AnyCalendarState; cellClass: string }) {
  const { locale } = useLocale();
  const { gridProps, headerProps, weekDays } = useCalendarGrid({}, state);
  const weeks = getWeeksInMonth(state.visibleRange.start, locale);

  return (
    <table {...gridProps} className={styles.grid}>
      <thead {...headerProps}>
        <tr>
          {weekDays.map((day, i) => (
            // scope makes these column headers inside a role=grid table, which they would not
            // otherwise be announced as.
            <th key={i} scope="col" className={styles.weekday}>
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...new Array(weeks).keys()].map((week) => (
          <tr key={week}>
            {state.getDatesInWeek(week).map((date, i) =>
              date ? (
                <Cell key={i} state={state} date={date} className={cellClass} />
              ) : (
                <td key={i} />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Cell({
  state,
  date,
  className,
}: {
  state: AnyCalendarState;
  date: CalendarDate;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    isUnavailable,
    formattedDate,
  } = useCalendarCell({ date }, state, ref);
  // useCalendarCell does not report this, and "today" depends on the viewer's timezone rather
  // than on the calendar's own arithmetic.
  const isToday = isDateToday(date, getLocalTimeZone());

  return (
    <td {...cellProps} className={styles.cellWrapper}>
      <div
        {...buttonProps}
        ref={ref}
        hidden={isOutsideVisibleRange}
        className={className}
        data-selected={isSelected || undefined}
        data-today={isToday || undefined}
        data-disabled={isDisabled || undefined}
        data-unavailable={isUnavailable || undefined}
      >
        {formattedDate}
      </div>
    </td>
  );
}
