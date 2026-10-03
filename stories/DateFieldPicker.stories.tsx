import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import { CalendarDate } from '@internationalized/date';
import {
  DateField,
  DatePicker,
  FilledButton,
  Form,
  OutlinedDateField,
  OutlinedDatePicker,
  TimeField,
} from '../src';
import { HeartIcon } from './icons';

/**
 * Phase 3 begins: a date typed in parts, and the same field with a calendar behind it.
 *
 * Every story here is pinned to a fixed date rather than `today()`. The visual tests shoot them
 * in a container that runs on UTC while a developer's machine does not, so for part of every day
 * the two disagree about what day it is — which the suite caught once already.
 */
const meta: Meta = {
  title: 'Components/Date field and Date picker',
  parameters: { layout: 'padded' },
};
export default meta;

/** Pinned, and in the past, so nothing in these shots depends on when they were taken. */
const PINNED = new CalendarDate(2026, 7, 15);

const column = { display: 'flex', flexDirection: 'column' as const, gap: 24, maxWidth: 360 };

/**
 * Each part is its own target: the arrows change it, typing fills it. This is not an
 * `<input type="date">` and not a text field with a format string — the order of the parts and
 * the separators between them come from the locale.
 */
export const Fields: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<CalendarDate | null>(PINNED);
    return (
      <div style={column}>
        <DateField label="Date" value={value} onChange={setValue} supportingText="Try the arrow keys" />
        <p className="sb-label">{value ? value.toString() : 'nothing'}</p>
        <OutlinedDateField label="Outlined" defaultValue={PINNED} />
        <DateField label="Empty" supportingText="Placeholder segments until something is typed" />
        <DateField label="With an icon" defaultValue={PINNED} leadingIcon={<HeartIcon />} />
      </div>
    );
  },
};

/**
 * The same component in four locales. A British user types the day first, an American the month
 * first, and a Japanese user the year first — with nothing here knowing which.
 */
export const Locales: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {['en-GB', 'en-US', 'ja-JP', 'de-DE'].map((locale) => (
        <div key={locale} className="sb-col" style={{ maxWidth: 220 }}>
          <p className="sb-label">{locale}</p>
          <I18nProvider locale={locale}>
            <DateField label="Date" defaultValue={PINNED} />
          </I18nProvider>
        </div>
      ))}
    </div>
  ),
};

/** More precision adds the time parts to the same field. */
export const Granularity: StoryObj = {
  render: () => (
    <div style={column}>
      <DateField label="Day" defaultValue={PINNED} />
      <DateField label="To the minute" granularity="minute" />
      <DateField label="To the minute, 24 hour" granularity="minute" hourCycle={24} />
      <TimeField label="Time only, for comparison" supportingText="The time picker's own input mode" />
    </div>
  ),
};

/**
 * The limits are validation, not a clamp. The arrows will take the value outside the range and
 * the field says so; it is the app that decides whether to accept it.
 */
export const States: StoryObj = {
  render: () => (
    <div style={column}>
      <DateField
        label="This month only"
        defaultValue={PINNED}
        minValue={new CalendarDate(2026, 7, 1)}
        maxValue={new CalendarDate(2026, 7, 31)}
        supportingText="Arrow past the end and watch it complain"
      />
      <DateField
        label="Already out of range"
        value={new CalendarDate(2026, 6, 10)}
        minValue={new CalendarDate(2026, 7, 1)}
      />
      <DateField label="Disabled" defaultValue={PINNED} disabled />
      <DateField label="Read only" defaultValue={PINNED} readOnly />
      <DateField label="In error" defaultValue={PINNED} error errorText="We are closed that day" />
    </div>
  ),
};

/**
 * Two ways in, one value: the segments for someone who knows the date, the grid for someone
 * choosing one. Opening it shows the month the value is in rather than this one.
 *
 * The button has no label of its own, and there is none to give — `useDatePicker` names it by
 * the field, which wins over any `aria-label`. That is the third component here where that is
 * true, after the combo box's chevron and a menu opened from a button.
 */
export const Pickers: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<CalendarDate | null>(PINNED);
    return (
      <div style={column}>
        <DatePicker label="Date" value={value} onChange={setValue} supportingText="Type it or pick it" />
        <p className="sb-label">{value ? value.toString() : 'nothing'}</p>
        <OutlinedDatePicker label="Outlined" defaultValue={PINNED} />
        <DatePicker label="Empty" />
        <DatePicker
          label="Weekends unavailable"
          defaultValue={PINNED}
          isDateUnavailable={(date) => {
            const day = date.toDate('UTC').getUTCDay();
            return day === 0 || day === 6;
          }}
          supportingText="Saturdays and Sundays are struck through"
        />
        <DatePicker label="Disabled" defaultValue={PINNED} disabled />
      </div>
    );
  },
};

/** In a form, with an error pushed in by name like any other field. */
export const InAForm: StoryObj = {
  render: () => (
    <div style={column}>
      <Form
        aria-label="Booking"
        validate={() => ({ when: 'Choose a weekday' })}
        actions={<FilledButton type="submit">Book</FilledButton>}
      >
        <DatePicker label="Arriving" name="when" />
        <DateField label="Leaving" name="until" supportingText="Optional" />
      </Form>
    </div>
  ),
};
