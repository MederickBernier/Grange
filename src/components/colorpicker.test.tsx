import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ColorPicker,
  ColorSwatchPicker,
  FlatColorPicker,
  GrangeProvider,
  SwatchGridDelegate,
  parseColor,
  type Color,
} from '../index';

/*
 * The delegate is tested as arithmetic. It is the piece that makes the arrows match the
 * picture, and it needs no DOM at all to be sure of.
 */
describe('SwatchGridDelegate', () => {
  // Three rows of four.
  const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
  const grid = new SwatchGridDelegate(keys, 4);

  it('moves one step along a row', () => {
    expect(grid.getKeyRightOf('a')).toBe('b');
    expect(grid.getKeyLeftOf('b')).toBe('a');
  });

  it('stops at the end of a row rather than wrapping to the far side', () => {
    // Wrapping looks like a jump across the palette, which is not what pressing right means.
    expect(grid.getKeyRightOf('d')).toBeNull();
    expect(grid.getKeyLeftOf('e')).toBeNull();
  });

  it('moves a whole row at a time, which is the reason it exists', () => {
    expect(grid.getKeyBelow('a')).toBe('e');
    expect(grid.getKeyAbove('i')).toBe('e');
  });

  it('stops at the top and the bottom', () => {
    expect(grid.getKeyAbove('a')).toBeNull();
    expect(grid.getKeyBelow('l')).toBeNull();
  });

  it('swaps left and right in a right-to-left layout', () => {
    const rtl = new SwatchGridDelegate(keys, 4, 'rtl');
    expect(rtl.getKeyRightOf('b')).toBe('a');
    expect(rtl.getKeyLeftOf('a')).toBe('b');
  });

  it('knows its ends', () => {
    expect(grid.getFirstKey()).toBe('a');
    expect(grid.getLastKey()).toBe('l');
  });

  it('handles a key it has never heard of', () => {
    expect(grid.getKeyBelow('zz')).toBeNull();
    expect(grid.getKeyRightOf('zz')).toBeNull();
  });

  it('survives a ragged last row', () => {
    const ragged = new SwatchGridDelegate(['a', 'b', 'c', 'd', 'e'], 4);
    expect(ragged.getKeyBelow('b')).toBeNull();
    expect(ragged.getKeyBelow('a')).toBe('e');
  });
});

const palette = ['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#4caf50'];

describe('ColorSwatchPicker', () => {
  const options = () => screen.getAllByRole('option');

  it('names each swatch rather than reading out a hex code', () => {
    render(<ColorSwatchPicker colors={palette} aria-label="Palette" />);
    const names = options().map((option) => option.getAttribute('aria-label') ?? '');
    // "vivid red" rather than "#f44336", which is what a palette has to say out loud.
    expect(names[0]).not.toContain('#');
    expect(names[0]?.length).toBeGreaterThan(3);
  });

  it('marks the chosen swatch', () => {
    render(<ColorSwatchPicker colors={palette} defaultValue="#9c27b0" aria-label="Palette" />);
    expect(options()[2]!.getAttribute('aria-selected')).toBe('true');
  });

  it('matches a value written in another format', () => {
    // '#f44336' and 'rgb(244, 67, 54)' are the same colour and must not be two options.
    render(<ColorSwatchPicker colors={palette} defaultValue="rgb(244, 67, 54)" aria-label="Palette" />);
    expect(options()[0]!.getAttribute('aria-selected')).toBe('true');
  });

  it('reports the colour that was chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSwatchPicker colors={palette} onChange={onChange} aria-label="Palette" />);

    await user.click(options()[1]!);
    expect((onChange.mock.lastCall![0] as Color).toString('hex')).toBe('#E91E63');
  });

  it('moves across the grid with the arrows, not along a list', async () => {
    const user = userEvent.setup();
    render(<ColorSwatchPicker colors={palette} columns={3} defaultValue="#f44336" aria-label="Palette" />);

    options()[0]!.focus();
    await user.keyboard('{ArrowDown}');
    // Three to a row, so down is the fourth swatch rather than the second.
    expect(document.activeElement).toBe(options()[3]);
  });

  it('lays out the columns it was told to', () => {
    const { container } = render(<ColorSwatchPicker colors={palette} columns={3} aria-label="Palette" />);
    expect(
      (container.querySelector('.grange-color-swatches') as HTMLElement).style.gridTemplateColumns,
    ).toContain('repeat(3,');
  });

  it('shows an unreadable colour as transparent rather than taking the palette down', () => {
    // parseColor throws on anything it does not understand, which would be the whole grid.
    render(<ColorSwatchPicker colors={['#f44336', 'not a colour']} aria-label="Palette" />);
    expect(options()).toHaveLength(2);
  });

  it('takes its layout from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ ColorSwatchPicker: { columns: 2, size: 20 } }}>
        <ColorSwatchPicker colors={palette} aria-label="Palette" />
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-color-swatches') as HTMLElement).style.gridTemplateColumns).toBe(
      'repeat(2, 20px)',
    );
  });
});

