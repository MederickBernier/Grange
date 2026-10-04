import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ColorArea,
  ColorField,
  ColorSlider,
  ColorWheel,
  GrangeProvider,
  colorSpec,
  list,
  parseColor,
  type Color,
} from '../index';

describe('tokens', () => {
  it('borrows its sizes from what the library already draws', () => {
    // Material has no colour picker, so these are chosen — but chosen out of ListTokens.
    expect(colorSpec.trackSize).toBe(list.leadingIcon);
    expect(colorSpec.swatchSize).toBe(list.avatar);
    expect(colorSpec.wheelInnerRadius).toBeLessThan(colorSpec.wheelOuterRadius);
  });
});

describe('ColorArea', () => {
  const inputs = () => screen.getAllByRole('slider');
  const all = (c: HTMLElement) => [...c.querySelectorAll('input')] as HTMLInputElement[];

  it('is range inputs, not a canvas', () => {
    const { container } = render(<ColorArea defaultValue="hsb(220, 50%, 60%)" />);
    /*
     * One input per axis, so the square is reachable by keyboard. A canvas with mousedown
     * handlers cannot be used without a pointer at all.
     */
    expect(all(container)).toHaveLength(2);
  });

  it('exposes one 2D slider rather than two separate ones', () => {
    const { container } = render(<ColorArea defaultValue="hsb(220, 50%, 60%)" />);
    // The second input is hidden from assistive tech on purpose: the square is one control.
    expect(inputs()).toHaveLength(1);
    expect(all(container)[1]!.getAttribute('aria-hidden')).toBe('true');
    expect(inputs()[0]!.getAttribute('aria-roledescription')).toBe('2D slider');
  });

  it('describes the colour in words, not in numbers', () => {
    render(<ColorArea defaultValue="hsb(220, 50%, 60%)" />);
    const text = inputs()[0]!.getAttribute('aria-valuetext') ?? '';
    expect(text).toContain('Saturation: 50%');
    expect(text).toContain('Brightness: 60%');
    // And the colour itself, which is the part a number can never give.
    expect(text.toLowerCase()).toContain('blue');
  });

  it('changes the value from the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorArea
        defaultValue="hsb(220, 50%, 60%)"
        xChannel="saturation"
        yChannel="brightness"
        onChange={onChange}
      />,
    );

    inputs()[0]!.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalled();
    expect((onChange.mock.lastCall![0] as Color).getChannelValue('saturation')).toBeGreaterThan(50);
  });

  it('takes the channels it is told to show', () => {
    render(<ColorArea defaultValue="rgb(100, 120, 140)" xChannel="red" yChannel="green" />);
    const text = inputs()[0]!.getAttribute('aria-valuetext') ?? '';
    expect(text).toContain('Red: 100');
    expect(text).toContain('Green: 120');
  });

  it('takes its size from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ ColorArea: { size: 120 } }}>
        <ColorArea defaultValue="#336699" />
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-color-area') as HTMLElement).style.width).toBe('120px');
  });
});

