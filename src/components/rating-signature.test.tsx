import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GrangeProvider, Rating, Signature, rating, signature } from '../index';

const stars = () => screen.getAllByRole('radio') as HTMLInputElement[];
const star = (name: string | RegExp) => screen.getByRole('radio', { name }) as HTMLInputElement;
/** A real `<input type="radio">` reports its state through `checked`, not through aria-checked. */
const checked = (name: string | RegExp) => star(name).checked;

describe('Rating', () => {
  it('keeps the chosen geometry inside what it borrows from', () => {
    // No RatingTokens upstream: a star is the shared 24px icon, and the target is deliberately
    // narrower than the 48px touch target because stars sit shoulder to shoulder.
    expect(rating).toMatchObject({ starSize: 24, gap: 4, targetSize: 32 });
    expect(rating.targetSize).toBeGreaterThan(rating.starSize);
    expect(rating.targetSize).toBeLessThan(48);
  });

  it('is a radio group, which is the pattern a rating actually is', () => {
    render(<Rating label="Quality" defaultValue={3} />);
    expect(screen.getByRole('radiogroup', { name: 'Quality' })).toBeTruthy();
    // Five options, one per star, each named so a screen reader does not read five graphics.
    expect(stars()).toHaveLength(5);
    expect(checked('3 stars out of 5')).toBe(true);
    expect(star('1 star out of 5')).toBeTruthy();
  });

  it('chooses on press and reports the number', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating label="Quality" onChange={onChange} />);
    await user.click(star('4 stars out of 5'));
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect(checked('4 stars out of 5')).toBe(true);
  });

  it('is one tab stop whose arrows move and select', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating label="Quality" defaultValue={2} onChange={onChange} />);
    await user.tab();
    expect(document.activeElement).toBe(star('2 stars out of 5'));
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('doubles the options for half stars rather than being a different control', () => {
    render(<Rating label="Quality" precision={0.5} defaultValue={2.5} />);
    expect(stars()).toHaveLength(10);
    expect(checked('2.5 stars out of 5')).toBe(true);
  });

  it('takes its own number of stars', () => {
    render(<Rating label="Quality" max={3} defaultValue={1} />);
    expect(stars()).toHaveLength(3);
    expect(star('1 star out of 3')).toBeTruthy();
  });

  it('fills each star by how much of it the value covers', () => {
    const { container } = render(<Rating label="Quality" precision={0.5} defaultValue={2.5} />);
    const fills = [...container.querySelectorAll<HTMLElement>('[class*="fill"]')].map((el) => el.style.width);
    // Two full, one half, two empty.
    expect(fills).toEqual(['100%', '100%', '50%', '0%', '0%']);
  });

  it('clears on a second press only when that is allowed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Rating label="Quality" defaultValue={3} onChange={onChange} />);
    await user.click(star('3 stars out of 5'));
    // A radio cannot be unchecked by pressing it, and nothing pretends otherwise.
    expect(checked('3 stars out of 5')).toBe(true);
    unmount();

    onChange.mockClear();
    render(<Rating label="Quality" defaultValue={3} allowClear onChange={onChange} />);
    await user.click(star('3 stars out of 5'));
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(checked('3 stars out of 5')).toBe(false);
  });

  it('is a labelled image when read only, not a group of options nobody can choose', () => {
    render(<Rating label="Quality" value={4} readOnly />);
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.getByRole('img', { name: '4 stars out of 5' })).toBeTruthy();
  });

  it('is still a control when disabled, just not a usable one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Rating label="Quality" defaultValue={2} disabled onChange={onChange} />);
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    for (const input of stars()) expect(input.disabled).toBe(true);
    await user.click(star('5 stars out of 5'));
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('.grange-rating')?.getAttribute('data-disabled')).toBe('true');
  });

  it('posts in a form under its name', () => {
    render(
      <form data-testid="form">
        <Rating label="Quality" name="quality" defaultValue={4} />
      </form>,
    );
    const form = screen.getByTestId('form') as HTMLFormElement;
    expect(new FormData(form).get('quality')).toBe('4');
  });

  it('takes its own glyphs and its own option labels', () => {
    render(
      <Rating
        label="Love"
        max={3}
        defaultValue={1}
        icon={<svg data-testid="filled" />}
        emptyIcon={<svg data-testid="empty" />}
        optionLabel={(value, max) => `${value} of ${max} hearts`}
      />,
    );
    expect(star('1 of 3 hearts')).toBeTruthy();
    expect(screen.getAllByTestId('empty')).toHaveLength(3);
  });

  it('is controlled when it is given a value', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Rating label="Quality" value={1} />);
    expect(checked('1 star out of 5')).toBe(true);
    await user.click(star('5 stars out of 5'));
    // No handler, so nothing moves: the value is the app's.
    expect(checked('1 star out of 5')).toBe(true);
    rerender(<Rating label="Quality" value={5} />);
    expect(checked('5 stars out of 5')).toBe(true);
  });

  it('reaches its slots, and takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider
        defaultProps={{ Rating: { max: 3, precision: 0.5 } }}
        classNames={{ Rating: { root: 'x-root', label: 'x-label', item: 'x-item' } }}
      >
        <Rating label="Quality" />
      </GrangeProvider>,
    );
    expect(stars()).toHaveLength(6);
    for (const name of ['x-root', 'x-label', 'x-item']) {
      expect(container.querySelector(`.${name}`), name).toBeTruthy();
    }
  });
});

