import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GrangeProvider,
  Splitter,
  SplitterPane,
  Window,
  list,
  moveBoundary,
  splitter,
  windowSpec,
} from '../index';

/*
 * The clamping is tested here rather than through a rendered splitter, and that is forced
 * rather than chosen: jsdom reports every element as 0 by 0, so a component test can never
 * exercise a real container width. The same reasoning put the signature geometry and the clock
 * dial in their own modules.
 */
describe('moveBoundary', () => {
  const free = () => ({ min: 0, max: Infinity });

  it('takes from one neighbour and gives to the other', () => {
    expect(moveBoundary([50, 50], 0, 10, free)).toEqual([60, 40]);
  });

  it('leaves every other pane alone', () => {
    // Moving one line must not redistribute the whole row.
    expect(moveBoundary([30, 30, 40], 0, 10, free)).toEqual([40, 20, 40]);
  });

  it("stops at the growing pane's own maximum", () => {
    const limits = (i: number) => (i === 0 ? { min: 0, max: 55 } : free());
    expect(moveBoundary([50, 50], 0, 20, limits)).toEqual([55, 45]);
  });

  it("stops at the shrinking neighbour's minimum, not the dragged pane's", () => {
    const limits = (i: number) => (i === 1 ? { min: 40, max: Infinity } : free());
    expect(moveBoundary([50, 50], 0, 30, limits)).toEqual([60, 40]);
  });

  it('clamps a move in the other direction the same way', () => {
    const limits = (i: number) => (i === 0 ? { min: 35, max: Infinity } : free());
    expect(moveBoundary([50, 50], 0, -30, limits)).toEqual([35, 65]);
  });

  it('refuses to move at all when both neighbours are pinned', () => {
    const limits = () => ({ min: 50, max: 50 });
    expect(moveBoundary([50, 50], 0, 20, limits)).toEqual([50, 50]);
  });

  it('ignores a boundary that is not there', () => {
    expect(moveBoundary([100], 0, 10, free)).toEqual([100]);
    expect(moveBoundary([50, 50], 5, 10, free)).toEqual([50, 50]);
  });

  it('ignores a delta that is not a number, rather than producing NaN panes', () => {
    expect(moveBoundary([50, 50], 0, NaN, free)).toEqual([50, 50]);
    expect(moveBoundary([50, 50], 0, Infinity, free)).toEqual([50, 50]);
  });

  it('never changes the total, so the panes keep filling the container', () => {
    const limits = (i: number) => (i === 0 ? { min: 20, max: 70 } : { min: 10, max: 90 });
    for (const delta of [-100, -13, 0, 7, 100]) {
      const out = moveBoundary([40, 60], 0, delta, limits);
      expect(Math.round(out[0]! + out[1]!)).toBe(100);
    }
  });
});

describe('tokens', () => {
  it("gives the splitter the divider's line inside a real pointer target", () => {
    expect(splitter.line).toBe(1);
    // A one-pixel line cannot be hit; the band around it is the list's own gutter.
    expect(splitter.hitArea).toBe(list.leadingSpace);
  });

  it('borrows the window chrome from the dialog and the list row', () => {
    expect(windowSpec.corner).toBe(28); // DialogTokens: ContainerShape, CornerExtraLarge
    expect(windowSpec.elevation).toBe(3); // DialogTokens: ContainerElevation, Level3
    expect(windowSpec.barHeight).toBe(list.oneLine);
    expect(windowSpec.gutter).toBe(list.leadingSpace);
  });
});

