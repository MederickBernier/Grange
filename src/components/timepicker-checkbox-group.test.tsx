import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import { Time } from '@internationalized/date';
import { Checkbox, CheckboxGroup, GrangeProvider, TimePicker, radiusFor, timePicker } from '../index';

/** jsdom gives every element a zero-sized box, so a dial point is read in the dial's own units. */
const centre = timePicker.dialSize / 2;
const outer = radiusFor('outer');

function pressDial(at: { x: number; y: number }) {
  const dial = screen.getByRole('slider');
  fireEvent.pointerDown(dial, { button: 0, pointerId: 1, clientX: at.x, clientY: at.y });
  fireEvent.pointerUp(dial, { pointerId: 1, clientX: at.x, clientY: at.y });
}

describe('TimePicker', () => {
  it('shows the hour and the minute, and starts on the hour', () => {
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 30)} hourCycle={12} />);
    expect(screen.getByRole('button', { name: 'Hour' }).textContent).toBe('09');
    expect(screen.getByRole('button', { name: 'Minute' }).textContent).toBe('30');
    expect(screen.getByRole('button', { name: 'Hour' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('slider').getAttribute('aria-label')).toBe('Hour');
  });

  it('is a slider over the face, which is what carries the value to assistive tech', () => {
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 30)} hourCycle={12} />);
    const dial = screen.getByRole('slider');
    expect(dial.getAttribute('aria-valuenow')).toBe('9');
    expect(dial.getAttribute('aria-valuemin')).toBe('1');
    expect(dial.getAttribute('aria-valuemax')).toBe('12');
    expect(dial.getAttribute('aria-valuetext')).toBe("9 o'clock");
    expect(dial.tabIndex).toBe(0);
  });

  it('switches what the dial edits, and the slider follows', async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 30)} hourCycle={12} />);
    await user.click(screen.getByRole('button', { name: 'Minute' }));

    const dial = screen.getByRole('slider');
    expect(dial.getAttribute('aria-label')).toBe('Minute');
    expect(dial.getAttribute('aria-valuenow')).toBe('30');
    expect(dial.getAttribute('aria-valuemax')).toBe('59');
    expect(dial.getAttribute('aria-valuetext')).toBe('30 minutes');
    expect(screen.getByRole('button', { name: 'Hour' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('moves one unit on the arrows and five minutes on a page, wrapping round the face', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 30)} hourCycle={12} onChange={onChange} />);
    const dial = screen.getByRole('slider');
    dial.focus();

    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(new Time(10, 30));
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 30));

    await user.click(screen.getByRole('button', { name: 'Minute' }));
    screen.getByRole('slider').focus();
    await user.keyboard('{PageUp}');
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 35));
    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 0));
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 59));
    // One past the end of the face comes back round to the start.
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 0));
  });

  it('keeps the half of the day while the hour is stepped', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePicker aria-label="Time" defaultValue={new Time(21, 0)} hourCycle={12} onChange={onChange} />);
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowUp}');
    // Ten in the evening, not ten in the morning.
    expect(onChange).toHaveBeenLastCalledWith(new Time(22, 0));
  });

  it('sets the hour from a press on the face', () => {
    const onChange = vi.fn();
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 30)} hourCycle={12} onChange={onChange} />);
    // Straight out to the right is three o'clock, and the morning is the half in play.
    pressDial({ x: centre + outer, y: centre });
    expect(onChange).toHaveBeenLastCalledWith(new Time(3, 30));
  });

  it('sets a minute the face is not marked with, which is the point of dragging it', () => {
    const onChange = vi.fn();
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 0)} hourCycle={12} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Minute' }));

    const radians = (7 * 6 * Math.PI) / 180;
    pressDial({ x: centre + outer * Math.sin(radians), y: centre - outer * Math.cos(radians) });
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 7));
  });

  it('follows a drag across the face rather than only the press', () => {
    const onChange = vi.fn();
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 30)} hourCycle={12} onChange={onChange} />);
    const dial = screen.getByRole('slider');
    fireEvent.pointerDown(dial, { button: 0, pointerId: 1, clientX: centre, clientY: centre - outer });
    // Twelve at the top of a morning face is midnight, which is hour 0.
    expect(onChange).toHaveBeenLastCalledWith(new Time(0, 30));
    fireEvent.pointerMove(dial, { pointerId: 1, clientX: centre + outer, clientY: centre });
    expect(onChange).toHaveBeenLastCalledWith(new Time(3, 30));
    fireEvent.pointerUp(dial, { pointerId: 1 });
    // Once released, moving over the dial does nothing.
    onChange.mockClear();
    fireEvent.pointerMove(dial, { pointerId: 1, clientX: centre - outer, clientY: centre });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('switches the half of the day without moving the hand', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 30)} hourCycle={12} onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'AM or PM' });
    expect(screen.getByRole('button', { name: 'AM' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'PM' }));
    expect(onChange).toHaveBeenLastCalledWith(new Time(21, 30));
    expect(group).toBeTruthy();
  });

  it('has no AM or PM on a 24 hour face, and runs the slider over the whole day', () => {
    render(<TimePicker aria-label="Time" defaultValue={new Time(17, 5)} hourCycle={24} />);
    expect(screen.queryByRole('group', { name: 'AM or PM' })).toBeNull();
    const dial = screen.getByRole('slider');
    expect(dial.getAttribute('aria-valuemin')).toBe('0');
    expect(dial.getAttribute('aria-valuemax')).toBe('23');
    expect(dial.getAttribute('aria-valuenow')).toBe('17');
    expect(screen.getByRole('button', { name: 'Hour' }).textContent).toBe('17');
  });

  it('reads the inner ring of a 24 hour face as the afternoon', () => {
    const onChange = vi.fn();
    render(<TimePicker aria-label="Time" defaultValue={new Time(9, 0)} hourCycle={24} onChange={onChange} />);
    pressDial({ x: centre + radiusFor('inner'), y: centre });
    expect(onChange).toHaveBeenLastCalledWith(new Time(15, 0));
    pressDial({ x: centre + outer, y: centre });
    expect(onChange).toHaveBeenLastCalledWith(new Time(3, 0));
  });

  it('takes the hour cycle from the locale when it is not told one', () => {
    const { unmount } = render(
      <I18nProvider locale="en-GB">
        <TimePicker aria-label="Time" defaultValue={new Time(17, 0)} />
      </I18nProvider>,
    );
    expect(screen.queryByRole('group', { name: 'AM or PM' })).toBeNull();
    unmount();

    render(
      <I18nProvider locale="en-US">
        <TimePicker aria-label="Time" defaultValue={new Time(17, 0)} />
      </I18nProvider>,
    );
    expect(screen.getByRole('group', { name: 'AM or PM' })).toBeTruthy();
  });

  it('hides the numbers from assistive tech, because the slider already reads the value', () => {
    const { container } = render(<TimePicker aria-label="Time" defaultValue={new Time(9, 0)} hourCycle={12} />);
    const dial = container.querySelector('.grange-time-picker-dial');
    // Twelve numbers, a hand, a centre dot and a handle, none of them announced.
    expect(dial?.querySelectorAll('[aria-hidden="true"]').length).toBe(15);
    expect(dial?.querySelectorAll(':scope > :not([aria-hidden="true"])').length).toBe(0);
  });

  it('shows the other mode instead of the face, over the same value', async () => {
    const user = userEvent.setup();
    function Host() {
      const [mode, setMode] = useState<'dial' | 'input'>('dial');
      return <TimePicker aria-label="Time" defaultValue={new Time(9, 30)} hourCycle={12} mode={mode} onModeChange={setMode} />;
    }
    render(<Host />);
    expect(screen.getByRole('slider')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Enter time' }));
    expect(screen.queryByRole('slider')).toBeNull();
    // The TimeField's segments, which carry the same 9:30.
    expect(screen.getByRole('spinbutton', { name: /hour/i }).textContent).toBe('9');
  });

  it('is controlled when it is given a value', () => {
    const { rerender } = render(<TimePicker aria-label="Time" value={new Time(9, 30)} hourCycle={12} />);
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('9');
    rerender(<TimePicker aria-label="Time" value={new Time(4, 30)} hourCycle={12} />);
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('4');
  });

  it('takes its slots and its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider
        defaultProps={{ TimePicker: { hourCycle: 24 } }}
        classNames={{ TimePicker: { root: 'x-root', dial: 'x-dial', hour: 'x-hour' } }}
      >
        <TimePicker aria-label="Time" defaultValue={new Time(9, 0)} />
      </GrangeProvider>,
    );
    expect(screen.queryByRole('group', { name: 'AM or PM' })).toBeNull();
    for (const name of ['x-root', 'x-dial', 'x-hour']) {
      expect(container.querySelector(`.${name}`)).toBeTruthy();
    }
  });
});