describe('ColorPicker', () => {
  const trigger = () => screen.getByRole('button');

  it('names its trigger by the colour, not by a hex code', () => {
    render(<ColorPicker label="Brand" defaultValue="#336699" />);
    const name = trigger().getAttribute('aria-label') ?? '';
    expect(name).toContain('Brand');
    expect(name).not.toContain('#');
    expect(name.length).toBeGreaterThan('Brand'.length + 3);
  });

  it('says it opens a dialog, and opens one', async () => {
    const user = userEvent.setup();
    render(<ColorPicker label="Brand" defaultValue="#336699" />);
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');

    await user.click(trigger());
    expect(screen.getByRole('group', { name: 'Brand' })).not.toBeNull();
    // The square and the hue slider are both in there.
    expect(screen.getAllByRole('slider').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps the hue through black, which RGB would lose', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="Brand" defaultValue="hsb(200, 80%, 60%)" onChange={onChange} />);

    await user.click(trigger());
    const [area] = screen.getAllByRole('slider');
    area!.focus();
    await user.keyboard('{ArrowLeft}');
    /*
     * Every dark colour is rgb(0, 0, 0), so a picker holding RGB forgets the hue as soon as
     * brightness reaches the bottom. The panel works in HSB for exactly this.
     */
    expect((onChange.mock.lastCall![0] as Color).getChannelValue('hue')).toBe(200);
  });

  it('offers alpha and the field only when asked', async () => {
    const user = userEvent.setup();
    render(<ColorPicker label="Brand" defaultValue="#336699" showAlpha showField={false} />);

    await user.click(trigger());
    expect(screen.getByRole('slider', { name: 'Alpha' })).not.toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('offers presets as a palette inside the panel', async () => {
    const user = userEvent.setup();
    render(<ColorPicker label="Brand" defaultValue="#336699" presets={palette} />);

    await user.click(trigger());
    const presets = screen.getByRole('listbox', { name: 'Presets' });
    expect(within(presets).getAllByRole('option')).toHaveLength(6);
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<Color>(parseColor('hsb(10, 50%, 50%)'));
      return (
        <>
          <ColorPicker label="Brand" value={value} onChange={setValue} />
          <p>hue: {value.getChannelValue('hue')}</p>
        </>
      );
    }
    render(<Controlled />);
    await user.click(trigger());
    screen.getAllByRole('slider')[1]!.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('hue: 11')).not.toBeNull();
  });
});

describe('FlatColorPicker', () => {
  it('is the same panel without the trigger', () => {
    render(<FlatColorPicker label="Brand" defaultValue="#336699" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('group', { name: 'Brand' })).not.toBeNull();
    expect(screen.getAllByRole('slider').length).toBeGreaterThanOrEqual(2);
  });
});