describe('ColorSlider', () => {
  const slider = () => screen.getByRole('slider');

  it('announces the channel and its value in words, not as a number', () => {
    render(<ColorSlider channel="hue" defaultValue="hsl(210, 100%, 50%)" />);
    // "Hue" and "210°, cyan blue" rather than "0.58".
    expect(screen.getByRole('slider', { name: 'Hue' })).not.toBeNull();
    expect(slider().getAttribute('aria-valuetext')).toContain('210°');
    expect(screen.getByText('210°')).not.toBeNull();
  });

  it('moves with the arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSlider channel="hue" defaultValue="hsl(210, 100%, 50%)" onChange={onChange} />);

    slider().focus();
    await user.keyboard('{ArrowRight}');
    expect((onChange.mock.lastCall![0] as Color).getChannelValue('hue')).toBe(211);
  });

  it('does an alpha channel as readily as a hue', () => {
    render(<ColorSlider channel="alpha" defaultValue="hsla(210, 100%, 50%, 0.4)" />);
    expect(screen.getByRole('slider', { name: 'Alpha' })).not.toBeNull();
    expect(screen.getByText('40%')).not.toBeNull();
  });

  it('can be labelled and have its value hidden', () => {
    render(<ColorSlider channel="hue" label="Shade" showValue={false} defaultValue="hsl(10, 100%, 50%)" />);
    expect(screen.getByText('Shade')).not.toBeNull();
    expect(screen.queryByText(/10°/)).toBeNull();
  });

  it('stands still while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSlider channel="hue" defaultValue="hsl(210, 100%, 50%)" disabled onChange={onChange} />);
    slider().focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ColorWheel', () => {
  it('is a hue slider drawn round', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorWheel defaultValue="hsl(210, 100%, 50%)" onChange={onChange} />);

    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuetext')).toContain('210°');

    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalled();
  });

  it('is as wide as twice its outer radius', () => {
    const { container } = render(
      <ColorWheel defaultValue="hsl(0, 100%, 50%)" outerRadius={60} innerRadius={40} />,
    );
    expect((container.querySelector('.grange-color-wheel') as HTMLElement).style.width).toBe('120px');
  });
});

describe('ColorField', () => {
  const input = () => screen.getByRole('textbox', { name: /Colour/ });

  it('holds a colour as text, with the field chrome every other field has', () => {
    const { container } = render(<ColorField label="Colour" defaultValue="#336699" />);
    expect(input()).toHaveProperty('value', '#336699');
    expect(container.querySelector('.grange-color-field')).not.toBeNull();
  });

  it('commits what was typed when it is a colour', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorField label="Colour" defaultValue="#336699" onChange={onChange} />);

    await user.clear(input());
    await user.type(input(), '#ff0000');
    await user.tab();
    expect((onChange.mock.lastCall![0] as Color).toString('hex')).toBe('#FF0000');
  });

  it('reverts something unparseable rather than marking it as an error', async () => {
    const user = userEvent.setup();
    render(<ColorField label="Colour" defaultValue="#336699" />);

    await user.clear(input());
    await user.type(input(), 'not a colour');
    await user.tab();
    /*
     * A red ring for a half-typed "#ab" would fire on the way to every valid colour, so the
     * hook simply does not commit it and the field goes back to what it had.
     */
    expect(input()).toHaveProperty('value', '#336699');
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('steps the value with the arrow keys, which is how a hex is nudged', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorField label="Colour" defaultValue="#336699" onChange={onChange} />);

    input().focus();
    await user.keyboard('{ArrowUp}');
    expect((onChange.mock.lastCall![0] as Color).toString('hex')).toBe('#33669A');
  });

  it('shows the colour beside the field, as decoration rather than as a second announcement', () => {
    const { container } = render(<ColorField label="Colour" defaultValue="#336699" />);
    const swatch = container.querySelector('.grange-color-field-leading-icon [aria-hidden="true"]');
    expect(swatch).not.toBeNull();
  });

  it('draws its error the way every other field does', () => {
    render(<ColorField label="Colour" error errorText="Pick something darker" defaultValue="#ffffff" />);
    expect(screen.getByText('Pick something darker')).not.toBeNull();
    expect(input().getAttribute('aria-describedby')).not.toBeNull();
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<Color | null>(parseColor('#112233'));
      return (
        <>
          <ColorField label="Colour" value={value} onChange={setValue} />
          <p>value: {value?.toString('hex')}</p>
        </>
      );
    }
    render(<Controlled />);
    input().focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText('value: #112234')).not.toBeNull();
  });

  it('takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ ColorField: { variant: 'outlined', showSwatch: false } }}>
        <ColorField label="Colour" defaultValue="#336699" />
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-color-field') as HTMLElement).dataset.variant).toBe('outlined');
    expect(container.querySelector('.grange-color-field-leading-icon')).toBeNull();
  });
});
