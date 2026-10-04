import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import {
  FilledNumberField,
  GrangeProvider,
  MaskedTextField,
  NumberField,
  OutlinedNumberField,
  numberField,
} from '../index';

const input = (name = 'Amount') => screen.getByLabelText(name) as HTMLInputElement;
const stepper = (name: 'Increase' | 'Decrease') => screen.getByRole('button', { name });

describe('NumberField', () => {
  it('matches the chosen stepper geometry', () => {
    // No NumberFieldTokens upstream, so these are chosen: two 24px buttons inside the 56px row.
    expect(numberField).toMatchObject({ stepperWidth: 24, stepperHeight: 24, stepperIcon: 18 });
    expect(numberField.stepperHeight * 2).toBeLessThan(56);
  });

  it('is a described text input in a group, which is what React Aria settled on', () => {
    const { container } = render(<NumberField label="Amount" defaultValue={5} minValue={0} maxValue={10} />);
    const el = input();
    /*
     * Not role="spinbutton", and not type="number". React Aria deliberately uses a text input
     * with aria-roledescription, because iOS VoiceOver mishandles the spinbutton role and a
     * native number input cannot be given a locale's decimal separator or a currency format.
     * The group around it is what holds the field and its stepper together.
     */
    expect(el.type).toBe('text');
    expect(el.getAttribute('aria-roledescription')).toBe('Number field');
    expect(el.inputMode).toBe('numeric');
    expect(container.querySelector('[role="group"]')).toBeTruthy();
    // The buttons are inside the group and out of the tab order: the arrows are the keyboard path.
    expect(stepper('Increase').tabIndex).toBe(-1);
  });

  it('steps with the buttons and with the arrows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" defaultValue={5} onChange={onChange} />);

    await user.click(stepper('Increase'));
    expect(onChange).toHaveBeenLastCalledWith(6);
    await user.click(stepper('Decrease'));
    expect(onChange).toHaveBeenLastCalledWith(5);

    input().focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(6);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('steps by the step it is given', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" defaultValue={0} step={0.25} onChange={onChange} />);
    await user.click(stepper('Increase'));
    expect(onChange).toHaveBeenLastCalledWith(0.25);
  });

  it('stops at the ends of the range, and says so by disabling the button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" defaultValue={10} minValue={0} maxValue={10} onChange={onChange} />);
    expect((stepper('Increase') as HTMLButtonElement).disabled).toBe(true);
    expect((stepper('Decrease') as HTMLButtonElement).disabled).toBe(false);

    input().focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('parses and formats for the locale, which a native number input cannot', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <I18nProvider locale="de-DE">
        <NumberField label="Amount" onChange={onChange} />
      </I18nProvider>,
    );
    // A decimal comma, which is what a German keyboard types and what en-US would read as nothing.
    await user.type(input(), '1234,56');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(1234.56);
    expect(input().value).toBe('1.234,56');
  });

  it('takes a currency or a percent format', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <NumberField
        label="Amount"
        defaultValue={12.5}
        formatOptions={{ style: 'currency', currency: 'EUR' }}
      />,
    );
    expect(input().value).toContain('12.50');
    expect(input().value).toMatch(/€/);
    unmount();

    const onChange = vi.fn();
    render(<NumberField label="Amount" formatOptions={{ style: 'percent' }} onChange={onChange} />);
    await user.type(input(), '40%');
    await user.tab();
    // 40% is four tenths, which is the value the app gets.
    expect(onChange).toHaveBeenLastCalledWith(0.4);
  });

  it('refuses what is not a number instead of losing the value to it', async () => {
    const user = userEvent.setup();
    render(<NumberField label="Amount" defaultValue={7} />);
    await user.clear(input());
    await user.type(input(), 'abc');
    await user.tab();
    // Nothing numeric was typed, so there is nothing to show.
    expect(input().value).toBe('');
  });

  it('hides the stepper when asked, and the field still works', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Amount" defaultValue={1} hideStepper onChange={onChange} />);
    expect(screen.queryByRole('button')).toBeNull();
    input().focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('carries the label, the supporting text and the error the way a text field does', () => {
    const { container, rerender } = render(
      <NumberField label="Amount" supportingText="In euros" defaultValue={1} />,
    );
    expect(container.querySelector('.grange-number-field-supporting')?.textContent).toBe('In euros');

    rerender(
      <NumberField label="Amount" supportingText="In euros" errorText="Too small" error defaultValue={1} />,
    );
    expect(container.querySelector('.grange-number-field-supporting')?.textContent).toBe('Too small');
    expect(container.querySelector('.grange-number-field')?.getAttribute('data-error')).toBe('true');
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('comes in both variants, and takes the variant from the provider', () => {
    const { container, unmount } = render(<OutlinedNumberField label="Amount" />);
    expect(container.querySelector('.grange-number-field')?.getAttribute('data-variant')).toBe('outlined');
    unmount();

    const filled = render(<FilledNumberField label="Amount" />);
    expect(filled.container.querySelector('.grange-number-field')?.getAttribute('data-variant')).toBe(
      'filled',
    );
    filled.unmount();

    const provided = render(
      <GrangeProvider defaultProps={{ NumberField: { variant: 'outlined', hideStepper: true } }}>
        <NumberField label="Amount" />
      </GrangeProvider>,
    );
    expect(provided.container.querySelector('.grange-number-field')?.getAttribute('data-variant')).toBe(
      'outlined',
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reaches every slot', () => {
    const { container } = render(
      <GrangeProvider
        classNames={{
          NumberField: {
            root: 'x-root',
            container: 'x-container',
            label: 'x-label',
            input: 'x-input',
            supporting: 'x-supporting',
            stepper: 'x-stepper',
          },
        }}
      >
        <NumberField label="Amount" supportingText="In euros" />
      </GrangeProvider>,
    );
    for (const name of ['x-root', 'x-container', 'x-label', 'x-input', 'x-supporting', 'x-stepper']) {
      expect(container.querySelector(`.${name}`), name).toBeTruthy();
    }
  });

  it('is controlled when it is given a value', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<NumberField label="Amount" value={3} />);
    expect(input().value).toBe('3');
    await user.click(stepper('Increase'));
    // No handler, so nothing moves: the value is the app's.
    expect(input().value).toBe('3');
    rerender(<NumberField label="Amount" value={8} />);
    expect(input().value).toBe('8');
  });
});

