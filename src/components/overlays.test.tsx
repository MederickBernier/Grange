import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  FilledButton,
  GrangeProvider,
  IconButton,
  TextButton,
  Tooltip,
  dialog,
  tooltip,
} from '../index';

describe('tokens', () => {
  it('matches DialogTokens and ScrimTokens', () => {
    expect(dialog).toMatchObject({ corner: 28, elevation: 3, icon: 24, scrimOpacity: 0.32 });
  });

  it('matches PlainTooltipTokens', () => {
    expect(tooltip).toMatchObject({ corner: 4 });
  });
});

function Host(props: { dismissable?: boolean; icon?: boolean; onOpenChange?: (o: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FilledButton onClick={() => setOpen(true)}>Open</FilledButton>
      <input aria-label="behind" />
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
        dismissable={props.dismissable}
        icon={props.icon ? <svg data-testid="dialog-icon" /> : undefined}
        headline="Delete this?"
        actions={
          <>
            <TextButton onClick={() => setOpen(false)}>Cancel</TextButton>
            <TextButton onClick={() => setOpen(false)}>Delete</TextButton>
          </>
        }
      >
        This cannot be undone.
      </Dialog>
    </>
  );
}

const openIt = async () => userEvent.click(screen.getByRole('button', { name: 'Open' }));

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    render(<Host />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens as a dialog named by its headline', async () => {
    render(<Host />);
    await openIt();
    expect(screen.getByRole('dialog', { name: 'Delete this?' })).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  });

  it('portals out of the trigger, to the body by default', async () => {
    const { container } = render(<Host />);
    await openIt();
    const panel = screen.getByRole('dialog');
    expect(container.contains(panel)).toBe(false);
    expect(document.body.contains(panel)).toBe(true);
  });

  it('portals into a container when the config gives one', async () => {
    const host = document.createElement('div');
    host.id = 'overlay-host';
    document.body.appendChild(host);

    render(
      <GrangeProvider portalContainer={host}>
        <Host />
      </GrangeProvider>,
    );
    await openIt();
    expect(host.contains(screen.getByRole('dialog'))).toBe(true);
    host.remove();
  });

  it('moves focus into the dialog', async () => {
    render(<Host />);
    await openIt();
    await waitFor(() => {
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    });
  });

  it('hides the rest of the page from assistive tech while open', async () => {
    render(<Host />);
    await openIt();
    // ariaHideOutside marks everything outside the dialog. Queried by role, which respects the
    // accessibility tree; queryByLabelText would still find it, since it ignores aria-hidden.
    expect(screen.queryByRole('textbox', { name: 'behind' })).toBeNull();
    expect(screen.getByLabelText('behind').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('gives the page back when it closes', async () => {
    render(<Host />);
    await openIt();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'behind' })).toBeTruthy();
  });

  it('closes on Escape when dismissable', async () => {
    const onOpenChange = vi.fn();
    render(<Host onOpenChange={onOpenChange} />);
    await openIt();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('refuses Escape when it is not dismissable, for a question that must be answered', async () => {
    render(<Host dismissable={false} />);
    await openIt();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('centres itself on an icon when given one', async () => {
    render(<Host icon />);
    await openIt();
    expect(screen.getByRole('dialog').dataset.hasIcon).toBe('true');
    expect(screen.getByTestId('dialog-icon')).toBeTruthy();
  });

  it('renders its actions', async () => {
    render(<Host />);
    await openIt();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  it('reaches the scrim and headline slots', async () => {
    render(
      <GrangeProvider classNames={{ Dialog: { scrim: 'my-scrim', headline: 'my-headline' } }}>
        <Host />
      </GrangeProvider>,
    );
    await openIt();
    expect(document.querySelector('.grange-dialog-scrim')?.className).toContain('my-scrim');
    expect(document.querySelector('.grange-dialog-headline')?.className).toContain('my-headline');
  });
});

describe('Tooltip', () => {
  const Trigger = () => (
    <Tooltip content="Add to favourites" delay={0}>
      <IconButton aria-label="Favourite">
        <svg />
      </IconButton>
    </Tooltip>
  );

  it('renders only the trigger until it is needed', () => {
    render(<Trigger />);
    expect(screen.getByRole('button', { name: 'Favourite' })).toBeTruthy();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows at once on keyboard focus, which is what the pattern expects', async () => {
    render(<Trigger />);
    await userEvent.tab();
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeTruthy());
    expect(screen.getByRole('tooltip').textContent).toBe('Add to favourites');
  });

  it('hides again when focus leaves', async () => {
    render(
      <>
        <Trigger />
        <button type="button">elsewhere</button>
      </>,
    );
    await userEvent.tab();
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeNull());
    await userEvent.tab();
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('describes its trigger, rather than only sitting beside it', async () => {
    render(<Trigger />);
    await userEvent.tab();
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeNull());
    const described = screen.getByRole('button', { name: 'Favourite' }).getAttribute('aria-describedby');
    expect(described).toBe(screen.getByRole('tooltip').id);
  });

  it('hides on Escape without closing anything else', async () => {
    render(<Trigger />);
    await userEvent.tab();
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('stays away entirely when disabled', async () => {
    render(
      <Tooltip content="Nope" delay={0} disabled>
        <IconButton aria-label="Favourite">
          <svg />
        </IconButton>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('records the placement it settled on, which may not be the one asked for', async () => {
    render(
      <Tooltip content="Hi" delay={0} placement="bottom">
        <IconButton aria-label="Favourite">
          <svg />
        </IconButton>
      </Tooltip>,
    );
    await userEvent.tab();
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeNull());
    expect(screen.getByRole('tooltip').dataset.placement).toBeTruthy();
  });

  it('rejects a child it cannot attach to', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      // @ts-expect-error a string child has nothing to clone props onto
      render(<Tooltip content="Hi">just text</Tooltip>),
    ).toThrow(/single element child/);
    quiet.mockRestore();
  });
});
