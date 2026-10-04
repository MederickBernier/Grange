import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import { CalendarDate, Time } from '@internationalized/date';
import { Calendar, GrangeProvider, RangeCalendar, TimeField, calendar, timeField } from '../index';

describe('tokens', () => {
  it('matches DatePickerModalTokens', () => {
    expect(calendar).toMatchObject({
      panelWidth: 360,
      panelHeight: 568,
      cell: 40,
      todayOutlineWidth: 1,
      headerHeight: 120,
      yearWidth: 72,
    });
  });

  it('matches TimeInputTokens', () => {
    expect(timeField).toMatchObject({ fieldWidth: 96, fieldHeight: 72, corner: 8 });
  });
});

/**
 * React Aria names a calendar cell with the whole date, "Monday, June 15, 2026", and appends
 * "selected" rather than setting aria-selected. So cells are found by day number through the
 * rendered text, and selection is read from the name and from our own data attribute.
 */
function cell(day: number): HTMLElement {
  const cells = [...document.querySelectorAll('.grange-calendar-cell')] as HTMLElement[];
  const found = cells.find((c) => c.textContent === String(day) && !c.hidden);
  if (!found) throw new Error(`no cell for day ${day}`);
  return found;
}

describe('Calendar', () => {
  const june = new CalendarDate(2026, 6, 15);

  it('is a labelled application grid of days', () => {
    render(<Calendar aria-label="Pick a date" defaultValue={june} />);
    expect(screen.getByRole('application', { name: /Pick a date/ })).toBeTruthy();
    expect(screen.getByRole('grid')).toBeTruthy();
  });

  it('marks the chosen date', () => {
    render(<Calendar aria-label="Pick a date" defaultValue={june} />);
    expect(cell(15).dataset.selected).toBe('true');
    // React Aria puts it in the name rather than in aria-selected.
    expect(cell(15).getAttribute('aria-label')).toContain('selected');
  });

  it('reports a new date when one is clicked', async () => {
    const onChange = vi.fn();
    render(<Calendar aria-label="Pick a date" defaultValue={june} onChange={onChange} />);
    await userEvent.click(cell(17));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]![0].day).toBe(17);
  });

  it('moves with the arrow keys, which a grid of buttons would not', async () => {
    const onChange = vi.fn();
    render(<Calendar aria-label="Pick a date" defaultValue={june} onChange={onChange} />);
    cell(15).focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onChange.mock.calls[0]![0].day).toBe(16);
  });

  it('pages between months', async () => {
    const { container } = render(<Calendar aria-label="Pick a date" defaultValue={june} />);
    // Scoped to the header: React Aria also announces the month in a live region, so the text
    // appears twice.
    const title = () => container.querySelector('.grange-calendar-header')!.textContent;
    expect(title()).toContain('June 2026');
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(title()).toContain('July 2026');
  });

  it('disables the arrow at the edge of an allowed range, which needs the prop mapped', async () => {
    render(
      <Calendar
        aria-label="Pick a date"
        defaultValue={june}
        minValue={new CalendarDate(2026, 6, 1)}
        maxValue={new CalendarDate(2026, 6, 30)}
      />,
    );
    // React Aria reports isDisabled; our IconButton takes disabled, so this only passes because
    // the two are mapped rather than spread.
    const previous = screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
  });

  it('follows the locale for the first day of the week', () => {
    const weekdays = (root: HTMLElement) => [...root.querySelectorAll('thead th')].map((h) => h.textContent);

    const first = render(
      <I18nProvider locale="en-US">
        <Calendar aria-label="US" defaultValue={june} />
      </I18nProvider>,
    );
    const us = weekdays(first.container);
    first.unmount();

    const second = render(
      <I18nProvider locale="en-GB">
        <Calendar aria-label="GB" defaultValue={june} />
      </I18nProvider>,
    );
    const gb = weekdays(second.container);
    // The US week starts on Sunday and the British one on Monday, which React Aria knows and we
    // would otherwise have hardcoded.
    expect(us[0]).not.toBe(gb[0]);
  });

  it('marks unavailable dates rather than hiding them', () => {
    render(
      <Calendar aria-label="Pick a date" defaultValue={june} minValue={new CalendarDate(2026, 6, 10)} />,
    );
    expect(cell(5).getAttribute('aria-disabled')).toBe('true');
    expect(cell(5).dataset.unavailable ?? cell(5).dataset.disabled).toBe('true');
  });

  it('can be controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState<CalendarDate>(june);
      return (
        <>
          <output data-testid="day">{value.day}</output>
          <Calendar aria-label="Pick a date" value={value} onChange={setValue} />
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(cell(20));
    expect(screen.getByTestId('day').textContent).toBe('20');
  });

  it('reaches the cell slot', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Calendar: { cell: 'my-cell' } }}>
        <Calendar aria-label="Pick a date" defaultValue={june} />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-calendar-cell')?.className).toContain('my-cell');
  });
});

