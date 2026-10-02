import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import {
  Fab,
  GrangeProvider,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
  fabSizes,
  splitButtonSizes,
} from '../index';

const radii = (el: HTMLElement) => ({
  tl: el.style.borderTopLeftRadius,
  tr: el.style.borderTopRightRadius,
  bl: el.style.borderBottomLeftRadius,
  br: el.style.borderBottomRightRadius,
});

describe('Fab tokens', () => {
  // Straight from FabSmall / FabBaseline / FabMedium / FabLarge.
  it.each([
    ['small', 40, 12, 24],
    ['baseline', 56, 16, 24],
    ['medium', 80, 20, 28],
    ['large', 96, 28, 32],
  ] as const)('%s is %spx with a %spx corner and a %spx icon', (size, box, corner, icon) => {
    expect(fabSizes[size]).toEqual({ size: box, corner, icon });

    render(
      <Fab size={size} aria-label="Add">
        <svg />
      </Fab>,
    );
    const el = screen.getByRole('button');
    expect(el.style.getPropertyValue('--_size')).toBe(`${box}px`);
    expect(el.style.getPropertyValue('--grange-icon-size')).toBe(`${icon}px`);
    expect(radii(el).tl).toBe(`${corner}px`);
  });

  it('does not morph its corners on press, since no pressed shape is published', async () => {
    render(
      <Fab aria-label="Add">
        <svg />
      </Fab>,
    );
    const el = screen.getByRole('button');
    const before = radii(el).tl;
    await userEvent.click(el);
    expect(radii(el).tl).toBe(before);
  });

  it('defaults to the baseline size and the primary container', () => {
    render(
      <Fab aria-label="Add">
        <svg />
      </Fab>,
    );
    expect(screen.getByRole('button').dataset).toMatchObject({ size: 'baseline', variant: 'primary' });
  });

  it('takes app-wide defaults from the provider', () => {
    render(
      <GrangeProvider defaultProps={{ Fab: { size: 'large', variant: 'tertiary' } }}>
        <Fab aria-label="Add">
          <svg />
        </Fab>
      </GrangeProvider>,
    );
    expect(screen.getByRole('button').dataset).toMatchObject({ size: 'large', variant: 'tertiary' });
  });

  it('keeps a touch target only for the small size, which is under 48px', () => {
    const { unmount } = render(
      <Fab size="small" aria-label="Add">
        <svg />
      </Fab>,
    );
    expect(document.querySelector('.grange-touch')).not.toBeNull();
    unmount();

    render(
      <Fab size="baseline" aria-label="Add">
        <svg />
      </Fab>,
    );
    expect(document.querySelector('.grange-touch')).toBeNull();
  });

  it('renders as a link when given an href', () => {
    render(
      <Fab href="/new" aria-label="Add">
        <svg />
      </Fab>,
    );
    expect(screen.getByRole('button').tagName).toBe('A');
  });
});

describe('SplitButton tokens', () => {
  const split = (size: 'xs' | 's' | 'm' | 'l' | 'xl', expanded = false, locale = 'en-US') => (
    <I18nProvider locale={locale}>
      <SplitButton size={size} aria-label="Save options">
        <SplitButtonLeading>Save</SplitButtonLeading>
        <SplitButtonTrailing aria-label="More" expanded={expanded}>
          <svg />
        </SplitButtonTrailing>
      </SplitButton>
    </I18nProvider>
  );

  // Heights match the label button scale, which is what "the same five sizes" means.
  it.each([
    ['xs', 32],
    ['s', 40],
    ['m', 56],
    ['l', 96],
    ['xl', 136],
  ] as const)('%s is %spx tall on both halves', (size, height) => {
    expect(splitButtonSizes[size].height).toBe(height);
    render(split(size));
    for (const half of screen.getAllByRole('button')) {
      expect(half.style.getPropertyValue('--_height')).toBe(`${height}px`);
    }
  });

  it('keeps the outer corners full and the meeting corners tight', () => {
    render(split('s'));
    const [leading, trailing] = screen.getAllByRole('button');
    // full = height / 2 = 20px; inner = CornerValueExtraSmall = 4px
    expect(radii(leading!).tl).toBe('20px');
    expect(radii(leading!).tr).toBe('4px');
    expect(radii(trailing!).tl).toBe('4px');
    expect(radii(trailing!).tr).toBe('20px');
  });

  it('rounds the trailing inner corner fully while expanded, the token 50 percent', () => {
    render(split('s', true));
    const trailing = screen.getAllByRole('button')[1]!;
    expect(radii(trailing).tl).toBe('20px');
    expect(trailing.dataset.expanded).toBe('true');
  });

  it('mirrors which corners are inner in an RTL locale', () => {
    render(split('s', false, 'ar-EG'));
    const leading = screen.getAllByRole('button')[0]!;
    expect(radii(leading).tr).toBe('20px');
    expect(radii(leading).tl).toBe('4px');
  });

  it('pads the leading half asymmetrically, as the tokens do', () => {
    render(split('s'));
    const leading = screen.getAllByRole('button')[0]!;
    // LeadingButtonLeadingSpace 16, LeadingButtonTrailingSpace 12
    expect(leading.style.paddingLeft).toBe('16px');
    expect(leading.style.paddingRight).toBe('12px');
  });

  it('pads the trailing half equally', () => {
    render(split('s'));
    const trailing = screen.getAllByRole('button')[1]!;
    expect(trailing.style.paddingLeft).toBe('13px');
    expect(trailing.style.paddingRight).toBe('13px');
  });

  it('swaps the asymmetric padding over in RTL', () => {
    render(split('s', false, 'ar-EG'));
    const leading = screen.getAllByRole('button')[0]!;
    expect(leading.style.paddingRight).toBe('16px');
    expect(leading.style.paddingLeft).toBe('12px');
  });

  it('announces the trailing half as a menu trigger', () => {
    render(split('s', true));
    const trailing = screen.getAllByRole('button')[1]!;
    expect(trailing.getAttribute('aria-haspopup')).toBe('menu');
    expect(trailing.getAttribute('aria-expanded')).toBe('true');
  });

  it('shares one size and variant with both halves', () => {
    render(
      <SplitButton size="m" variant="tonal">
        <SplitButtonLeading>Save</SplitButtonLeading>
        <SplitButtonTrailing aria-label="More">
          <svg />
        </SplitButtonTrailing>
      </SplitButton>,
    );
    for (const half of screen.getAllByRole('button')) {
      expect(half.dataset).toMatchObject({ size: 'm', variant: 'tonal' });
    }
  });

  it('fires each half independently', async () => {
    const onAction = vi.fn();
    const onMenu = vi.fn();
    render(
      <SplitButton>
        <SplitButtonLeading onClick={onAction}>Save</SplitButtonLeading>
        <SplitButtonTrailing aria-label="More" onClick={onMenu}>
          <svg />
        </SplitButtonTrailing>
      </SplitButton>,
    );
    const [leading, trailing] = screen.getAllByRole('button');
    await userEvent.click(leading!);
    await userEvent.click(trailing!);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it('refuses to render a half outside a SplitButton', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<SplitButtonLeading>Save</SplitButtonLeading>)).toThrow(
      /must be inside a SplitButton/,
    );
    quiet.mockRestore();
  });
});
