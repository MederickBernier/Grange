import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Carousel,
  CarouselItem,
  FilledButton,
  GrangeProvider,
  SideSheet,
  carousel,
  drawer,
  sideSheet,
} from '../index';

/**
 * jsdom has no layout and implements none of the element scroll methods, so the carousel's
 * scrolling is asserted through stubs. That is the honest limit of these tests: they check that
 * the right axis and the right distance are asked for, not that the pixels land.
 */
let scrollBy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollBy = vi.fn();
  Object.defineProperty(Element.prototype, 'scrollBy', { value: scrollBy, writable: true, configurable: true });
  Object.defineProperty(Element.prototype, 'scrollTo', { value: vi.fn(), writable: true, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('specs', () => {
  it('keeps the side sheet inside the range the spec gives, and agrees with the drawer', () => {
    expect(sideSheet.width).toBeGreaterThanOrEqual(sideSheet.minWidth);
    expect(sideSheet.width).toBeLessThanOrEqual(sideSheet.maxWidth);
    expect(sideSheet.minWidth).toBe(256);
    expect(sideSheet.maxWidth).toBe(400);
    // Same panel, same edge, same tokenised neighbour: NavigationDrawerTokens.
    expect(sideSheet.width).toBe(drawer.width);
    expect(sideSheet.corner).toBe(drawer.corner);
    expect(sideSheet.modalElevation).toBe(drawer.modalElevation);
    expect(sideSheet.standardElevation).toBe(drawer.standardElevation);
  });

  it('gives a keyboard resize a step it can cross the range with', () => {
    // An arrow key reports a delta of 1, so without scaling a resize would take 144 presses.
    expect(sideSheet.keyboardStep).toBeGreaterThan(1);
    expect((sideSheet.maxWidth - sideSheet.minWidth) / sideSheet.keyboardStep).toBeLessThanOrEqual(10);
  });

  it('keeps the carousel sizes within what the spec allows', () => {
    expect(carousel.corner).toBe(28); // CornerExtraLarge
    expect(carousel.gap).toBe(8);
    expect(carousel.smallWidth).toBeGreaterThanOrEqual(carousel.smallMinWidth);
    expect(carousel.smallWidth).toBeLessThanOrEqual(56);
    for (const ratio of [carousel.largeRatio, carousel.heroRatio]) {
      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThan(1);
    }
  });
});

describe('SideSheet, standard', () => {
  it('is in the layout as a complementary landmark with nothing to open', () => {
    render(
      <SideSheet aria-label="Details">
        <p>Body</p>
      </SideSheet>,
    );
    expect(screen.getByRole('complementary', { name: 'Details' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is named by its headline when it has no label of its own', () => {
    render(<SideSheet headline="Filters">Body</SideSheet>);
    const panel = screen.getByRole('complementary', { name: 'Filters' });
    expect(panel.querySelector('.grange-side-sheet-headline')?.textContent).toBe('Filters');
  });

  it('puts the edge on the panel, so the stylesheet can round and place it', () => {
    const { container } = render(<SideSheet placement="start">Body</SideSheet>);
    expect(container.querySelector('.grange-side-sheet')?.getAttribute('data-placement')).toBe('start');
  });

  it('renders bottom actions only when given them', () => {
    const { container, unmount } = render(<SideSheet>Body</SideSheet>);
    expect(container.querySelector('.grange-side-sheet-actions')).toBeNull();
    unmount();
    const second = render(<SideSheet actions={<FilledButton>Apply</FilledButton>}>Body</SideSheet>);
    expect(second.container.querySelector('.grange-side-sheet-actions')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy();
  });
});

describe('SideSheet, modal', () => {
  it('renders nothing until it is open, then a dialog over a scrim', () => {
    const { container, rerender } = render(
      <SideSheet modal aria-label="Details">
        Body
      </SideSheet>,
    );
    expect(container.querySelector('.grange-side-sheet')).toBeNull();

    rerender(
      <SideSheet modal open aria-label="Details">
        Body
      </SideSheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeTruthy();
    expect(document.querySelector('.grange-side-sheet-scrim')).toBeTruthy();
  });

  it('closes on Escape and on the close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <SideSheet modal open headline="Filters" showClose onOpenChange={onOpenChange}>
        Body
      </SideSheet>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    unmount();
  });

  it('keeps the edge on the panel in modal mode too', () => {
    render(
      <SideSheet modal open placement="start" aria-label="Details">
        Body
      </SideSheet>,
    );
    expect(screen.getByRole('dialog').getAttribute('data-placement')).toBe('start');
  });
});

describe('SideSheet resizing', () => {
  it('has no handle unless it is resizable', () => {
    render(<SideSheet>Body</SideSheet>);
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('describes itself as a splitter with its current and allowed widths', () => {
    render(<SideSheet resizable>Body</SideSheet>);
    const handle = screen.getByRole('separator', { name: 'Resize' });
    expect(handle.getAttribute('aria-valuenow')).toBe(String(sideSheet.width));
    expect(handle.getAttribute('aria-valuemin')).toBe(String(sideSheet.minWidth));
    expect(handle.getAttribute('aria-valuemax')).toBe(String(sideSheet.maxWidth));
    expect(handle.tabIndex).toBe(0);
  });

  it('widens from the keyboard, towards the leading edge for a trailing sheet', async () => {
    const user = userEvent.setup();
    const onWidthChange = vi.fn();
    render(
      <SideSheet resizable placement="end" onWidthChange={onWidthChange}>
        Body
      </SideSheet>,
    );
    const handle = screen.getByRole('separator');
    handle.focus();
    // A sheet on the trailing edge grows when its inner edge is dragged left.
    await user.keyboard('{ArrowLeft}');
    expect(onWidthChange).toHaveBeenCalledWith(sideSheet.width + sideSheet.keyboardStep);

    onWidthChange.mockClear();
    await user.keyboard('{ArrowRight}');
    expect(onWidthChange).toHaveBeenLastCalledWith(sideSheet.width);
  });

  it('narrows a leading sheet with the same press, since its inner edge is the other one', async () => {
    const user = userEvent.setup();
    const onWidthChange = vi.fn();
    render(
      <SideSheet resizable placement="start" onWidthChange={onWidthChange}>
        Body
      </SideSheet>,
    );
    screen.getByRole('separator').focus();
    await user.keyboard('{ArrowLeft}');
    expect(onWidthChange).toHaveBeenCalledWith(sideSheet.width - sideSheet.keyboardStep);
  });

  it('clamps to the range however far it is dragged', async () => {
    const user = userEvent.setup();
    const widths: number[] = [];
    render(
      <SideSheet resizable placement="end" onWidthChange={(w) => widths.push(w)}>
        Body
      </SideSheet>,
    );
    screen.getByRole('separator').focus();
    for (let i = 0; i < 20; i++) await user.keyboard('{ArrowLeft}');
    expect(Math.max(...widths)).toBe(sideSheet.maxWidth);

    widths.length = 0;
    for (let i = 0; i < 40; i++) await user.keyboard('{ArrowRight}');
    expect(Math.min(...widths)).toBe(sideSheet.minWidth);
  });

  it('applies the width to the panel and follows a controlled one', () => {
    const { container, rerender } = render(
      <SideSheet resizable width={300}>
        Body
      </SideSheet>,
    );
    const panel = container.querySelector<HTMLElement>('.grange-side-sheet');
    expect(panel?.style.width).toBe('300px');
    rerender(
      <SideSheet resizable width={380}>
        Body
      </SideSheet>,
    );
    expect(panel?.style.width).toBe('380px');
    expect(screen.getByRole('separator').getAttribute('aria-valuenow')).toBe('380');
  });
});

describe('Carousel', () => {
  const strip = (
    <>
      <CarouselItem>One</CarouselItem>
      <CarouselItem>Two</CarouselItem>
      <CarouselItem>Three</CarouselItem>
    </>
  );

  it('is a named, focusable scroll region that announces itself as a carousel', () => {
    render(
      <Carousel aria-label="Photos">
        {strip}
      </Carousel>,
    );
    const region = screen.getByRole('group', { name: 'Photos' });
    expect(region.getAttribute('aria-roledescription')).toBe('carousel');
    // A scrollable region needs a tab stop, or the keyboard cannot reach what is in it.
    expect(region.tabIndex).toBe(0);
  });

  it('puts the layout on the strip and keeps the gap and corner on the element', () => {
    render(
      <Carousel aria-label="Photos" variant="hero">
        {strip}
      </Carousel>,
    );
    const region = screen.getByRole('group', { name: 'Photos' });
    expect(region.getAttribute('data-variant')).toBe('hero');
    expect(region.style.getPropertyValue('--grange-carousel-gap')).toBe(`${carousel.gap}px`);
    expect(region.style.getPropertyValue('--grange-carousel-corner')).toBe(`${carousel.corner}px`);
  });

  it('carries a stable hook class on every item, and the size when one is asked for', () => {
    const { container } = render(
      <Carousel aria-label="Photos">
        <CarouselItem size="large">One</CarouselItem>
        <CarouselItem>Two</CarouselItem>
      </Carousel>,
    );
    const items = container.querySelectorAll('.grange-carousel-item');
    expect(items).toHaveLength(2);
    expect(items[0]?.getAttribute('data-size')).toBe('large');
    expect(items[1]?.getAttribute('data-size')).toBeNull();
  });

  it('moves a whole item on the arrows, horizontally', async () => {
    const user = userEvent.setup();
    render(<Carousel aria-label="Photos">{strip}</Carousel>);
    screen.getByRole('group', { name: 'Photos' }).focus();

    await user.keyboard('{ArrowRight}');
    // jsdom reports every offsetWidth as 0, so the step is the gap alone here.
    expect(scrollBy).toHaveBeenLastCalledWith({ left: carousel.gap });

    await user.keyboard('{ArrowLeft}');
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -carousel.gap });
  });

  it('goes to the ends on Home and End', async () => {
    const user = userEvent.setup();
    const { container } = render(<Carousel aria-label="Photos">{strip}</Carousel>);
    const region = container.querySelector<HTMLElement>('.grange-carousel');
    Object.defineProperty(region, 'scrollWidth', { value: 900, configurable: true });
    region?.focus();

    await user.keyboard('{End}');
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 900 });
    await user.keyboard('{Home}');
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -900 });
  });

  it('turns vertical for the full-screen layout, arrows and all', async () => {
    const user = userEvent.setup();
    render(
      <Carousel aria-label="Photos" variant="full-screen">
        {strip}
      </Carousel>,
    );
    screen.getByRole('group', { name: 'Photos' }).focus();

    await user.keyboard('{ArrowDown}');
    expect(scrollBy).toHaveBeenLastCalledWith({ top: carousel.gap });
    // The horizontal arrows are not its axis, so they are left to the browser.
    scrollBy.mockClear();
    await user.keyboard('{ArrowRight}');
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('swallows the click at the end of a mouse drag, so dragging over a button is not a press', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Carousel aria-label="Photos">
        <CarouselItem>
          <button type="button" onClick={onClick}>
            Open
          </button>
        </CarouselItem>
      </Carousel>,
    );
    const region = container.querySelector('.grange-carousel') as HTMLElement;
    const target = screen.getByRole('button', { name: 'Open' });

    fireEvent.pointerDown(region, { pointerType: 'mouse', button: 0, clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(region, { pointerType: 'mouse', clientX: 120, pointerId: 1 });
    expect(region.getAttribute('data-dragging')).toBe('true');
    fireEvent.pointerUp(region, { pointerType: 'mouse', clientX: 120, pointerId: 1 });
    expect(region.getAttribute('data-dragging')).toBeNull();

    fireEvent.click(target);
    expect(onClick).not.toHaveBeenCalled();

    // The next click is a click again: the drag distance does not linger.
    fireEvent.click(target);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('leaves touch alone, because the browser already drags a scroll container', () => {
    const { container } = render(<Carousel aria-label="Photos">{strip}</Carousel>);
    const region = container.querySelector('.grange-carousel') as HTMLElement;
    fireEvent.pointerDown(region, { pointerType: 'touch', button: 0, clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(region, { pointerType: 'touch', clientX: 120, pointerId: 1 });
    expect(region.getAttribute('data-dragging')).toBeNull();
  });

  it('reports the settled item once the scrolling stops', async () => {
    vi.useFakeTimers();
    const onIndexChange = vi.fn();
    const { container } = render(
      <Carousel aria-label="Photos" onIndexChange={onIndexChange}>
        {strip}
      </Carousel>,
    );
    const region = container.querySelector<HTMLElement>('.grange-carousel');
    Object.defineProperty(region, 'scrollLeft', { value: carousel.gap * 2, configurable: true });

    fireEvent.scroll(region as HTMLElement);
    expect(onIndexChange).not.toHaveBeenCalled(); // still moving
    vi.advanceTimersByTime(150);
    expect(onIndexChange).toHaveBeenCalledWith(2);

    // The same position again is not a new item, so it is not reported twice.
    onIndexChange.mockClear();
    fireEvent.scroll(region as HTMLElement);
    vi.advanceTimersByTime(150);
    expect(onIndexChange).not.toHaveBeenCalled();
  });
});

describe('overrides', () => {
  it('reaches every side sheet slot', () => {
    const { container } = render(
      <GrangeProvider
        classNames={{
          SideSheet: { root: 'x-root', header: 'x-header', headline: 'x-headline', content: 'x-content', handle: 'x-handle' },
        }}
      >
        <SideSheet headline="Filters" resizable>
          Body
        </SideSheet>
      </GrangeProvider>,
    );
    for (const name of ['x-root', 'x-header', 'x-headline', 'x-content', 'x-handle']) {
      expect(container.querySelector(`.${name}`)).toBeTruthy();
    }
  });

  it('takes its defaults from the provider, and the call site still wins', () => {
    render(
      <GrangeProvider defaultProps={{ SideSheet: { placement: 'start' }, Carousel: { variant: 'hero' } }}>
        <SideSheet aria-label="Details">Body</SideSheet>
        <Carousel aria-label="Photos" variant="uncontained">
          <CarouselItem>One</CarouselItem>
        </Carousel>
      </GrangeProvider>,
    );
    expect(screen.getByRole('complementary').getAttribute('data-placement')).toBe('start');
    expect(screen.getByRole('group', { name: 'Photos' }).getAttribute('data-variant')).toBe('uncontained');
  });

  it('replaces the carousel item classes when asked, keeping the hook', () => {
    const { container } = render(
      <GrangeProvider classNames={{ CarouselItem: { item: { replace: 'x-item' } } }}>
        <Carousel aria-label="Photos">
          <CarouselItem>One</CarouselItem>
        </Carousel>
      </GrangeProvider>,
    );
    const item = container.querySelector('.grange-carousel-item');
    expect(item?.className).toBe('grange-carousel-item x-item');
  });
});

describe('modal plumbing', () => {
  it('locks the page behind a modal sheet and gives it back on close', async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <FilledButton onClick={() => setOpen(true)}>Open</FilledButton>
          <SideSheet modal open={open} onOpenChange={setOpen} headline="Filters">
            Body
          </SideSheet>
        </>
      );
    }
    render(<Host />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(document.documentElement.style.overflow).toBe('hidden'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.documentElement.style.overflow).not.toBe('hidden'));
  });
});