const box = (name: string) => screen.getByRole('checkbox', { name }) as HTMLInputElement;
const checked = (name: string) => box(name).checked;

describe('CheckboxGroup', () => {
  const options = (
    <>
      <Checkbox value="mail">Email</Checkbox>
      <Checkbox value="sms">Text message</Checkbox>
      <Checkbox value="push">Push</Checkbox>
    </>
  );

  it('is a labelled group whose value is a set of its boxes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup label="Notify me by" defaultValue={['mail']} onChange={onChange}>
        {options}
      </CheckboxGroup>,
    );
    expect(screen.getByRole('group', { name: 'Notify me by' })).toBeTruthy();
    expect(checked('Email')).toBe(true);
    expect(checked('Push')).toBe(false);

    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    expect(onChange).toHaveBeenLastCalledWith(['mail', 'push']);
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));
    expect(onChange).toHaveBeenLastCalledWith(['push']);
  });

  it('is controlled when it is given a value', async () => {
    const user = userEvent.setup();
    render(<CheckboxGroup label="Notify me by" value={['sms']}>{options}</CheckboxGroup>);
    expect(checked('Text message')).toBe(true);
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    // No handler, so nothing moves: the value is the app's.
    expect(checked('Push')).toBe(false);
  });

  it('carries one message for the whole set, which is the reason to group them', () => {
    render(
      <CheckboxGroup label="Notify me by" error errorText="Choose at least one">
        {options}
      </CheckboxGroup>,
    );
    const box = screen.getByRole('checkbox', { name: 'Email' });
    const described = box.getAttribute('aria-describedby');
    expect(described).toBeTruthy();
    // Every box in the group points at the same message.
    for (const name of ['Text message', 'Push']) {
      expect(screen.getByRole('checkbox', { name }).getAttribute('aria-describedby')).toBe(described);
    }
    expect(document.getElementById(described as string)?.textContent).toBe('Choose at least one');
  });

  it('marks every box invalid when the group is, without each one being told', () => {
    const { container } = render(
      <CheckboxGroup label="Notify me by" error errorText="Choose at least one">
        {options}
      </CheckboxGroup>,
    );
    const boxes = container.querySelectorAll('.grange-checkbox');
    expect(boxes).toHaveLength(3);
    for (const box of boxes) expect(box.getAttribute('data-error')).toBe('true');
    expect(screen.getByRole('checkbox', { name: 'Email' }).getAttribute('aria-invalid')).toBe('true');
  });

  it('shows the supporting text until there is an error to show instead', () => {
    const { rerender, container } = render(
      <CheckboxGroup label="Notify me by" supportingText="Pick any">
        {options}
      </CheckboxGroup>,
    );
    const text = () => container.querySelector('.grange-checkbox-group-supporting-text')?.textContent;
    expect(text()).toBe('Pick any');
    rerender(
      <CheckboxGroup label="Notify me by" supportingText="Pick any" error errorText="Choose at least one">
        {options}
      </CheckboxGroup>,
    );
    expect(text()).toBe('Choose at least one');
  });

  it('disables every box from the group', () => {
    render(
      <CheckboxGroup label="Notify me by" disabled>
        {options}
      </CheckboxGroup>,
    );
    for (const name of ['Email', 'Text message', 'Push']) {
      expect(box(name).disabled).toBe(true);
    }
  });

  it('leaves a lone checkbox owning its own state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange}>Remember me</Checkbox>);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('says so rather than silently doing nothing when a grouped box has no value', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <CheckboxGroup label="Notify me by">
          <Checkbox>Email</Checkbox>
        </CheckboxGroup>,
      ),
    ).toThrow(/needs a value/);
    quiet.mockRestore();
  });

  it('lays out in a row when asked, and takes the orientation from the provider', () => {
    const { container, unmount } = render(
      <CheckboxGroup label="Notify me by" orientation="horizontal">
        {options}
      </CheckboxGroup>,
    );
    expect(container.querySelector('.grange-checkbox-group')?.getAttribute('data-orientation')).toBe('horizontal');
    unmount();

    const second = render(
      <GrangeProvider defaultProps={{ CheckboxGroup: { orientation: 'horizontal' } }}>
        <CheckboxGroup label="Notify me by">{options}</CheckboxGroup>
      </GrangeProvider>,
    );
    expect(second.container.querySelector('.grange-checkbox-group')?.getAttribute('data-orientation')).toBe(
      'horizontal',
    );
  });

  it('supports an indeterminate box inside a group', () => {
    render(
      <CheckboxGroup label="Notify me by" defaultValue={['mail']}>
        <Checkbox value="mail" indeterminate>
          Email
        </Checkbox>
      </CheckboxGroup>,
    );
    expect(box('Email').indeterminate).toBe(true);
  });
});
