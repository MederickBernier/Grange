import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import { CalendarDate, CalendarDateTime } from '@internationalized/date';
import {
  Calendar,
  DateRangePicker,
  DateTimePicker,
  FilledButton,
  Form,
  RangeCalendar,
  eachDay,
  formatRange,
  rangeLength,
  weekRange,
} from '../src';

/**
 * The rest of phase 3: a span, a date with a time, several months at once, and the date
 * arithmetic the first three wanted.
 *
 * Pinned to a fixed date, as the other calendar stories are: the screenshots are taken in a
 * container on UTC while a developer's machine is not, so `today()` drifts.
 */
const meta: Meta = {
  title: 'Components/Date range, Date-time and Multi-view',
  parameters: { layout: 'padded' },
};
export default meta;

const PINNED = new CalendarDate(2026, 7, 15);
const RANGE = { start: new CalendarDate(2026, 7, 10), end: new CalendarDate(2026, 7, 20) };
const column = { display: 'flex', flexDirection: 'column' as const, gap: 24, maxWidth: 420 };

/**
 * Two fields and a range calendar over one span. The fields are not independent: the end cannot
 * precede the start, and typing into either re-validates the pair rather than the part.
 *
 * The calendar shows two months by default, because picking a span across a month boundary with
 * one month visible means paging back and forth to see both ends.
 */
export const Ranges: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<typeof RANGE | null>(RANGE);
    return (
      <div style={column}>
        <DateRangePicker label="Stay" value={value} onChange={setValue} supportingText="Type it or pick it" />
        <p className="sb-label">
          {value ? `${formatRange(value, 'en-GB')} — ${rangeLength(value)} nights` : 'nothing chosen'}
        </p>
        <DateRangePicker label="One month at a time" defaultValue={RANGE} visibleMonths={1} />
        <DateRangePicker
          label="End before start"
          value={{ start: new CalendarDate(2026, 7, 20), end: new CalendarDate(2026, 7, 10) }}
          supportingText="The pair is what gets validated"
        />
        <DateRangePicker label="Disabled" defaultValue={RANGE} disabled />
      </div>
    );
  },
};

/** A date and a time in one field: the calendar still picks the day, the segments take the hour. */
export const DateTimes: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<CalendarDateTime | null>(new CalendarDateTime(2026, 7, 15, 9, 30));
    return (
      <div style={column}>
        <DateTimePicker label="When" value={value} onChange={setValue} />
        <p className="sb-label">{value ? value.toString() : 'nothing'}</p>
        <DateTimePicker
          label="24 hour"
          defaultValue={new CalendarDateTime(2026, 7, 15, 17, 5)}
          hourCycle={24}
        />
        <div className="sb-row" style={{ gap: 24, flexWrap: 'wrap' }}>
          {['en-US', 'en-GB'].map((locale) => (
            <div key={locale} className="sb-col" style={{ maxWidth: 200 }}>
              <p className="sb-label">{locale}</p>
              <I18nProvider locale={locale}>
                <DateTimePicker label="When" defaultValue={new CalendarDateTime(2026, 7, 15, 17, 5)} />
              </I18nProvider>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

/**
 * Several months at once — the catalog's MultiViewCalendar. Each month is its own grid, because a
 * grid's arrow keys move within a month and a screen reader reads its caption; two months in one
 * table would be wrong about both.
 *
 * A week at the edge of a month runs into the next one and those days are left blank, or the same
 * day would appear in two grids, selectable twice.
 */
export const MultiView: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 32 }}>
      <div className="sb-col">
        <p className="sb-label">Two months, paging two at a time (React Aria’s default)</p>
        <Calendar aria-label="Two months" defaultValue={PINNED} visibleMonths={2} />
      </div>
      <div className="sb-col">
        <p className="sb-label">Three months, paging one at a time</p>
        <Calendar aria-label="Three months" defaultValue={PINNED} visibleMonths={3} pageBehavior="single" />
      </div>
      <div className="sb-col">
        <p className="sb-label">A range across two months</p>
        <RangeCalendar aria-label="A span" defaultValue={RANGE} visibleMonths={2} />
      </div>
      <div className="sb-col">
        <p className="sb-label">Centred on the value rather than starting at it</p>
        <Calendar aria-label="Centred" defaultValue={PINNED} visibleMonths={3} align="center" />
      </div>
    </div>
  ),
};

/**
 * The date arithmetic, which is deliberately thin: `@internationalized/date` already does the
 * hard parts, so this is the handful of range operations it does not have, plus one formatter.
 */
export const DateMath: StoryObj = {
  render: () => {
    const week = weekRange(PINNED, 'en-GB');
    return (
      <div style={column}>
        <p className="sb-label">
          The span: {formatRange(RANGE, 'en-GB')} — one year, collapsed, because
          `Intl.DateTimeFormat.formatRange` knows what the two ends share.
        </p>
        <p className="sb-label">
          Across a year end:{' '}
          {formatRange({ start: new CalendarDate(2026, 12, 30), end: new CalendarDate(2027, 1, 2) }, 'en-GB')}
        </p>
        <p className="sb-label">{rangeLength(RANGE)} days, counting both ends</p>
        <p className="sb-label">
          The week 15 July falls in, in Britain: {week.start.toString()} to {week.end.toString()} — a Monday.
          In the United States it starts the day before.
        </p>
        <p className="sb-label">
          Every day in a short span:{' '}
          {eachDay({ start: PINNED, end: PINNED.add({ days: 3 }) })
            .map((d) => d.day)
            .join(', ')}
        </p>
      </div>
    );
  },
};

/** All three in a form, with errors pushed in by name like any other field. */
export const InAForm: StoryObj = {
  render: () => (
    <div style={column}>
      <Form
        aria-label="Booking"
        validate={() => ({ stay: 'We are full that week' })}
        actions={<FilledButton type="submit">Book</FilledButton>}
      >
        <DateRangePicker label="Stay" name="stay" defaultValue={RANGE} />
        <DateTimePicker label="Arriving at" name="arriving" />
      </Form>
    </div>
  ),
};