describe('MaskedTextField', () => {
  const PHONE = '(000) 000-0000';
  const field = () => screen.getByLabelText('Phone') as HTMLInputElement;

  it('shows the pattern before anything is typed', () => {
    render(<MaskedTextField label="Phone" mask={PHONE} />);
    expect(field().value).toBe('(___) ___-____');
  });

  it('fills the pattern as it is typed, writing the literals', async () => {
    const user = userEvent.setup();
    render(<MaskedTextField label="Phone" mask={PHONE} />);
    await user.type(field(), '555');
    expect(field().value).toBe('(555) ___-____');
    await user.type(field(), '1234567');
    expect(field().value).toBe('(555) 123-4567');
  });

  it('reports the typed characters, not what is shown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MaskedTextField label="Phone" mask={PHONE} onChange={onChange} />);
    await user.type(field(), '5551234567');
    expect(onChange).toHaveBeenLastCalledWith('5551234567');
  });

  it('reports the masked string instead when asked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MaskedTextField label="Phone" mask={PHONE} includeLiterals onChange={onChange} />);
    await user.type(field(), '5551234567');
    expect(onChange).toHaveBeenLastCalledWith('(555) 123-4567');
  });

  it('drops what does not fit rather than letting it in', async () => {
    const user = userEvent.setup();
    render(<MaskedTextField label="Phone" mask={PHONE} />);
    await user.type(field(), '5a5b5c');
    expect(field().value).toBe('(555) ___-____');
  });

  it('takes a paste of an already formatted value', async () => {
    const user = userEvent.setup();
    render(<MaskedTextField label="Phone" mask={PHONE} />);
    field().focus();
    await user.paste('555-123-4567');
    expect(field().value).toBe('(555) 123-4567');
  });

  it('puts the caret where the next character goes, not at the end of the pattern', async () => {
    const user = userEvent.setup();
    render(<MaskedTextField label="Phone" mask={PHONE} />);
    await user.type(field(), '5');
    // "(5" — inside the brackets, not after the trailing prompts.
    expect(field().selectionStart).toBe(2);
    await user.type(field(), '55');
    // Past the ") " the mask supplied.
    expect(field().selectionStart).toBe(4);
    await user.type(field(), '1');
    expect(field().selectionStart).toBe(7);
  });

  it('deletes the character rather than the literal in front of it', async () => {
    const user = userEvent.setup();
    render(<MaskedTextField label="Phone" mask={PHONE} />);
    await user.type(field(), '5551');
    expect(field().value).toBe('(555) 1__-____');
    await user.keyboard('{Backspace}');
    expect(field().value).toBe('(555) ___-____');
    await user.keyboard('{Backspace}');
    expect(field().value).toBe('(55_) ___-____');
  });

  it('says when the pattern is full, and when it stops being', async () => {
    const user = userEvent.setup();
    const onCompleteChange = vi.fn();
    render(<MaskedTextField label="Phone" mask={PHONE} onCompleteChange={onCompleteChange} />);
    await user.type(field(), '555123456');
    expect(onCompleteChange).not.toHaveBeenCalled();
    await user.type(field(), '7');
    expect(onCompleteChange).toHaveBeenLastCalledWith(true);
    await user.keyboard('{Backspace}');
    expect(onCompleteChange).toHaveBeenLastCalledWith(false);
  });

  it('takes a different prompt character', () => {
    render(<MaskedTextField label="Phone" mask="000-000" prompt="#" />);
    expect(field().value).toBe('###-###');
  });

  it('works with a mask of letters and digits', async () => {
    const user = userEvent.setup();
    render(<MaskedTextField label="Phone" mask="LL 00 LL" />);
    await user.type(field(), 'ab12cd');
    expect(field().value).toBe('ab 12 cd');
  });

  it('is controlled when it is given a value', async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState('555');
      return (
        <>
          <MaskedTextField label="Phone" mask={PHONE} value={value} onChange={setValue} />
          <p>raw: {value}</p>
        </>
      );
    }
    render(<Host />);
    expect(field().value).toBe('(555) ___-____');
    await user.type(field(), '1');
    expect(screen.getByText('raw: 5551')).toBeTruthy();
    expect(field().value).toBe('(555) 1__-____');
  });

  it('starts from a formatted default value', () => {
    render(<MaskedTextField label="Phone" mask={PHONE} defaultValue="(555) 123-4567" />);
    expect(field().value).toBe('(555) 123-4567');
  });

  it('keeps the field it is built on: label, supporting text, error and both variants', () => {
    const { container } = render(
      <MaskedTextField
        label="Phone"
        mask={PHONE}
        variant="outlined"
        supportingText="With the area code"
        error
        errorText="Not a number we recognise"
      />,
    );
    expect(container.querySelector('.grange-text-field')?.getAttribute('data-variant')).toBe('outlined');
    expect(container.querySelector('.grange-text-field-supporting')?.textContent).toBe(
      'Not a number we recognise',
    );
    // No counter, because a mask's literals are not characters anybody typed.
    expect(container.textContent).not.toMatch(/\/14/);
  });
});
