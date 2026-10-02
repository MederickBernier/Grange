import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ExtendedFab,
  FabMenu,
  FabMenuItem,
  GrangeProvider,
  collapsedPadding,
  extendedFabSizes,
  fabMenu,
  fabSizes,
} from '../index';

describe('ExtendedFab tokens', () => {
  // From ExtendedFabSmall / Medium / Large.
  it.each([
    ['small', 56, 16, 24, 8, 16],
    ['medium', 80, 20, 28, 16, 26],
    ['large', 96, 28, 32, 20, 28],
  ] as const)('%s: %spx tall, %spx corner, %spx icon', (size, height, corner, icon, gap, padding) => {
    expect(extendedFabSizes[size]).toEqual({ height, corner, icon, gap, padding });

    render(
      <ExtendedFab size={size} icon={<svg />}>
        Compose
      </ExtendedFab>,
    );
    const el = screen.getByRole('button');
    expect(el.style.getPropertyValue('--_height')).toBe(`${height}px`);
    expect(el.style.getPropertyValue('--_gap')).toBe(`${gap}px`);
    expect(el.style.getPropertyValue('--grange-icon-size')).toBe(`${icon}px`);
    expect(el.style.borderTopLeftRadius).toBe(`${corner}px`);
    expect(el.style.paddingLeft).toBe(`${padding}px`);
  });

  // The two token sets agree at 56, 80 and 96, which is what makes collapsing coherent.
  it.each([
    ['small', 'baseline'],
    ['medium', 'medium'],
    ['large', 'large'],
  ] as const)('an extended %s collapses to exactly the plain %s', (extended, plain) => {
    expect(extendedFabSizes[extended].height).toBe(fabSizes[plain].size);
    expect(extendedFabSizes[extended].corner).toBe(fabSizes[plain].corner);
  });

  it('hides the label and squares off when collapsed', () => {
    // Large, because its expanded and collapsed paddings differ: 28 against (96 - 32) / 2 = 32.
    // Mounted fresh rather than rerendered, since the padding change rides a spring and would
    // still be mid-flight when asserted.
    const { unmount } = render(
      <ExtendedFab size="large" icon={<svg />} aria-label="Compose">
        Compose
      </ExtendedFab>,
    );
    expect(screen.getByRole('button').textContent).toBe('Compose');
    expect(screen.getByRole('button').style.paddingLeft).toBe('28px');
    unmount();

    render(
      <ExtendedFab size="large" icon={<svg />} collapsed aria-label="Compose">
        Compose
      </ExtendedFab>,
    );
    expect(screen.getByRole('button').textContent).toBe('');
    expect(screen.getByRole('button').style.paddingLeft).toBe('32px');
    expect(collapsedPadding(extendedFabSizes.large)).toBe(32);
  });

  it('collapses to a square box at every size', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const spec = extendedFabSizes[size];
      // icon + both paddings must come back to the height, which is what makes it a circle.
      expect(spec.icon + collapsedPadding(spec) * 2).toBe(spec.height);
    }
  });

  it('marks the lowered elevation variant', () => {
    render(
      <ExtendedFab lowered icon={<svg />}>
        Compose
      </ExtendedFab>,
    );
    expect(screen.getByRole('button').dataset.lowered).toBe('true');
  });

  it('takes app-wide defaults', () => {
    render(
      <GrangeProvider defaultProps={{ ExtendedFab: { size: 'large', variant: 'secondary', lowered: true } }}>
        <ExtendedFab icon={<svg />}>Compose</ExtendedFab>
      </GrangeProvider>,
    );
    expect(screen.getByRole('button').dataset).toMatchObject({
      size: 'large',
      variant: 'secondary',
      lowered: 'true',
    });
  });
});

describe('FabMenu tokens', () => {
  it('matches FabMenuBaseline', () => {
    expect(fabMenu).toMatchObject({
      closeSize: 56,
      closeIcon: 20,
      closeGap: 8,
      itemHeight: 56,
      itemIcon: 24,
      itemGap: 8,
      itemPadding: 24,
      itemBetween: 4,
    });
  });
});

function Menu({ onPick = () => {} }: { onPick?: (which: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button">outside</button>
      <FabMenu
        open={open}
        onOpenChange={setOpen}
        icon={<svg />}
        closeIcon={<svg />}
        aria-label="Create"
        closeAriaLabel="Close create menu"
      >
        <FabMenuItem icon={<svg />} onPress={() => onPick('doc')}>
          Document
        </FabMenuItem>
        <FabMenuItem icon={<svg />} onPress={() => onPick('sheet')}>
          Spreadsheet
        </FabMenuItem>
        <FabMenuItem icon={<svg />} onPress={() => onPick('slide')}>
          Presentation
        </FabMenuItem>
      </FabMenu>
    </>
  );
}

const toggle = () => screen.getByRole('button', { name: /Create|Close create menu/ });

describe('FabMenu behaviour', () => {
  it('announces itself as a closed menu trigger', () => {
    render(<Menu />);
    expect(toggle().getAttribute('aria-haspopup')).toBe('menu');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens, names the toggle for closing, and points at the list', async () => {
    render(<Menu />);
    await userEvent.click(toggle());
    expect(screen.getByRole('menu', { name: 'Create' })).toBeTruthy();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().getAttribute('aria-label')).toBe('Close create menu');
    expect(toggle().getAttribute('aria-controls')).toBe(screen.getByRole('menu').id);
  });

  it('exposes the actions as menu items', async () => {
    render(<Menu />);
    await userEvent.click(toggle());
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual([
      'Document',
      'Spreadsheet',
      'Presentation',
    ]);
  });

  it('moves focus into the list on open', async () => {
    render(<Menu />);
    await userEvent.click(toggle());
    await waitFor(() => {
      expect(screen.getByRole('menu').contains(document.activeElement)).toBe(true);
    });
  });

  it('answers the arrow keys, and wraps at both ends', async () => {
    render(<Menu />);
    await userEvent.click(toggle());
    const items = screen.getAllByRole('menuitem');
    items[0]!.focus();

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.activeElement).toBe(items[0]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(items[2]);
  });

  it('jumps to the ends with Home and End', async () => {
    render(<Menu />);
    await userEvent.click(toggle());
    const items = screen.getAllByRole('menuitem');
    items[1]!.focus();

    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(items[2]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(items[0]);
  });

  it('closes on Escape', async () => {
    render(<Menu />);
    await userEvent.click(toggle());
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on a click outside', async () => {
    render(<Menu />);
    await userEvent.click(toggle());
    await userEvent.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('runs the action and closes when an item is chosen', async () => {
    const onPick = vi.fn();
    render(<Menu onPick={onPick} />);
    await userEvent.click(toggle());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Spreadsheet' }));
    expect(onPick).toHaveBeenCalledWith('sheet');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('stays open for an item that asks to', async () => {
    function KeepOpen() {
      const [open, setOpen] = useState(true);
      return (
        <FabMenu open={open} onOpenChange={setOpen} icon={<svg />} closeIcon={<svg />} aria-label="Create">
          <FabMenuItem keepOpen>Pinned</FabMenuItem>
        </FabMenu>
      );
    }
    render(<KeepOpen />);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Pinned' }));
    expect(screen.queryByRole('menu')).not.toBeNull();
  });

  it('refuses to render an item outside a FabMenu', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<FabMenuItem>Orphan</FabMenuItem>)).toThrow(/must be inside a FabMenu/);
    quiet.mockRestore();
  });
});
