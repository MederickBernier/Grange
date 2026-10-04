import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import { CalendarDate } from '@internationalized/date';
import {
  DateField,
  DatePicker,
  FilledButton,
  Form,
  GrangeProvider,
  OutlinedDateField,
  TimeField,
} from '../index';

const PINNED = new CalendarDate(2026, 7, 15);
const segments = (name: string) => screen.getAllByRole('spinbutton', { name: new RegExp(name, 'i') });
const group = (name = 'Date') => screen.getByRole('group', { name });
/**
 * The calendar button takes its name from the field, and there is no way to give it another:
 * useDatePicker points its aria-labelledby at the label, which wins over any aria-label.
 */
const calendarButton = () => screen.getByRole('button', { name: /Date/ });

describe('DateField', () => {
  it('is a group of segments, each its own spinbutton', () => {
    render(<DateField label="Date" value={PINNED} />);
    expect(group()).toBeTruthy();
    // Day, month and year: three targets, not one text box.
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
    expect(segments('year')[0]!.textContent).toBe('2026');
  });

  it('follows the locale for the order of the parts and the separators', () => {
    const { container, unmount } = render(
      <I18nProvider locale="en-US">
        <DateField label="Date" value={PINNED} />
      </I18nProvider>,
    );
    // Month first in the United States.
    expect(container.querySelector('.grange-date-field-input')?.textContent).toBe('7/15/2026');
    unmount();

    const gb = render(
      <I18nProvider locale="en-GB">
        <DateField label="Date" value={PINNED} />
      </I18nProvider>,
    );
    // Day first in Britain, and the separators come from the locale too.
    expect(gb.container.querySelector('.grange-date-field-input')?.textContent).toBe('15/07/2026');
  });

  it('changes a part with the arrows and by typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="en-GB">
        <DateField label="Date" value={PINNED} onChange={onChange} />
      </I18nProvider>,
    );
    const day = segments('day')[0]!;
    day.focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 7, 16));

    await user.keyboard('2');
    await user.keyboard('3');
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 7, 23));
  });

  it('shows placeholders until there is a value, and the label floats from the start', () => {
    const { container } = render(<DateField label="Date" />);
    const root = container.querySelector('.grange-date-field')!;
    // There is always something in the field, so the label has nowhere to sit inside it.
    expect(root.getAttribute('data-populated')).toBe('true');
    expect(container.querySelectorAll('[data-placeholder]').length).toBeGreaterThan(0);
  });

  it('adds the time segments when asked for more precision', () => {
    /*
     * A CalendarDate carries no time, so asking for minutes needs a value that can hold them —
     * the hook says so outright: "Invalid granularity minute for value". Left empty here, since
     * the point is the number of segments.
     */
    render(<DateField label="Date" granularity="minute" hourCycle={24} />);
    // Three date parts plus an hour and a minute.
    expect(screen.getAllByRole('spinbutton')).toHaveLength(5);
  });

  it('treats its limits as validation rather than as a clamp', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <I18nProvider locale="en-GB">
        <DateField
          label="Date"
          defaultValue={PINNED}
          minValue={new CalendarDate(2026, 7, 15)}
          maxValue={new CalendarDate(2026, 7, 20)}
          onChange={onChange}
        />
      </I18nProvider>,
    );
    segments('day')[0]!.focus();
    await user.keyboard('{ArrowDown}');

    /*
     * The arrows do not stop at the minimum. The hook reports the date that was asked for —
     * 14 July, one outside the range — and marks the field invalid, leaving it to the app to
     * accept or refuse. Worth stating, because "it clamps" is the obvious guess and wrong: a
     * controlled field that ignores the change simply keeps showing the old value, which looks
     * like clamping and is not.
     */
    expect(onChange).toHaveBeenCalledWith(new CalendarDate(2026, 7, 14));
    await waitFor(() =>
      expect(container.querySelector('.grange-date-field')?.getAttribute('data-error')).toBe('true'),
    );
  });

  it('reports a value that is already outside the range, with a message of its own', () => {
    const { container } = render(
      <I18nProvider locale="en-GB">
        <DateField
          label="Date"
          value={new CalendarDate(2026, 7, 10)}
          minValue={new CalendarDate(2026, 7, 15)}
        />
      </I18nProvider>,
    );
    expect(container.querySelector('.grange-date-field')?.getAttribute('data-error')).toBe('true');
    // The wording is React Aria's, localised by it rather than written here.
    expect(container.querySelector('.grange-date-field-supporting')?.textContent).toMatch(/or later/);
  });

  it('carries the supporting text and the error, and takes a form error by name', async () => {
    const user = userEvent.setup();
    render(
      <Form
        aria-label="Trip"
        validate={() => ({ when: 'Pick a date we fly' })}
        actions={<FilledButton type="submit">Go</FilledButton>}
      >
        <DateField label="Date" name="when" supportingText="Any day this month" />
      </Form>,
    );
    expect(screen.getByText('Any day this month')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(screen.getByText('Pick a date we fly')).toBeTruthy();
    expect(screen.queryByText('Any day this month')).toBeNull();
  });

  it('wears the field chrome in both variants', () => {
    const { container } = render(<OutlinedDateField label="Date" value={PINNED} />);
    const root = container.querySelector('.grange-date-field')!;
    expect(root.getAttribute('data-variant')).toBe('outlined');
    expect(root.querySelector('fieldset legend')).toBeTruthy();
  });

  it('is controlled when it is given a value', () => {
    const { rerender } = render(<DateField label="Date" value={PINNED} />);
    expect(segments('year')[0]!.textContent).toBe('2026');
    rerender(<DateField label="Date" value={new CalendarDate(2030, 1, 2)} />);
    expect(segments('year')[0]!.textContent).toBe('2030');
  });

  it('reaches its slots and takes its variant from the provider', () => {
    const { container } = render(
      <GrangeProvider
        defaultProps={{ DateField: { variant: 'outlined' } }}
        classNames={{ DateField: { root: 'x-root', input: 'x-input', label: 'x-label' } }}
      >
        <DateField label="Date" />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-date-field')?.getAttribute('data-variant')).toBe('outlined');
    for (const name of ['x-root', 'x-input', 'x-label']) {
      expect(container.querySelector(`.${name}`), name).toBeTruthy();
    }
  });

  it('leaves the time field working, which now shares its segment', () => {
    render(<TimeField label="Time" />);
    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(1);
  });
});

