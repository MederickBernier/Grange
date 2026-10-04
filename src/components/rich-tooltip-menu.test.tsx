import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilledButton,
  GrangeProvider,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  RichTooltip,
  TextButton,
  Tooltip,
  menu as menuSpec,
  richTooltip,
} from '../index';

afterEach(() => {
  vi.useRealTimers();
});

describe('specs', () => {
  it('matches RichTooltipTokens', () => {
    expect(richTooltip).toMatchObject({ corner: 12, elevation: 2 });
  });

  it('leaves long enough to cross the gap to the panel', () => {
    // The panel has buttons in it, so the pointer must be able to travel to them.
    expect(richTooltip.closeDelayMs).toBeGreaterThan(richTooltip.offset * 10);
  });
});

describe('RichTooltip', () => {
  const tooltip = (extra: Partial<React.ComponentProps<typeof RichTooltip>> = {}) => (
    <RichTooltip
      subhead="Rich tooltip"
      actions={<TextButton>Learn more</TextButton>}
      trigger={<FilledButton>Details</FilledButton>}
      {...extra}
    >
      Rich tooltips bring attention to a feature.
    </RichTooltip>
  );

  it('is a dialog named by its subhead, not a tooltip', async () => {
    const user = userEvent.setup();
    render(tooltip({ persistent: true }));
    await user.click(screen.getByRole('button', { name: 'Details' }));

    // A tooltip role would hide the button inside it from assistive tech entirely.
    expect(screen.queryByRole('tooltip')).toBeNull();
    const panel = screen.getByRole('dialog', { name: 'Rich tooltip' });
    expect(panel.textContent).toContain('Rich tooltips bring attention');
    expect(screen.getByRole('button', { name: 'Learn more' })).toBeTruthy();
  });

  it('takes its own label when there is no subhead to name it', async () => {
    const user = userEvent.setup();
    render(tooltip({ persistent: true, subhead: undefined, 'aria-label': 'About sharing' }));
    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByRole('dialog', { name: 'About sharing' })).toBeTruthy();
  });

  it('says the persistent trigger expands something, and the hover one does not', async () => {
    const user = userEvent.setup();
    const { unmount } = render(tooltip({ persistent: true }));
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    // No aria-haspopup: useOverlayTrigger only emits it for menus and listboxes, because screen
    // readers announce the other values as a menu anyway.
    expect(trigger.getAttribute('aria-haspopup')).toBeNull();
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Details' }).getAttribute('aria-expanded')).toBe('true');
    unmount();

    render(tooltip());
    // On hover the panel is a comment on the trigger, not a thing the trigger opens.
    expect(screen.getByRole('button', { name: 'Details' }).getAttribute('aria-expanded')).toBeNull();
  });

  it('waits out the warmup before appearing on hover', async () => {
    const user = userEvent.setup();
    render(tooltip({ delay: 150 }));

    await user.hover(screen.getByRole('button', { name: 'Details' }));
    // Still nothing: a pointer crossing the trigger should not flash a panel.
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  });

  it('stays open long enough for the pointer to reach the panel, then closes', async () => {
    const user = userEvent.setup();
    render(tooltip({ delay: 0 }));

    await user.hover(screen.getByRole('button', { name: 'Details' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());

    await user.unhover(screen.getByRole('button', { name: 'Details' }));
    // Still there: the grace period is what makes the action reachable at all.
    expect(screen.getByRole('dialog')).toBeTruthy();

    // The pointer arrives on the panel within the grace period, so it stops closing.
    await user.hover(screen.getByRole('button', { name: 'Learn more' }));
    await new Promise((resolve) => setTimeout(resolve, richTooltip.closeDelayMs * 2));
    expect(screen.getByRole('dialog')).toBeTruthy();

    await user.unhover(screen.getByRole('button', { name: 'Learn more' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('appears at once when the trigger takes focus, which is how a keyboard reaches it', async () => {
    const user = userEvent.setup();
    render(tooltip({ delay: 5000 }));
    // Not the warmup: a pointer waits, a keyboard does not.
    await user.tab();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());

    // The panel is portalled after the trigger, so Tab walks into it rather than past it, which
    // is what makes the action reachable from the keyboard.
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Learn more' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    await user.tab();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('holds open while focus is inside it', async () => {
    const user = userEvent.setup();
    render(tooltip({ delay: 0 }));

    await user.hover(screen.getByRole('button', { name: 'Details' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    screen.getByRole('button', { name: 'Learn more' }).focus();
    await user.unhover(screen.getByRole('button', { name: 'Details' }));

    await new Promise((resolve) => setTimeout(resolve, richTooltip.closeDelayMs * 3));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(tooltip({ persistent: true, onOpenChange }));
    await user.click(screen.getByRole('button', { name: 'Details' }));
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('leaves the page behind usable, unlike a modal surface', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <FilledButton onClick={onClick}>Elsewhere</FilledButton>
        {tooltip({ persistent: true })}
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    // Nothing is hidden from assistive tech and nothing is covered by a full-screen layer.
    expect(screen.getByRole('button', { name: 'Elsewhere' }).closest('[aria-hidden="true"]')).toBeNull();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
  });

  it('does nothing at all while disabled', async () => {
    const user = userEvent.setup();
    render(tooltip({ delay: 0, disabled: true }));
    await user.hover(screen.getByRole('button', { name: 'Details' }));
    await new Promise((resolve) => setTimeout(resolve, richTooltip.closeDelayMs));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is controlled when it is given an open prop', () => {
    const { rerender } = render(tooltip({ open: false }));
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(tooltip({ open: true }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('reaches every slot, and takes its defaults from the provider', async () => {
    const user = userEvent.setup();
    render(
      <GrangeProvider
        defaultProps={{ RichTooltip: { persistent: true } }}
        classNames={{
          RichTooltip: { root: 'x-root', subhead: 'x-subhead', content: 'x-content', actions: 'x-actions' },
        }}
      >
        {tooltip({ persistent: undefined })}
      </GrangeProvider>,
    );
    // Persistent came from the provider, so a press is what opens it.
    await user.click(screen.getByRole('button', { name: 'Details' }));
    for (const name of ['x-root', 'x-subhead', 'x-content', 'x-actions']) {
      expect(document.querySelector(`.${name}`)).toBeTruthy();
    }
  });

  it('says so rather than failing quietly without a trigger element', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <RichTooltip trigger={'not an element' as never} subhead="Nope">
          Body
        </RichTooltip>,
      ),
    ).toThrow(/single trigger element/);
    quiet.mockRestore();
  });

  it('leaves the plain tooltip a tooltip', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Favourite" delay={0}>
        <IconButton aria-label="Favourite">
          <svg />
        </IconButton>
      </Tooltip>,
    );
    // Focus, not hover: a plain tooltip shows at once on focus, which is the pattern.
    await user.tab();
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeTruthy());
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Menu variants', () => {
  const items = (
    <>
      <MenuItem key="cut">Cut</MenuItem>
      <MenuItem key="copy">Copy</MenuItem>
    </>
  );

  it('is the plain menu unless told otherwise', () => {
    render(
      <Menu aria-label="Edit" variant="default">
        {items}
      </Menu>,
    );
    expect(screen.getByRole('menu').getAttribute('data-variant')).toBe('default');
  });

  it('carries each M3E restyle on the surface, where the stylesheet reads it', () => {
    for (const variant of ['standard', 'vibrant'] as const) {
      const { unmount } = render(
        <Menu aria-label="Edit" variant={variant}>
          {items}
        </Menu>,
      );
      expect(screen.getByRole('menu').getAttribute('data-variant')).toBe(variant);
      unmount();
    }
  });

  it('restyles without changing the geometry, which is what the tokens say', () => {
    // Neither StandardMenuTokens nor VibrantMenuTokens publishes a size or a shape.
    expect(menuSpec).toMatchObject({ corner: 4, elevation: 2, itemHeight: 56 });
  });

  it('keeps the keyboard and the selection in every variant', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <Menu
        aria-label="Edit"
        variant="vibrant"
        onAction={onAction}
        selectionMode="single"
        defaultSelectedKeys={['cut']}
      >
        {items}
      </Menu>,
    );
    const options = screen.getAllByRole('menuitemradio');
    expect(options[0]?.getAttribute('aria-checked')).toBe('true');

    // Tab lands on the first row, so one press moves to the next one.
    await user.tab();
    await user.keyboard('{ArrowDown}{Enter}');
    // useMenuItem passes a second argument the public type does not promise, so only the key is
    // asserted here.
    expect(onAction.mock.calls[0]?.[0]).toBe('copy');
  });

  it('takes the variant from the provider, and the call site still wins', () => {
    const { unmount } = render(
      <GrangeProvider defaultProps={{ Menu: { variant: 'vibrant' } }}>
        <Menu aria-label="Edit">{items}</Menu>
      </GrangeProvider>,
    );
    expect(screen.getByRole('menu').getAttribute('data-variant')).toBe('vibrant');
    unmount();

    render(
      <GrangeProvider defaultProps={{ Menu: { variant: 'vibrant' } }}>
        <Menu aria-label="Edit" variant="standard">
          {items}
        </Menu>
      </GrangeProvider>,
    );
    expect(screen.getByRole('menu').getAttribute('data-variant')).toBe('standard');
  });

  it('works the same inside a trigger, with sections', async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <MenuTrigger open={open} onOpenChange={setOpen}>
          <FilledButton>Edit</FilledButton>
          <Menu aria-label="Edit" variant="standard">
            <MenuSection title="Clipboard">
              <MenuItem key="cut">Cut</MenuItem>
            </MenuSection>
          </Menu>
        </MenuTrigger>
      );
    }
    render(<Host />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('menu').getAttribute('data-variant')).toBe('standard');
    expect(screen.getByRole('group', { name: 'Clipboard' })).toBeTruthy();
  });
});
