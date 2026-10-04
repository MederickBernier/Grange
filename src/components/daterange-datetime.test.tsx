import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import { CalendarDate, CalendarDateTime } from '@internationalized/date';
import { Calendar, DateRangePicker, DateTimePicker, GrangeProvider, RangeCalendar } from '../index';

const PINNED = new CalendarDate(2026, 7, 15);
const RANGE = { start: new CalendarDate(2026, 7, 10), end: new CalendarDate(2026, 7, 20) };
const spinbuttons = (name: RegExp) => screen.getAllByRole('spinbutton', { name });
const calendarButton = (name: RegExp) => screen.getByRole('button', { name });
/**
 * A day cell, by its full accessible name.
 *
 * Not a loose regex: `/5 August 2026/` also matches "15 August 2026" and "25 August 2026", which
 * is how three of these tests first failed with "found multiple elements".
 */
const day = (name: string) => screen.getByRole('button', { name: new RegExp(`\\b${name}$`) });

describe('MultiViewCalendar', () => {
  it('shows one month by default and several when asked', () => {
    const { unmount } = render(<Calendar aria-label="Dates" value={PINNED} />);
    expect(screen.getAllByRole('grid')).toHaveLength(1);
    unmount();

    render(<Calendar aria-label="Dates" value={PINNED} visibleMonths={2} />);
    // Two grids rather than one long one: a grid's arrows move within a month and a screen
    // reader reads its caption, so two months in one table would be wrong about both.
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });

  it('draws consecutive months, not the same one twice', () => {
    render(<Calendar aria-label="Dates" value={PINNED} visibleMonths={3} />);
    const captions = screen.getAllByRole('grid').map((grid) => grid.getAttribute('aria-label'));
    /*
     * Starting on the value's month. React Aria centres the value by default, which would show
     * June to August for a July value; `align` is what puts it first, and this is the default
     * here because a multi-month picker that opens a month behind the value reads as a bug.
     */
    expect(captions[0]).toContain('July 2026');
    expect(captions[1]).toContain('August 2026');
    expect(captions[2]).toContain('September 2026');
  });

  it('pages by a whole screenful, or one month at a time when told', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Calendar aria-label="Dates" value={PINNED} visibleMonths={2} />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    // Two months forward, not one: the arrows move by the visible duration, which is React
    // Aria's default and worth knowing before wiring a two-month picker.
    let captions = screen.getAllByRole('grid').map((grid) => grid.getAttribute('aria-label'));
    expect(captions[0]).toContain('September 2026');
    expect(captions[1]).toContain('October 2026');
    unmount();

    render(<Calendar aria-label="Dates" value={PINNED} visibleMonths={2} pageBehavior="single" />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    captions = screen.getAllByRole('grid').map((grid) => grid.getAttribute('aria-label'));
    expect(captions[0]).toContain('August 2026');
    expect(captions[1]).toContain('September 2026');
  });

  it('works the same for a range calendar', () => {
    render(<RangeCalendar aria-label="Dates" value={RANGE} visibleMonths={2} />);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });

  it('still selects into the right month', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="en-GB">
        <Calendar aria-label="Dates" value={PINNED} visibleMonths={2} onChange={onChange} />
      </I18nProvider>,
    );
    // A day in the second grid is an August date, not a July one. The July grid draws no August
    // days at all: the hook hands over the week's run-over and they are left blank, or the same
    // day would appear in both grids, selectable twice and announced twice.
    await user.click(day('5 August 2026'));
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 8, 5));
  });
});