describe('Splitter', () => {
  const panes = (
    <>
      <SplitterPane>Left</SplitterPane>
      <SplitterPane>Right</SplitterPane>
    </>
  );
  const bar = () => screen.getByRole('separator');
  const basis = (c: HTMLElement) =>
    [...c.querySelectorAll('.grange-splitter-pane')].map((el) => (el as HTMLElement).style.flexBasis);

  it('splits evenly when it is not told otherwise', () => {
    const { container } = render(<Splitter>{panes}</Splitter>);
    expect(basis(container)).toEqual(['50%', '50%']);
  });

  it('puts one focusable separator between each pair of panes', () => {
    render(
      <Splitter>
        <SplitterPane>One</SplitterPane>
        <SplitterPane>Two</SplitterPane>
        <SplitterPane>Three</SplitterPane>
      </Splitter>,
    );
    const bars = screen.getAllByRole('separator');
    expect(bars).toHaveLength(2);
    expect(bars[0]!.getAttribute('tabindex')).toBe('0');
  });

  it('reports its position as a percentage, which is what the value means', () => {
    render(<Splitter defaultSizes={[30, 70]}>{panes}</Splitter>);
    expect(bar().getAttribute('aria-valuenow')).toBe('30');
    expect(bar().getAttribute('aria-valuetext')).toBe('30%');
    expect(bar().getAttribute('aria-valuemin')).toBe('0');
    expect(bar().getAttribute('aria-valuemax')).toBe('100');
  });

  it('is a vertical separator when the panes are side by side', () => {
    const { rerender } = render(<Splitter>{panes}</Splitter>);
    // The separator's own orientation is the opposite of the splitter's.
    expect(bar().getAttribute('aria-orientation')).toBe('vertical');

    rerender(<Splitter orientation="vertical">{panes}</Splitter>);
    expect(bar().getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('keeps the sizes in percentages, so a resized container still fills', () => {
    const { container } = render(<Splitter defaultSizes={[25, 75]}>{panes}</Splitter>);
    expect(basis(container)).toEqual(['25%', '75%']);
  });

  it('takes a controlled size set', () => {
    const { container, rerender } = render(<Splitter sizes={[20, 80]}>{panes}</Splitter>);
    expect(basis(container)).toEqual(['20%', '80%']);
    rerender(<Splitter sizes={[60, 40]}>{panes}</Splitter>);
    expect(basis(container)).toEqual(['60%', '40%']);
  });

  it('does nothing when the container has no size, rather than dividing by zero', async () => {
    // jsdom reports every box as 0x0, which is exactly the case that would produce NaN widths.
    const user = userEvent.setup();
    const onSizesChange = vi.fn();
    render(
      <Splitter defaultSizes={[50, 50]} onSizesChange={onSizesChange}>
        {panes}
      </Splitter>,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onSizesChange).not.toHaveBeenCalled();
    expect(bar().getAttribute('aria-valuenow')).toBe('50');
  });

  it('counts panes written as a fragment', () => {
    const { container } = render(
      <Splitter>
        <>
          <SplitterPane>One</SplitterPane>
          <SplitterPane>Two</SplitterPane>
          <SplitterPane>Three</SplitterPane>
        </>
      </Splitter>,
    );
    expect(basis(container)).toHaveLength(3);
  });

  it('takes its orientation from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Splitter: { orientation: 'vertical' } }}>
        <Splitter>{panes}</Splitter>
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-splitter') as HTMLElement).dataset.orientation).toBe('vertical');
  });
});

describe('Window', () => {
  const open = (extra: Partial<React.ComponentProps<typeof Window>> = {}) =>
    render(
      <Window open title="Notes" {...extra}>
        Body
      </Window>,
    );

  it('is a dialog named by its title, and is not modal', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Notes' });
    expect(dialog).not.toBeNull();
    // Non-modal: the page behind stays usable, so there is no aria-modal and no scrim.
    expect(dialog.getAttribute('aria-modal')).toBeNull();
  });

  it('renders nothing while it is closed', () => {
    render(
      <Window open={false} title="Notes">
        Body
      </Window>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('starts where it was told to', () => {
    open({ defaultPosition: { x: 30, y: 40 }, defaultSize: { width: 300, height: 200 } });
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.insetInlineStart).toBe('30px');
    expect(dialog.style.top).toBe('40px');
    expect(dialog.style.width).toBe('300px');
  });

  it('can be moved with the arrow keys, because a pointer is not the only way in', async () => {
    const user = userEvent.setup();
    const onPositionChange = vi.fn();
    open({ defaultPosition: { x: 100, y: 100 }, onPositionChange });

    await user.tab();
    const handle = screen.getByLabelText('Move window with the arrow keys');
    expect(document.activeElement).toBe(handle);

    await user.keyboard('{ArrowRight}');
    // One arrow key is one step, not one pixel.
    expect(onPositionChange).toHaveBeenCalledWith({ x: 100 + windowSpec.keyboardStep, y: 100 });
  });

  it('never lets itself be moved off the top, where its own controls would go with it', async () => {
    const user = userEvent.setup();
    const onPositionChange = vi.fn();
    open({ defaultPosition: { x: 0, y: 0 }, onPositionChange });

    await user.tab();
    await user.keyboard('{ArrowUp}{ArrowLeft}');
    for (const [{ x, y }] of onPositionChange.mock.calls) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });

  it('resizes from the keyboard too, and says how big it is', async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    open({ defaultSize: { width: 400, height: 300 }, onSizeChange });

    const grip = screen.getByLabelText('Resize window, 400 by 300');
    grip.focus();
    await user.keyboard('{ArrowDown}');
    expect(onSizeChange).toHaveBeenCalledWith({ width: 400, height: 300 + windowSpec.keyboardStep });
  });

  it('refuses to shrink below its minimum', async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    open({ defaultSize: { width: windowSpec.minWidth, height: windowSpec.minHeight }, onSizeChange });

    screen.getByLabelText(/^Resize window/).focus();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    for (const [{ width, height }] of onSizeChange.mock.calls) {
      expect(width).toBeGreaterThanOrEqual(windowSpec.minWidth);
      expect(height).toBeGreaterThanOrEqual(windowSpec.minHeight);
    }
  });

  it('collapses to its title bar and comes back', async () => {
    const user = userEvent.setup();
    open();
    expect(screen.getByText('Body')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Minimise' }));
    expect(screen.queryByText('Body')).toBeNull();
    // The grip goes with the body: there is nothing left to resize.
    expect(screen.queryByLabelText(/^Resize window/)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Restore' }));
    expect(screen.getByText('Body')).not.toBeNull();
  });

  it('maximises without losing where it was', async () => {
    const user = userEvent.setup();
    open({ defaultPosition: { x: 30, y: 40 } });

    await user.click(screen.getByRole('button', { name: 'Maximise' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.width).toBe('100vw');
    // Nothing to drag while it fills the screen.
    expect(screen.queryByLabelText('Move window with the arrow keys')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Restore down' }));
    // The stored rect was never overwritten, so it goes back exactly where it was.
    expect(screen.getByRole('dialog').style.insetInlineStart).toBe('30px');
  });

  it('closes through its own button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    open({ onOpenChange });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('drops the controls it is told not to offer', () => {
    open({ minimizable: false, maximizable: false, closable: false, resizable: false });
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByLabelText(/^Resize window/)).toBeNull();
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [at, setAt] = useState({ x: 10, y: 10 });
      return (
        <Window open title="Notes" position={at} onPositionChange={setAt}>
          Body
        </Window>
      );
    }
    render(<Controlled />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('dialog').style.insetInlineStart).toBe(`${10 + windowSpec.keyboardStep}px`);
  });
});
