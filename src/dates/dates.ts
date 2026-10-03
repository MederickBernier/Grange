/**
 * The date arithmetic the pickers want and `@internationalized/date` does not give directly.
 *
 * Deliberately thin. That package is already a dependency and already does the hard parts —
 * adding and subtracting across calendars that are not Gregorian, the start of a week in a given
 * locale, parsing and formatting — and reimplementing any of it would be worse than using it.
 * What is here is the handful of range operations a date range picker and a calendar need, which
 * are genuinely absent, plus one locale-aware formatter that is easy to get wrong by hand.
 *
 * Everything takes and returns the same immutable `DateValue`s the rest of the library uses, so
 * nothing mutates and nothing needs cloning.
 */
import {
  endOfMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
  type CalendarDate,
  type DateValue,
} from '@internationalized/date';

export interface DateRange<T extends DateValue = CalendarDate> {
  start: T;
  end: T;
}

/** Whether a date is inside a span, counting both ends. */
export function isWithin(date: DateValue, range: DateRange<DateValue>): boolean {
  return date.compare(range.start) >= 0 && date.compare(range.end) <= 0;
}

/** The nearest date inside the limits, or the date itself when it is already inside them. */
export function clampDate<T extends DateValue>(date: T, minValue?: DateValue, maxValue?: DateValue): T {
  if (minValue && date.compare(minValue) < 0) return minValue as unknown as T;
  if (maxValue && date.compare(maxValue) > 0) return maxValue as unknown as T;
  return date;
}

/** A span with its ends the right way round, which a drag across a calendar can produce. */
export function orderRange<T extends DateValue>(range: DateRange<T>): DateRange<T> {
  return range.start.compare(range.end) <= 0 ? range : { start: range.end, end: range.start };
}

/** Both ends pulled inside the limits. */
export function clampRange<T extends DateValue>(
  range: DateRange<T>,
  minValue?: DateValue,
  maxValue?: DateValue,
): DateRange<T> {
  return {
    start: clampDate(range.start, minValue, maxValue),
    end: clampDate(range.end, minValue, maxValue),
  };
}

/** Whether two spans share any day. Touching at a single day counts as overlapping. */
export function rangesOverlap(a: DateRange<DateValue>, b: DateRange<DateValue>): boolean {
  return a.start.compare(b.end) <= 0 && b.start.compare(a.end) <= 0;
}

/** How many days a span covers, counting both ends, so a single day is 1. */
export function rangeLength(range: DateRange<DateValue>): number {
  const ordered = orderRange(range);
  // Through the epoch day count rather than by adding days in a loop, which would be wrong
  // across a month boundary in a non-Gregorian calendar and slow in any of them.
  const days = ordered.end.toDate('UTC').getTime() - ordered.start.toDate('UTC').getTime();
  return Math.round(days / 86_400_000) + 1;
}

/** Every day in a span, in order. */
export function eachDay<T extends DateValue>(range: DateRange<T>): T[] {
  const ordered = orderRange(range);
  const days: T[] = [];
  let cursor = ordered.start;
  while (cursor.compare(ordered.end) <= 0) {
    days.push(cursor);
    cursor = cursor.add({ days: 1 }) as T;
  }
  return days;
}

/** The whole month a date falls in. */
export function monthRange<T extends DateValue>(date: T): DateRange<T> {
  return { start: startOfMonth(date) as T, end: endOfMonth(date) as T };
}

/**
 * The whole week a date falls in, for the given locale.
 *
 * The locale is not optional on purpose: a week starts on Sunday in the United States, Monday
 * across most of Europe and Saturday in much of the Middle East, and a function that guessed
 * would be wrong somewhere.
 */
export function weekRange<T extends DateValue>(date: T, locale: string): DateRange<T> {
  const start = startOfWeek(date, locale) as T;
  return { start, end: start.add({ days: 6 }) as T };
}

/**
 * Whether a date falls on a Saturday or a Sunday.
 *
 * Saturday and Sunday specifically, not "the days this locale treats as a weekend" — those are
 * Friday and Saturday in much of the Middle East, and the Intl API exposes no way to ask. A
 * calendar that needs the local answer should decide it itself; this one is honest about what it
 * checks rather than taking a locale it would ignore.
 */
export function isWeekend(date: DateValue): boolean {
  const day = date.toDate('UTC').getUTCDay();
  return day === 0 || day === 6;
}

/** Whether two spans cover exactly the same days. */
export function sameRange(a: DateRange<DateValue>, b: DateRange<DateValue>): boolean {
  return isSameDay(a.start, b.start) && isSameDay(a.end, b.end);
}

/**
 * A span written out the way the locale writes one.
 *
 * `Intl.DateTimeFormat.formatRange` is what collapses the parts the two ends share — "15–20 July
 * 2026" rather than "15 July 2026 – 20 July 2026" — and no amount of string joining gets that
 * right across locales.
 */
export function formatRange(
  range: DateRange<DateValue>,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const formatter = new Intl.DateTimeFormat(locale, options);
  const ordered = orderRange(range);
  return formatter.formatRange(ordered.start.toDate('UTC'), ordered.end.toDate('UTC'));
}
