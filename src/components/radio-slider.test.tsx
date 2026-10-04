import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GrangeProvider, Radio, RadioGroup, Slider, radio, slider } from '../index';

describe('token geometry', () => {
  it('matches RadioButtonTokens', () => {
    expect(radio).toMatchObject({ size: 20, ringWidth: 2, dotSize: 10, stateLayerSize: 40 });
  });

  it('matches the Expressive SliderTokens', () => {
    expect(slider).toMatchObject({
      trackHeight: 16,
      handleWidth: 4,
      handleHeight: 44,
      handleWidthActive: 2,
      handleGap: 6,
      stopSize: 4,
      valueIndicatorGap: 12,
    });
  });
});

function Group(props: {
  value?: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <RadioGroup label="Delivery" name="delivery" {...props}>
      <Radio value="standard">Standard</Radio>
      <Radio value="express">Express</Radio>
      <Radio value="courier" disabled>
        Courier
      </Radio>
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('is a named radiogroup over real radio inputs', () => {
    render(<Group />);
    expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeTruthy();
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios).toHaveLength(3);
    expect(radios[0]!.type).toBe('radio');
    expect(radios[0]!.name).toBe('delivery');
  });

  it('selects one option at a time', async () => {
    const onChange = vi.fn();
    render(<Group onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Standard' }));
    expect(onChange).toHaveBeenCalledWith('standard');

    await userEvent.click(screen.getByRole('radio', { name: 'Express' }));
    expect(onChange).toHaveBeenLastCalledWith('express');
    expect((screen.getByRole('radio', { name: 'Standard' }) as HTMLInputElement).checked).toBe(false);
  });

  it('is one tab stop, with the arrows moving inside it', async () => {
    render(
      <>
        <button type="button">before</button>
        <Group />
      </>,
    );
    screen.getByRole('button', { name: 'before' }).focus();
    await userEvent.tab();

    const standard = screen.getByRole('radio', { name: 'Standard' });
    expect(document.activeElement).toBe(standard);

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Express' }));
  });

  it('can be controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState('standard');
      return (
        <>
          <Group value={value} onChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('radio', { name: 'Express' }));
    expect(screen.getByText('express')).toBeTruthy();
  });

  it('disables one option without disabling the group', () => {
    render(<Group />);
    expect((screen.getByRole('radio', { name: 'Courier' }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('radio', { name: 'Standard' }) as HTMLInputElement).disabled).toBe(false);
  });

  it('disables every option when the group is disabled', () => {
    render(<Group disabled />);
    for (const input of screen.getAllByRole('radio') as HTMLInputElement[]) {
      expect(input.disabled).toBe(true);
    }
  });

  it('marks the error state on the group, which the radios read from', () => {
    const { container } = render(<Group error />);
    expect((container.querySelector('.grange-radio-group') as HTMLElement).dataset.error).toBe('true');
  });

  it('lays out vertically by default and horizontally on request', () => {
    const { container, unmount } = render(<Group />);
    expect((container.querySelector('.grange-radio-group') as HTMLElement).dataset.orientation).toBe(
      'vertical',
    );
    unmount();

    render(
      <GrangeProvider defaultProps={{ RadioGroup: { orientation: 'horizontal' } }}>
        <Group />
      </GrangeProvider>,
    );
    expect((document.querySelector('.grange-radio-group') as HTMLElement).dataset.orientation).toBe(
      'horizontal',
    );
  });

  it('refuses to render a Radio outside a group, since the group owns the value', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Radio value="lonely">Lonely</Radio>)).toThrow(/must be inside a RadioGroup/);
    quiet.mockRestore();
  });

  it('reaches the ring and label slots', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Radio: { ring: 'my-ring', label: 'my-label' } }}>
        <Group />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-radio-ring')?.className).toContain('my-ring');
    expect(container.querySelector('.grange-radio-label')?.className).toContain('my-label');
  });
});

describe('Slider', () => {
  const thumb = () => screen.getByRole('slider') as HTMLInputElement;

  it('is a real range input with the right bounds', () => {
    render(<Slider label="Volume" defaultValue={40} minValue={0} maxValue={100} />);
    // A native range input carries its own value, min and max; aria-valuenow would be redundant
    // beside them, so React Aria does not add one.
    expect(thumb().type).toBe('range');
    expect(thumb().value).toBe('40');
    expect(thumb().min).toBe('0');
    expect(thumb().max).toBe('100');
  });

  it('is labelled, and shows the value alongside', () => {
    render(<Slider label="Volume" defaultValue={40} />);
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
  });

  it('moves with the arrow keys and respects the step', async () => {
    const onChange = vi.fn();
    render(<Slider label="Volume" defaultValue={40} step={5} onChange={onChange} />);
    thumb().focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(45);
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(35);
  });

  it('jumps to the ends with Home and End', async () => {
    const onChange = vi.fn();
    render(<Slider label="Volume" defaultValue={40} minValue={0} maxValue={100} onChange={onChange} />);
    thumb().focus();
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(0);
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('gives a range two handles, each separately labelled', () => {
    render(<Slider label="Price" defaultValue={[20, 80]} />);
    const thumbs = screen.getAllByRole('slider') as HTMLInputElement[];
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]!.value).toBe('20');
    expect(thumbs[1]!.value).toBe('80');
  });

  it('fills only between the handles of a range', () => {
    const { container } = render(<Slider label="Price" defaultValue={[20, 80]} />);
    // Three pieces: empty, filled, empty.
    expect(container.querySelectorAll('.grange-slider-track > span[aria-hidden]').length).toBe(3);
  });

  it('draws stop indicators only when asked', () => {
    const { container, unmount } = render(
      <Slider label="Volume" defaultValue={100} minValue={0} maxValue={100} step={25} stops />,
    );
    // At full value the filled run spans the track, so the three inner stops sit on it.
    expect(container.querySelectorAll('.grange-slider-stop').length).toBe(3);
    unmount();

    // Same slider without the opt-in: a step of 25 does not imply dots.
    const { container: plain } = render(
      <Slider label="Volume" defaultValue={100} minValue={0} maxValue={100} step={25} />,
    );
    expect(plain.querySelectorAll('.grange-slider-stop').length).toBe(0);
  });

  it('survives a step of zero rather than writing calc(NaN%) into the DOM', () => {
    const { container } = render(
      <Slider label="Volume" defaultValue={50} step={0} minValue={0} maxValue={100} />,
    );
    const styles = [...container.querySelectorAll<HTMLElement>('[style]')].map((el) =>
      el.getAttribute('style'),
    );
    expect(styles.join(' ')).not.toContain('NaN');
  });

  it('formats the value for both the readout and assistive tech', () => {
    render(
      <Slider
        label="Budget"
        defaultValue={1500}
        maxValue={5000}
        formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
      />,
    );
    expect(thumb().getAttribute('aria-valuetext')).toContain('1,500');
  });

  it('does not move while disabled', async () => {
    const onChange = vi.fn();
    render(<Slider label="Volume" defaultValue={40} disabled onChange={onChange} />);
    thumb().focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reaches the track and handle slots', () => {
    const { container } = render(
      <GrangeProvider classNames={{ Slider: { track: 'my-track', handle: 'my-handle' } }}>
        <Slider label="Volume" defaultValue={40} />
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-slider-track')?.className).toContain('my-track');
    expect(container.querySelector('.grange-slider-handle')?.className).toContain('my-handle');
  });
});