describe('Signature', () => {
  const surface = () => screen.getByRole('img');
  /** jsdom gives every element a zero box, so the pad is given one to map pointers into. */
  const withBox = (el: Element, width = 320, height = 140) => {
    el.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  };

  const draw = (el: Element, points: Array<[number, number]>) => {
    fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: points[0]![0], clientY: points[0]![1] });
    for (const [x, y] of points.slice(1)) fireEvent.pointerMove(el, { pointerId: 1, clientX: x, clientY: y });
    fireEvent.pointerUp(el, { pointerId: 1 });
  };

  it('keeps the chosen geometry', () => {
    expect(signature).toMatchObject({ width: 320, height: 140, corner: 12, outlineWidth: 1, strokeWidth: 2 });
  });

  it('is an image that says whether it has been signed, not an input', () => {
    render(<Signature label="Sign here" />);
    // There is no keyboard way to draw, so claiming to be a control would promise what it
    // cannot do. The label carries the part a screen reader can use.
    expect(surface().getAttribute('aria-label')).toBe('Sign here: empty');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('draws a stroke and reports a standalone SVG document', () => {
    const onChange = vi.fn();
    const { container } = render(<Signature label="Sign here" onChange={onChange} />);
    const svg = container.querySelector('svg')!;
    withBox(svg);

    draw(svg, [
      [10, 10],
      [40, 30],
      [80, 20],
    ]);

    expect(onChange).toHaveBeenCalledTimes(1);
    const reported = onChange.mock.calls[0]![0] as string;
    expect(reported.startsWith('<svg xmlns=')).toBe(true);
    expect(reported).toContain('viewBox="0 0 320 140"');
    expect(surface().getAttribute('aria-label')).toBe('Sign here: signed');
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('maps the pointer into the pad coordinates, so the value survives a resize', () => {
    const onChange = vi.fn();
    const { container } = render(<Signature label="Sign here" onChange={onChange} />);
    const svg = container.querySelector('svg')!;
    // Rendered at half size: a press at its middle is still the middle of the 320 by 140 box.
    withBox(svg, 160, 70);
    draw(svg, [
      [80, 35],
      [120, 35],
    ]);
    const reported = onChange.mock.calls[0]![0] as string;
    expect(reported).toContain('M 160 70');
  });

  it('undoes the last stroke and clears all of them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Signature label="Sign here" onChange={onChange} />);
    const svg = container.querySelector('svg')!;
    withBox(svg);

    draw(svg, [[10, 10], [40, 30]]);
    draw(svg, [[60, 10], [90, 30]]);
    expect(container.querySelectorAll('path')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(container.querySelectorAll('path')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(container.querySelectorAll('path')).toHaveLength(0);
    // Null rather than an empty document, so "is it signed" is one check.
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(surface().getAttribute('aria-label')).toBe('Sign here: empty');
  });

  it('has nothing to undo or clear before anything is drawn', () => {
    render(<Signature label="Sign here" />);
    expect((screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Clear' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not draw when it is disabled or read only', () => {
    for (const prop of ['disabled', 'readOnly'] as const) {
      const onChange = vi.fn();
      const { container, unmount } = render(<Signature label="Sign here" onChange={onChange} {...{ [prop]: true }} />);
      const svg = container.querySelector('svg')!;
      withBox(svg);
      draw(svg, [[10, 10], [40, 30]]);
      expect(onChange, prop).not.toHaveBeenCalled();
      expect(container.querySelectorAll('path'), prop).toHaveLength(0);
      // No controls either: there is nothing they could do.
      expect(screen.queryByRole('button'), prop).toBeNull();
      unmount();
    }
  });

  it('ignores a secondary button, which is not a pen stroke', () => {
    const onChange = vi.fn();
    const { container } = render(<Signature label="Sign here" onChange={onChange} />);
    const svg = container.querySelector('svg')!;
    withBox(svg);
    fireEvent.pointerDown(svg, { button: 2, pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(svg, { pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('takes its own size, ink and supporting text', () => {
    const { container } = render(
      <Signature
        label="Sign here"
        width={200}
        height={80}
        strokeWidth={4}
        supportingText="Or type your name instead"
      />,
    );
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 80');
    expect(svg.querySelector('g')?.getAttribute('stroke-width')).toBe('4');
    expect(container.textContent).toContain('Or type your name instead');
  });

  it('hides its controls when the form provides its own', () => {
    render(<Signature label="Sign here" hideControls supportingText="Clear it below" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reaches its slots, and takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider
        defaultProps={{ Signature: { width: 240, height: 100 } }}
        classNames={{ Signature: { root: 'x-root', label: 'x-label', surface: 'x-surface', actions: 'x-actions' } }}
      >
        <Signature label="Sign here" supportingText="Hint" />
      </GrangeProvider>,
    );
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 240 100');
    for (const name of ['x-root', 'x-label', 'x-surface', 'x-actions']) {
      expect(container.querySelector(`.${name}`), name).toBeTruthy();
    }
  });

  it('keeps a signature across a controlled parent re-render', () => {
    function Host() {
      const [svg, setSvg] = useState<string | null>(null);
      return (
        <>
          <Signature label="Sign here" onChange={setSvg} />
          <p>{svg ? 'signed' : 'empty'}</p>
        </>
      );
    }
    const { container } = render(<Host />);
    const svg = container.querySelector('svg')!;
    withBox(svg);
    draw(svg, [[10, 10], [40, 30]]);
    expect(screen.getByText('signed')).toBeTruthy();
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });
});
