import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilledTextField,
  GrangeProvider,
  OutlinedTextField,
  TextField,
  counterText,
  textField,
} from '../index';

const field = () => screen.getByRole('textbox') as HTMLInputElement;
const root = (container: HTMLElement) => container.querySelector('.grange-text-field') as HTMLElement;

describe('tokens', () => {
  it('matches the text field token values', () => {
    expect(textField).toMatchObject({
      height: 56,
      padding: 16,
      iconSize: 24,
      indicatorHeight: 1,
      indicatorHeightFocused: 2,
      outlineWidth: 1,
      outlineWidthFocused: 2,
      filledCorner: 4,
      outlinedCorner: 4,
    });
  });

  it('formats the counter', () => {
    expect(counterText(3, 10)).toBe('3/10');
    expect(counterText(0, 5)).toBe('0/5');
  });
});

describe('labelling', () => {
  it('ties the label to the input', () => {
    render(<TextField label="Email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
  });

  it('ties the supporting text to the input, so it is announced with it', () => {
    render(<TextField label="Email" supportingText="We never share it" />);
    const described = field().getAttribute('aria-describedby') ?? '';
    const ids = described.split(' ').filter(Boolean);
    const text = ids.map((id) => document.getElementById(id)?.textContent).join(' ');
    expect(text).toContain('We never share it');
  });

  it('announces the error message in place of the supporting text', () => {
    render(<TextField label="Email" supportingText="We never share it" error errorText="Not an email" />);
    const described = field().getAttribute('aria-describedby') ?? '';
    const text = described
      .split(' ')
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent)
      .join(' ');
    expect(text).toContain('Not an email');
    expect(text).not.toContain('We never share it');
    expect(field().getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps the supporting text when in error without an error message', () => {
    render(<TextField label="Email" supportingText="Still here" error />);
    expect(screen.getByText('Still here')).toBeTruthy();
  });

  it('marks required through aria by default, leaving the messaging to errorText', () => {
    render(<TextField label="Email" required />);
    expect(field().getAttribute('aria-required')).toBe('true');
    // No native required, so the browser does not put its own bubble over the M3 error text.
    expect(field().required).toBe(false);
  });

  it('adds the native required attribute when native validation is asked for', () => {
    render(<TextField label="Email" required validationBehavior="native" />);
    expect(field().required).toBe(true);
  });
});

describe('value', () => {
  it('reports typing', async () => {
    const onChange = vi.fn();
    render(<TextField label="Email" onChange={onChange} />);
    await userEvent.type(field(), 'hi');
    expect(onChange).toHaveBeenLastCalledWith('hi');
  });

  it('can be controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <>
          <TextField label="Email" value={value} onChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.type(field(), 'abc');
    expect(screen.getByText('abc')).toBeTruthy();
  });

  it('does not accept typing while disabled or read only', async () => {
    const onChange = vi.fn();
    const { unmount } = render(<TextField label="Email" disabled onChange={onChange} />);
    await userEvent.type(field(), 'x');
    expect(onChange).not.toHaveBeenCalled();
    unmount();

    render(<TextField label="Email" readOnly defaultValue="locked" onChange={onChange} />);
    await userEvent.type(field(), 'x');
    expect(onChange).not.toHaveBeenCalled();
    expect(field().value).toBe('locked');
  });
});

describe('the floating label', () => {
  it('rests inside the field when empty, and floats once there is a value', async () => {
    const { container } = render(<TextField label="Email" />);
    expect(root(container).dataset.populated).toBeUndefined();

    await userEvent.type(field(), 'a');
    expect(root(container).dataset.populated).toBe('true');
  });

  it('floats while focused even with nothing typed, so the two never overlap', async () => {
    const { container } = render(<TextField label="Email" />);
    await userEvent.click(field());
    expect(root(container).dataset.populated).toBe('true');
    expect(root(container).dataset.focused).toBe('true');
  });

  it('stays floated when a placeholder is showing through', () => {
    const { container } = render(<TextField label="Email" placeholder="you@example.com" />);
    expect(root(container).dataset.populated).toBe('true');
  });
});

describe('variants', () => {
  it('defaults to filled, and draws the indicator rather than an outline', () => {
    const { container } = render(<FilledTextField label="Email" />);
    expect(root(container).dataset.variant).toBe('filled');
    expect(container.querySelector('fieldset')).toBeNull();
  });

  it('gives outlined a real fieldset and legend, so the border breaks for the label', () => {
    const { container } = render(<OutlinedTextField label="Email" />);
    expect(root(container).dataset.variant).toBe('outlined');
    const legend = container.querySelector('fieldset legend');
    expect(legend).not.toBeNull();
    // The legend carries the label text so the notch is exactly its width.
    expect(legend?.textContent).toBe('Email');
  });

  it('hides the outline from assistive tech, since it is decoration', () => {
    const { container } = render(<OutlinedTextField label="Email" />);
    expect(container.querySelector('fieldset')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes the variant from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ TextField: { variant: 'outlined' } }}>
        <TextField label="Email" />
      </GrangeProvider>,
    );
    expect(root(container).dataset.variant).toBe('outlined');
  });
});

describe('extras', () => {
  it('renders a textarea when multiline, with the rows asked for', () => {
    render(<TextField label="Notes" multiline rows={5} />);
    const input = screen.getByRole('textbox') as unknown as HTMLTextAreaElement;
    expect(input.tagName).toBe('TEXTAREA');
    expect(input.rows).toBe(5);
  });

  it('renders an input of the type asked for', () => {
    render(<TextField label="Email" type="email" />);
    expect(field().type).toBe('email');
  });

  it('shows a counter that follows the value and is announced with the field', async () => {
    render(<TextField label="Bio" maxLength={10} />);
    expect(screen.getByText('0/10')).toBeTruthy();
    await userEvent.type(field(), 'abc');
    expect(screen.getByText('3/10')).toBeTruthy();
    expect(field().maxLength).toBe(10);

    const described = field().getAttribute('aria-describedby') ?? '';
    const text = described
      .split(' ')
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent)
      .join(' ');
    expect(text).toContain('3/10');
  });

  it('renders prefix, suffix and both icons', () => {
    const { container } = render(
      <TextField
        label="Amount"
        prefix="£"
        suffix=".00"
        leadingIcon={<svg data-testid="lead" />}
        trailingIcon={<svg data-testid="trail" />}
      />,
    );
    expect(screen.getByText('£')).toBeTruthy();
    expect(screen.getByText('.00')).toBeTruthy();
    expect(container.querySelector('.grange-text-field-leading-icon')).not.toBeNull();
    expect(container.querySelector('.grange-text-field-trailing-icon')).not.toBeNull();
  });

  it('reaches the container, label, input and supporting slots', () => {
    const { container } = render(
      <GrangeProvider
        classNames={{
          TextField: { container: 'my-container', label: 'my-label', input: 'my-input', supporting: 'my-supporting' },
        }}
      >
        <TextField label="Email" supportingText="Hint" />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-text-field-container')?.className).toContain('my-container');
    expect(container.querySelector('.grange-text-field-label')?.className).toContain('my-label');
    expect(container.querySelector('.grange-text-field-input')?.className).toContain('my-input');
    expect(container.querySelector('.grange-text-field-supporting')?.className).toContain('my-supporting');
  });

  it('works in a form under its name', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <TextField label="Email" name="email" defaultValue="a@b.c" />
        <button type="submit">Go</button>
      </form>,
    );
    expect(field().name).toBe('email');
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