describe('DateRangePicker', () => {
  it('is one group holding two fields', () => {
    render(<DateRangePicker label="Stay" value={RANGE} />);
    expect(screen.getByRole('group', { name: 'Stay' })).toBeTruthy();
    // Three segments for each end: they are separate spinbuttons that validate together.
    expect(screen.getAllByRole('spinbutton')).toHaveLength(6);
  });

  it('shows both ends, with the start first', () => {
    const { container } = render(
      <I18nProvider locale="en-GB">
        <DateRangePicker label="Stay" value={RANGE} />
      </I18nProvider>,
    );
    expect(container.querySelector('.grange-date-range-picker-start')?.textContent).toBe('10/07/2026');
    expect(container.querySelector('.grange-date-range-picker-end')?.textContent).toBe('20/07/2026');
  });

  it('opens a range calendar showing two months by default', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker label="Stay" value={RANGE} />);
    await user.click(calendarButton(/Stay/));
    // Two months, because choosing a span across a boundary with one visible means paging back
    // and forth to see both ends.
    await waitFor(() => expect(screen.getAllByRole('grid')).toHaveLength(2));
  });

  it('takes one month when told to', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker label="Stay" value={RANGE} visibleMonths={1} />);
    await user.click(calendarButton(/Stay/));
    await waitFor(() => expect(screen.getAllByRole('grid')).toHaveLength(1));
  });

  it('reports a span chosen in the calendar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="en-GB">
        <DateRangePicker label="Stay" value={RANGE} onChange={onChange} />
      </I18nProvider>,
    );
    await user.click(calendarButton(/Stay/));
    await waitFor(() => expect(screen.getAllByRole('grid')).toHaveLength(2));

    await user.click(day('3 July 2026'));
    await user.click(day('8 July 2026'));
    expect(onChange).toHaveBeenLastCalledWith({
      start: new CalendarDate(2026, 7, 3),
      end: new CalendarDate(2026, 7, 8),
    });
  });

  it('types into either end', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="en-GB">
        <DateRangePicker label="Stay" value={RANGE} onChange={onChange} />
      </I18nProvider>,
    );
    // The first day segment belongs to the start, the second to the end.
    const days = spinbuttons(/day/i);
    days[1]!.focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith({
      start: new CalendarDate(2026, 7, 10),
      end: new CalendarDate(2026, 7, 21),
    });
  });

  it('marks itself invalid when the end precedes the start', async () => {
    const { container } = render(
      <I18nProvider locale="en-GB">
        <DateRangePicker
          label="Stay"
          value={{ start: new CalendarDate(2026, 7, 20), end: new CalendarDate(2026, 7, 10) }}
        />
      </I18nProvider>,
    );
    // The two fields are not independent: the pair is what is validated.
    await waitFor(() =>
      expect(container.querySelector('.grange-date-range-picker')?.getAttribute('data-error')).toBe('true'),
    );
  });

  it('will not open when it is disabled', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker label="Stay" value={RANGE} disabled />);
    await user.click(calendarButton(/Stay/));
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('reaches its slots and takes its months from the provider', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GrangeProvider
        defaultProps={{ DateRangePicker: { variant: 'outlined', visibleMonths: 1 } }}
        classNames={{ DateRangePicker: { root: 'x-root', label: 'x-label' } }}
      >
        <DateRangePicker label="Stay" value={RANGE} />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-date-range-picker')?.getAttribute('data-variant')).toBe(
      'outlined',
    );
    expect(container.querySelector('.x-root')).toBeTruthy();
    expect(container.querySelector('.x-label')).toBeTruthy();
    await user.click(calendarButton(/Stay/));
    await waitFor(() => expect(screen.getAllByRole('grid')).toHaveLength(1));
  });

  it('keeps both ends in step across a controlled round trip', async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<{ start: CalendarDate; end: CalendarDate } | null>(RANGE);
      return (
        <I18nProvider locale="en-GB">
          <DateRangePicker label="Stay" value={value} onChange={setValue} />
          <p>{value ? `${value.start.toString()} to ${value.end.toString()}` : 'none'}</p>
        </I18nProvider>
      );
    }
    render(<Host />);
    spinbuttons(/day/i)[0]!.focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText('2026-07-11 to 2026-07-20')).toBeTruthy();
  });
});

describe('DateTimePicker', () => {
  const AT = new CalendarDateTime(2026, 7, 15, 9, 30);

  it('adds the time segments to the same field', () => {
    render(<DateTimePicker label="When" value={AT} hourCycle={24} />);
    // Three date parts plus an hour and a minute.
    expect(screen.getAllByRole('spinbutton')).toHaveLength(5);
  });

  it('still picks the day in the calendar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="en-GB">
        <DateTimePicker label="When" value={AT} onChange={onChange} />
      </I18nProvider>,
    );
    await user.click(calendarButton(/When/));
    await waitFor(() => expect(screen.getByRole('grid')).toBeTruthy());

    await user.click(day('20 July 2026'));
    // The day moved and the time came with it, rather than being reset.
    const next = onChange.mock.calls[0]![0] as CalendarDateTime;
    expect(next.day).toBe(20);
    expect(next.hour).toBe(9);
    expect(next.minute).toBe(30);
  });

  it('changes the time without touching the date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="en-GB">
        <DateTimePicker label="When" value={AT} hourCycle={24} onChange={onChange} />
      </I18nProvider>,
    );
    spinbuttons(/hour/i)[0]!.focus();
    await user.keyboard('{ArrowUp}');
    const next = onChange.mock.calls[0]![0] as CalendarDateTime;
    expect(next.hour).toBe(10);
    expect(next.day).toBe(15);
  });

  it('follows the locale for the hour cycle', () => {
    const { unmount } = render(
      <I18nProvider locale="en-US">
        <DateTimePicker label="When" value={AT} />
      </I18nProvider>,
    );
    // An AM/PM segment in the United States, which is not a spinbutton but a listbox-ish part.
    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(5);
    unmount();

    render(
      <I18nProvider locale="en-GB">
        <DateTimePicker label="When" value={AT} />
      </I18nProvider>,
    );
    expect(screen.getAllByRole('spinbutton')).toHaveLength(5);
  });
});
