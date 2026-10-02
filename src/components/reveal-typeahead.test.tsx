import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FabMenu, FabMenuItem, FilledTextField, GrangeProvider, OutlinedTextField, fabMenu } from '../index';

const field = () => screen.getByLabelText('Password') as HTMLInputElement;
const reveal = () => screen.getByRole('button', { name: /password/i });

describe('password reveal', () => {
  it('is there for a password field and nothing else', () => {
    const { unmount } = render(<FilledTextField label="Password" type="password" />);
    expect(reveal()).toBeTruthy();
    expect(field().type).toBe('password');
    unmount();

    render(<FilledTextField label="Email" type="email" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('can be turned off for a field whose value should never be shown', () => {
    render(<FilledTextField label="Password" type="password" revealable={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(field().type).toBe('password');
  });

  it('shows the characters, and puts the type back when hidden again', async () => {
    const user = userEvent.setup();
    render(<FilledTextField label="Password" type="password" />);
    await user.type(field(), 'hunter2');

    await user.click(reveal());
    // A browser only shows the characters for a real text input.
    expect(field().type).toBe('text');
    expect(field().value).toBe('hunter2');

    await user.click(reveal());
    // Back to password, so autofill and password managers still recognise the field.
    expect(field().type).toBe('password');
  });

  it('says whether the password is showing, and renames itself', async () => {
    const user = userEvent.setup();
    render(<FilledTextField label="Password" type="password" />);
    expect(reveal().getAttribute('aria-pressed')).toBe('false');
    expect(reveal().getAttribute('aria-label')).toBe('Show password');

    await user.click(reveal());
    expect(reveal().getAttribute('aria-pressed')).toBe('true');
    expect(reveal().getAttribute('aria-label')).toBe('Hide password');
  });

  it('takes its own labels', () => {
    render(
      <FilledTextField label="Password" type="password" revealLabel="Afficher" hideLabel="Masquer" />,
    );
    expect(screen.getByRole('button', { name: 'Afficher' })).toBeTruthy();
  });

  it('cannot submit the form it sits in', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <FilledTextField label="Password" type="password" />
      </form>,
    );
    expect(reveal().getAttribute('type')).toBe('button');
  });

  it('works from the keyboard and keeps focus so it can be pressed again', async () => {
    const user = userEvent.setup();
    render(<FilledTextField label="Password" type="password" defaultValue="hunter2" />);

    field().focus();
    await user.tab();
    expect(document.activeElement).toBe(reveal());
    await user.keyboard('{Enter}');
    expect(field().type).toBe('text');
    // Still on the button, so the next press hides it again without hunting for it.
    expect(document.activeElement).toBe(reveal());
    await user.keyboard(' ');
    expect(field().type).toBe('password');
  });

  it('follows the field into disabled and into error', () => {
    const { unmount } = render(<FilledTextField label="Password" type="password" disabled />);
    expect((reveal() as HTMLButtonElement).disabled).toBe(true);
    unmount();

    const { container } = render(
      <OutlinedTextField label="Password" type="password" error errorText="Too short" />,
    );
    expect(container.querySelector('.grange-text-field-reveal')).toBeTruthy();
    expect((reveal() as HTMLButtonElement).disabled).toBe(false);
  });

  it('sits beside a trailing icon rather than replacing it', () => {
    const { container } = render(
      <FilledTextField label="Password" type="password" trailingIcon={<svg data-testid="icon" />} />,
    );
    expect(container.querySelector('.grange-text-field-trailing-icon')).toBeTruthy();
    expect(container.querySelector('.grange-text-field-reveal')).toBeTruthy();
  });

  it('is a slot like every other part of the field', () => {
    const { container } = render(
      <GrangeProvider classNames={{ TextField: { reveal: 'x-reveal' } }}>
        <FilledTextField label="Password" type="password" />
      </GrangeProvider>,
    );
    expect(container.querySelector('.x-reveal')).toBeTruthy();
  });

  it('has nothing to reveal on a multiline field', () => {
    render(<FilledTextField label="Password" type="password" multiline />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

function Host({ initial = false }: { initial?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <FabMenu
      open={open}
      onOpenChange={setOpen}
      icon={<svg />}
      closeIcon={<svg />}
      aria-label="Create"
      closeAriaLabel="Close"
    >
      <FabMenuItem>Alarm</FabMenuItem>
      <FabMenuItem>Bookmark</FabMenuItem>
      <FabMenuItem>Album</FabMenuItem>
      <FabMenuItem disabled>Archive</FabMenuItem>
    </FabMenu>
  );
}

/** All four rows, including the disabled one: it is still a menu item, just not a focus stop. */
const items = () => screen.getAllByRole('menuitem');
const focusedLabel = () => document.activeElement?.textContent;

describe('FabMenu keyboard', () => {
  it('keeps the typeahead buffer alive for a word and no longer', () => {
    expect(fabMenu.typeaheadResetMs).toBeGreaterThanOrEqual(500);
    expect(fabMenu.typeaheadResetMs).toBeLessThanOrEqual(2000);
  });

  it('opens on the down arrow with the first item focused', async () => {
    const user = userEvent.setup();
    render(<Host />);
    screen.getByRole('button', { name: 'Create' }).focus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('menu')).toBeTruthy());
    expect(focusedLabel()).toBe('Alarm');
  });

  it('opens on the up arrow with the last one focused', async () => {
    const user = userEvent.setup();
    render(<Host />);
    screen.getByRole('button', { name: 'Create' }).focus();
    await user.keyboard('{ArrowUp}');
    await waitFor(() => expect(screen.getByRole('menu')).toBeTruthy());
    // The disabled item is not a stop, so the last one is the album.
    expect(focusedLabel()).toBe('Album');
  });

  it('jumps to a matching label as it is typed', async () => {
    const user = userEvent.setup();
    render(<Host initial />);
    await waitFor(() => expect(items().length).toBe(4));

    await user.keyboard('b');
    expect(focusedLabel()).toBe('Bookmark');

    // A fresh search, since the buffer only lives for a moment.
    await new Promise((resolve) => setTimeout(resolve, fabMenu.typeaheadResetMs + 20));
    await user.keyboard('a');
    expect(focusedLabel()).toBe('Album');
    // Adding a letter narrows what is already found rather than skipping past it.
    await user.keyboard('l');
    expect(focusedLabel()).toBe('Album');
  });

  it('cycles through the items starting with the same letter', async () => {
    const user = userEvent.setup();
    render(<Host initial />);
    await waitFor(() => expect(items().length).toBe(4));

    // Focus opens on Alarm, so a fresh search for "a" goes to the next match rather than staying.
    await user.keyboard('a');
    expect(focusedLabel()).toBe('Album');
    // A fresh buffer each time, since the same letter again means the next match, not "aa".
    await new Promise((resolve) => setTimeout(resolve, fabMenu.typeaheadResetMs + 20));
    await user.keyboard('a');
    // Round again, past the disabled Archive, which is never a target.
    expect(focusedLabel()).toBe('Alarm');
    await new Promise((resolve) => setTimeout(resolve, fabMenu.typeaheadResetMs + 20));
    await user.keyboard('a');
    expect(focusedLabel()).toBe('Album');
  });

  it('never lands on a disabled item', async () => {
    const user = userEvent.setup();
    render(<Host initial />);
    await waitFor(() => expect(items().length).toBe(4));
    await user.keyboard('ar');
    // Archive is the only match and it is disabled, so focus does not move.
    expect(focusedLabel()).not.toBe('Archive');
  });

  it('still answers the arrows, Home and End once open', async () => {
    const user = userEvent.setup();
    render(<Host initial />);
    await waitFor(() => expect(items().length).toBe(4));

    await user.keyboard('{End}');
    expect(focusedLabel()).toBe('Album');
    await user.keyboard('{ArrowDown}');
    // Wraps round rather than stopping at the end.
    expect(focusedLabel()).toBe('Alarm');
    await user.keyboard('{ArrowUp}');
    expect(focusedLabel()).toBe('Album');
    await user.keyboard('{Home}');
    expect(focusedLabel()).toBe('Alarm');
  });

  it('leaves the arrows alone while it is open, so they do not reopen it', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <FabMenu
        open
        onOpenChange={onOpenChange}
        icon={<svg />}
        closeIcon={<svg />}
        aria-label="Create"
      >
        <FabMenuItem>Alarm</FabMenuItem>
      </FabMenu>,
    );
    await user.keyboard('{ArrowDown}');
    expect(onOpenChange).not.toHaveBeenCalledWith(true);
  });
});
