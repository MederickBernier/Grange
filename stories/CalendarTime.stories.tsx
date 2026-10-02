import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import { CalendarDate, Time, getLocalTimeZone, today } from '@internationalized/date';
import {
  Calendar,
  Dialog,
  FilledButton,
  RangeCalendar,
  TextButton,
  TimeField,
  timePicker,
} from '../src';

/**
 * The date and time pickers.
 *
 * React Aria does the part that is genuinely hard and quietly wrong when hand-rolled: which day
 * the week starts on, the weekday and month names, the hour cycle, and the arithmetic for
 * calendars that are not Gregorian. Switch the locale stories below and watch the grid change
 * without the component knowing anything about it.
 *
 * The clock dial, the other mode the spec draws for a time picker, is `TimePicker`: a
 * {timePicker.dialSize}px face with a {timePicker.handleSize}px handle. It has its own stories.
 */
const meta: Meta = {
  title: 'Components/Calendar and Time',
  parameters: { layout: 'padded' },
};
export default meta;

export const SingleDate: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<CalendarDate>(today(getLocalTimeZone()));
    return (
      <div className="sb-col">
        <Calendar aria-label="Pick a date" value={value} onChange={setValue} />
        <p className="sb-label">Chosen: {value.toString()}</p>
      </div>
    );
  },
};

/** A range tints the days between its ends with the secondary container. */
export const DateRange: StoryObj = {
  render: function Render() {
    const start = today(getLocalTimeZone());
    const [value, setValue] = useState({ start, end: start.add({ days: 4 }) });
    return (
      <div className="sb-col">
        <RangeCalendar aria-label="Pick a range" value={value} onChange={setValue} />
        <p className="sb-label">
          {value.start.toString()} to {value.end.toString()}
        </p>
      </div>
    );
  },
};

/** Dates outside the allowed span are struck through, and the arrows stop at the edges. */
export const Limits: StoryObj = {
  render: function Render() {
    const now = today(getLocalTimeZone());
    return (
      <Calendar
        aria-label="Pick a date this month"
        defaultValue={now}
        minValue={now.set({ day: 1 })}
        maxValue={now.set({ day: 28 })}
      />
    );
  },
};

/**
 * The same component in three locales. The first day of the week, the weekday names and the
 * month name all follow the locale.
 */
export const Locales: StoryObj = {
  render: function Render() {
    const now = today(getLocalTimeZone());
    return (
      <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {['en-US', 'en-GB', 'ar-EG'].map((locale) => (
          <div key={locale} className="sb-col">
            <p className="sb-label">{locale}</p>
            <I18nProvider locale={locale}>
              <Calendar aria-label={`Calendar in ${locale}`} defaultValue={now} />
            </I18nProvider>
          </div>
        ))}
      </div>
    );
  },
};

/** The spec's date picker is this grid inside a modal, which `Dialog` already provides. */
export const InADialog: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<CalendarDate>(today(getLocalTimeZone()));
    const [draft, setDraft] = useState(value);
    return (
      <div className="sb-col">
        <FilledButton
          onClick={() => {
            setDraft(value);
            setOpen(true);
          }}
        >
          {value.toString()}
        </FilledButton>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          headline="Select a date"
          actions={
            <>
              <TextButton onClick={() => setOpen(false)}>Cancel</TextButton>
              <TextButton
                onClick={() => {
                  setValue(draft);
                  setOpen(false);
                }}
              >
                OK
              </TextButton>
            </>
          }
        >
          <Calendar aria-label="Select a date" value={draft} onChange={setDraft} />
        </Dialog>
      </div>
    );
  },
};

/**
 * The input mode: each part is its own target, taking the arrow keys and typing. The hour cycle
 * follows the locale, so a US field gains an AM and PM segment that a British one does not.
 */
export const TimeInput: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<Time | null>(new Time(9, 30));
    return (
      <div className="sb-col" style={{ gap: 32 }}>
        <div className="sb-col">
          <TimeField label="Start time" value={value} onChange={setValue} supportingText="Arrow keys work" />
          <p className="sb-label">{value ? value.toString() : 'not set'}</p>
        </div>

        <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {['en-US', 'en-GB'].map((locale) => (
            <div key={locale} className="sb-col">
              <p className="sb-label">{locale}</p>
              <I18nProvider locale={locale}>
                <TimeField label="Time" defaultValue={new Time(21, 15)} />
              </I18nProvider>
            </div>
          ))}
          <div className="sb-col">
            <p className="sb-label">Seconds</p>
            <TimeField label="Time" defaultValue={new Time(9, 30, 15)} granularity="second" hourCycle={24} />
          </div>
          <div className="sb-col">
            <p className="sb-label">Disabled</p>
            <TimeField label="Time" defaultValue={new Time(9, 30)} disabled />
          </div>
        </div>
      </div>
    );
  },
};