describe('DatePicker', () => {
  it('is a field and a calendar button over one value', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={PINNED} />);
    expect(group()).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
    expect(screen.queryByRole('application')).toBeNull();

    await user.click(calendarButton());
    await waitFor(() => expect(screen.getByRole('grid')).toBeTruthy());
  });

  it('opens on the month the value is in, not on this one', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={PINNED} />);
    await user.click(calendarButton());
    // July 2026, because that is where the value is — the hook keeps the two agreeing.
    await waitFor(() => expect(screen.getByRole('grid').getAttribute('aria-label')).toContain('July 2026'));
  });

  it('writes the chosen date back into the segments', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="en-GB">
        <DatePicker label="Date" value={PINNED} onChange={onChange} />
      </I18nProvider>,
    );
    await user.click(calendarButton());
    await waitFor(() => expect(screen.getByRole('grid')).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /20 July 2026/ }));
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 7, 20));
  });

  it('puts focus in the grid, so the arrows and Escape work', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={PINNED} />);
    await user.click(calendarButton());
    await waitFor(() => expect(screen.getByRole('grid')).toBeTruthy());
    // Nothing else moves focus into a calendar in a popover, which is why it says autoFocus.
    await waitFor(() => expect(document.activeElement?.closest('[role="grid"]')).toBeTruthy());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
  });

  it('typing in the segments still works with the calendar closed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="en-GB">
        <DatePicker label="Date" value={PINNED} onChange={onChange} />
      </I18nProvider>,
    );
    segments('month')[0]!.focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 8, 15));
  });

  it('will not open when it is disabled', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={PINNED} disabled />);
    await user.click(calendarButton());
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('is controlled when it is given a value', () => {
    const { rerender } = render(<DatePicker label="Date" value={PINNED} />);
    expect(segments('year')[0]!.textContent).toBe('2026');
    rerender(<DatePicker label="Date" value={new CalendarDate(2031, 3, 4)} />);
    expect(segments('year')[0]!.textContent).toBe('2031');
  });

  it('keeps a value chosen either way in step', async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<CalendarDate | null>(PINNED);
      return (
        <I18nProvider locale="en-GB">
          <DatePicker label="Date" value={value} onChange={setValue} />
          <p>value: {value ? value.toString() : 'none'}</p>
        </I18nProvider>
      );
    }
    render(<Host />);
    segments('day')[0]!.focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText('value: 2026-07-16')).toBeTruthy();

    await user.click(calendarButton());
    await waitFor(() => expect(screen.getByRole('grid')).toBeTruthy());
    // The grid followed the segments rather than staying where it was.
    expect(screen.getByRole('button', { name: /16 July 2026/ }).getAttribute('aria-label')).toContain(
      'selected',
    );
  });
});