describe('RangeCalendar', () => {
  const range = { start: new CalendarDate(2026, 6, 10), end: new CalendarDate(2026, 6, 14) };

  it('marks every date in the span, not only the ends', () => {
    render(<RangeCalendar aria-label="Pick a range" defaultValue={range} />);
    for (const day of [10, 11, 12, 13, 14]) {
      expect(cell(day).dataset.selected).toBe('true');
    }
    expect(cell(15).dataset.selected).toBeUndefined();
  });

  it('reports a new span once both ends are chosen', async () => {
    const onChange = vi.fn();
    render(<RangeCalendar aria-label="Pick a range" defaultValue={range} onChange={onChange} />);
    await userEvent.click(cell(18));
    await userEvent.click(cell(22));
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0];
    expect(last.start.day).toBe(18);
    expect(last.end.day).toBe(22);
  });
});

describe('TimeField', () => {
  it('renders a segment per part rather than one text box', () => {
    render(<TimeField label="Start" defaultValue={new Time(9, 30)} />);
    expect(screen.getByRole('group', { name: 'Start' })).toBeTruthy();
    const spinners = screen.getAllByRole('spinbutton');
    expect(spinners.length).toBeGreaterThanOrEqual(2);
  });

  it('moves a segment with the arrow keys', async () => {
    const onChange = vi.fn();
    render(<TimeField label="Start" defaultValue={new Time(9, 30)} onChange={onChange} />);
    const [hour] = screen.getAllByRole('spinbutton');
    hour!.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]![0].hour).toBe(10);
  });

  it('follows the locale for the hour cycle rather than a format string', () => {
    const { unmount } = render(
      <I18nProvider locale="en-US">
        <TimeField label="US" defaultValue={new Time(21, 0)} />
      </I18nProvider>,
    );
    // A 12 hour locale adds a day-period segment that a 24 hour one does not.
    const usSegments = screen.getAllByRole('spinbutton').length;
    unmount();

    render(
      <I18nProvider locale="en-GB">
        <TimeField label="GB" defaultValue={new Time(21, 0)} />
      </I18nProvider>,
    );
    expect(screen.getAllByRole('spinbutton').length).not.toBe(usSegments);
  });

  it('takes an explicit hour cycle when the locale is not what is wanted', () => {
    render(
      <I18nProvider locale="en-US">
        <TimeField label="Start" defaultValue={new Time(21, 0)} hourCycle={24} />
      </I18nProvider>,
    );
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });

  it('goes to seconds when asked', () => {
    render(
      <TimeField label="Start" defaultValue={new Time(9, 30, 15)} granularity="second" hourCycle={24} />,
    );
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
  });

  it('does not change while disabled', async () => {
    const onChange = vi.fn();
    render(<TimeField label="Start" defaultValue={new Time(9, 30)} disabled onChange={onChange} />);
    const [hour] = screen.getAllByRole('spinbutton');
    hour!.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reaches the input slot', () => {
    const { container } = render(
      <GrangeProvider classNames={{ TimeField: { input: 'my-input' } }}>
        <TimeField label="Start" defaultValue={new Time(9, 30)} />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-time-field-input')?.className).toContain('my-input');
  });
});
