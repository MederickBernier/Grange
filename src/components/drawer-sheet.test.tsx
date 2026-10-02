import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BottomSheet,
  DrawerHeadline,
  FilledButton,
  GrangeProvider,
  NavigationDrawer,
  NavigationItem,
  bottomSheet,
  drawer,
} from '../index';

describe('tokens', () => {
  it('matches NavigationDrawerTokens', () => {
    expect(drawer).toMatchObject({
      width: 360,
      corner: 16,
      modalElevation: 1,
      standardElevation: 0,
      indicatorWidth: 336,
      indicatorHeight: 56,
      icon: 24,
    });
  });

  it('matches SheetBottomTokens', () => {
    expect(bottomSheet).toMatchObject({ corner: 28, elevation: 1, handleWidth: 32, handleHeight: 4 });
  });

  it('gives a keyboard drag a step it can actually travel with', () => {
    // An arrow key reports a delta of 1, so without scaling a dismiss would take 120 presses.
    expect(bottomSheet.keyboardStep).toBeGreaterThan(1);
    expect(bottomSheet.dismissDistance / bottomSheet.keyboardStep).toBeLessThanOrEqual(10);
  });
});

describe('NavigationDrawer, standard', () => {
  it('is in the layout with nothing to open, and is a navigation landmark', () => {
    render(
      <NavigationDrawer aria-label="Sections">
        <NavigationItem icon={<svg />} selected>
          Inbox
        </NavigationItem>
      </NavigationDrawer>,
    );
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Inbox' }).getAttribute('aria-current')).toBe('page');
  });

  it('renders headlines between groups', () => {
    render(
      <NavigationDrawer aria-label="Sections">
        <DrawerHeadline>Mail</DrawerHeadline>
        <NavigationItem icon={<svg />}>Inbox</NavigationItem>
      </NavigationDrawer>,
    );
    expect(screen.getByRole('heading', { name: 'Mail' })).toBeTruthy();
  });

  it('reuses the shared navigation item rather than a second component', () => {
    const { container } = render(
      <NavigationDrawer aria-label="Sections">
        <NavigationItem icon={<svg />}>Inbox</NavigationItem>
      </NavigationDrawer>,
    );
    expect(container.querySelector('.grange-navigation-item')).not.toBeNull();
  });
});

function ModalDrawer(props: { dismissable?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FilledButton onClick={() => setOpen(true)}>Open</FilledButton>
      <input aria-label="behind" />
      <NavigationDrawer
        modal
        open={open}
        onOpenChange={setOpen}
        dismissable={props.dismissable}
        aria-label="Sections"
      >
        <NavigationItem icon={<svg />} onClick={() => setOpen(false)}>
          Inbox
        </NavigationItem>
      </NavigationDrawer>
    </>
  );
}

describe('NavigationDrawer, modal', () => {
  const open = () => userEvent.click(screen.getByRole('button', { name: 'Open' }));

  it('renders nothing while closed', () => {
    render(<ModalDrawer />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens as a dialog and portals out of the tree', async () => {
    const { container } = render(<ModalDrawer />);
    await open();
    const panel = screen.getByRole('dialog', { name: 'Sections' });
    expect(container.contains(panel)).toBe(false);
  });

  it('hides the page behind it from assistive tech', async () => {
    render(<ModalDrawer />);
    await open();
    expect(screen.queryByRole('textbox', { name: 'behind' })).toBeNull();
  });

  it('closes on Escape, and gives the page back', async () => {
    render(<ModalDrawer />);
    await open();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('textbox', { name: 'behind' })).toBeTruthy();
  });

  it('refuses Escape when it is not dismissable', async () => {
    render(<ModalDrawer dismissable={false} />);
    await open();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('takes app-wide defaults', () => {
    render(
      <GrangeProvider defaultProps={{ NavigationDrawer: { placement: 'end' } }}>
        <NavigationDrawer aria-label="Sections">
          <NavigationItem icon={<svg />}>Inbox</NavigationItem>
        </NavigationDrawer>
      </GrangeProvider>,
    );
    expect((document.querySelector('.grange-drawer') as HTMLElement).dataset.placement).toBe('end');
  });
});

function Sheet(props: { modal?: boolean; hideHandle?: boolean; dismissable?: boolean }) {
  const [open, setOpen] = useState(props.modal === false);
  return (
    <>
      <FilledButton onClick={() => setOpen(true)}>Open</FilledButton>
      <BottomSheet
        modal={props.modal}
        open={open}
        onOpenChange={setOpen}
        hideHandle={props.hideHandle}
        dismissable={props.dismissable}
        aria-label="Options"
      >
        <p>Sheet content</p>
      </BottomSheet>
    </>
  );
}

describe('BottomSheet', () => {
  const open = () => userEvent.click(screen.getByRole('button', { name: 'Open' }));

  it('is modal by default and renders nothing while closed', () => {
    render(<Sheet />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens as a dialog with a draggable handle', async () => {
    render(<Sheet />);
    await open();
    expect(screen.getByRole('dialog', { name: 'Options' })).toBeTruthy();
    expect(screen.getByText('Sheet content')).toBeTruthy();
    expect(screen.getByRole('separator', { name: /Drag/ })).toBeTruthy();
  });

  it('is in the layout with no dialog when standard', () => {
    render(<Sheet modal={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Sheet content')).toBeTruthy();
  });

  it('hides the handle when asked', async () => {
    render(<Sheet hideHandle />);
    await open();
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('gives the handle a tab stop, so a drag is reachable from the keyboard', async () => {
    render(<Sheet />);
    await open();
    expect(screen.getByRole('separator', { name: /Drag/ }).getAttribute('tabindex')).toBe('0');
  });

  it('takes the handle out of the tab order when it cannot dismiss', async () => {
    render(<Sheet dismissable={false} />);
    await open();
    expect(screen.getByRole('separator').getAttribute('tabindex')).toBeNull();
  });

  it('closes on Escape when dismissable', async () => {
    render(<Sheet />);
    await open();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('dismisses on a long keyboard drag and stays for a short one', async () => {
    render(<Sheet />);
    await open();
    const handle = screen.getByRole('separator', { name: /Drag/ });
    handle.focus();

    // useMove answers the arrow keys, so a keyboard drag is a real drag. One press moves one
    // keyboardStep, which is well short of the dismiss distance.
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.queryByRole('dialog')).not.toBeNull();

    // Seven presses at 20px clears the 120px threshold, so it closes.
    const presses = Math.ceil(bottomSheet.dismissDistance / bottomSheet.keyboardStep);
    for (let i = 0; i < presses; i += 1) await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('reaches the handle and scrim slots', async () => {
    render(
      <GrangeProvider classNames={{ BottomSheet: { handle: 'my-handle', scrim: 'my-scrim' } }}>
        <Sheet />
      </GrangeProvider>,
    );
    await open();
    expect(screen.getByRole('separator').className).toContain('my-handle');
    expect(document.querySelector('.grange-bottom-sheet-scrim')?.className).toContain('my-scrim');
  });
});
