import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GrangeProvider, Menu, MenuItem, MenuSection, MenuTrigger, OutlinedButton, menu } from '../index';

describe('tokens', () => {
  it('matches MenuTokens and the ListTokens rows', () => {
    expect(menu).toMatchObject({
      corner: 4,
      elevation: 2,
      itemPadding: 16,
      itemGap: 12,
      itemHeight: 56,
      itemHeightTwoLine: 72,
      itemIcon: 24,
    });
  });
});

function Basic(props: { onAction?: (key: unknown) => void; disabledKeys?: string[] }) {
  return (
    <MenuTrigger>
      <OutlinedButton>Actions</OutlinedButton>
      <Menu aria-label="Actions" onAction={props.onAction} disabledKeys={props.disabledKeys}>
        <MenuItem key="edit">Edit</MenuItem>
        <MenuItem key="duplicate" trailingText="⌘D">
          Duplicate
        </MenuItem>
        <MenuItem key="delete" supportingText="This cannot be undone">
          Delete
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

/**
 * The popover is modal, so while it is open React Aria hides the rest of the page from assistive
 * tech and the trigger is no longer findable by role. Tests hold on to it from before.
 */
async function openMenu() {
  const trigger = screen.getByRole('button', { name: 'Actions' });
  await userEvent.click(trigger);
  return trigger;
}

describe('MenuTrigger', () => {
  it('announces the trigger as a closed menu button', () => {
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens on press and portals the surface out of the trigger', async () => {
    const { container } = render(<Basic />);
    const trigger = await openMenu();
    const list = screen.getByRole('menu', { name: 'Actions' });
    expect(container.contains(list)).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('hides the page behind it, since the popover is modal', async () => {
    render(<Basic />);
    await openMenu();
    // Only the menu is left in the accessibility tree.
    expect(screen.queryByRole('button', { name: 'Actions' })).toBeNull();
  });

  it('opens with the down arrow and lands on the first item', async () => {
    render(<Basic />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());
    expect(document.activeElement?.textContent).toContain('Edit');
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    render(<Basic />);
    const trigger = await openMenu();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    // Focus restoration happens in an effect after the overlay unmounts, so it is waited for
    // rather than asserted straight away.
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('closes on a click outside', async () => {
    render(
      <>
        <Basic />
        <button type="button">elsewhere</button>
      </>,
    );
    const elsewhere = screen.getByRole('button', { name: 'elsewhere' });
    await openMenu();
    await userEvent.click(elsewhere);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('can be controlled', async () => {
    function Controlled() {
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <output>{String(isOpen)}</output>
          <MenuTrigger open={isOpen} onOpenChange={setOpen}>
            <OutlinedButton>Actions</OutlinedButton>
            <Menu aria-label="Actions">
              <MenuItem key="a">A</MenuItem>
            </Menu>
          </MenuTrigger>
        </>
      );
    }
    render(<Controlled />);
    await openMenu();
    expect(screen.getByText('true')).toBeTruthy();
  });

  it('rejects children it cannot wire up', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        // @ts-expect-error a trigger with no menu after it
        <MenuTrigger>{'just text'}</MenuTrigger>,
      ),
    ).toThrow(/trigger element followed by a Menu/);
    quiet.mockRestore();
  });
});

describe('Menu', () => {
  it('renders its items as menu items', async () => {
    render(<Basic />);
    await openMenu();
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent?.replace(/⌘D|This cannot be undone/, ''))).toEqual(
      ['Edit', 'Duplicate', 'Delete'],
    );
  });

  it('reports the chosen item and closes', async () => {
    const onAction = vi.fn();
    render(<Basic onAction={onAction} />);
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /Edit/ }));
    // onAction is called with the key and the event, so the key is checked on its own.
    expect(onAction.mock.calls[0]?.[0]).toBe('edit');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('focuses the menu itself when opened by pointer, not an item', async () => {
    render(<Basic />);
    await openMenu();
    // Opening with a mouse should not jump focus onto an option you did not choose.
    expect(document.activeElement).toBe(screen.getByRole('menu'));
  });

  it('moves with the arrows, and stops at the ends', async () => {
    render(<Basic />);
    // Opened from the keyboard, so focus starts on the first item.
    screen.getByRole('button', { name: 'Actions' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());

    const items = screen.getAllByRole('menuitem');
    await waitFor(() => expect(document.activeElement).toBe(items[0]));

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(items[2]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(items[0]);
  });

  it('jumps to an item by typing its label, which is what collections buy', async () => {
    render(<Basic />);
    await openMenu();
    await userEvent.keyboard('del');
    await waitFor(() => {
      expect(document.activeElement?.textContent).toContain('Delete');
    });
  });

  it('skips a disabled item', async () => {
    const onAction = vi.fn();
    render(<Basic onAction={onAction} disabledKeys={['duplicate']} />);
    await openMenu();
    const duplicate = screen.getByRole('menuitem', { name: /Duplicate/ });
    expect(duplicate.getAttribute('aria-disabled')).toBe('true');

    await userEvent.click(duplicate);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('marks a two-line item, which the taller row keys off', async () => {
    render(<Basic />);
    await openMenu();
    expect(screen.getByRole('menuitem', { name: /Delete/ }).dataset.twoLine).toBe('true');
  });

  it('supports single selection for a menu of choices', async () => {
    const onSelectionChange = vi.fn();
    function Choices() {
      const [keys, setKeys] = useState<Set<string>>(new Set(['medium']));
      return (
        <>
          <output>{[...keys].join(',')}</output>
          <MenuTrigger defaultOpen>
            <OutlinedButton>Size</OutlinedButton>
            <Menu
              aria-label="Size"
              selectionMode="single"
              selectedKeys={keys}
              onSelectionChange={(next) => {
                onSelectionChange(next);
                setKeys(next as Set<string>);
              }}
            >
              <MenuItem key="small">Small</MenuItem>
              <MenuItem key="medium">Medium</MenuItem>
            </Menu>
          </MenuTrigger>
        </>
      );
    }
    render(<Choices />);

    // Selectable items take the radio role, and the current one is checked.
    const items = screen.getAllByRole('menuitemradio');
    expect(items.find((i) => i.getAttribute('aria-checked') === 'true')?.textContent).toBe('Medium');

    // Choosing closes the menu, so the new selection is read from the state rather than the DOM.
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Small' }));
    expect([...(onSelectionChange.mock.calls[0]?.[0] as Set<string>)]).toEqual(['small']);
    await waitFor(() => expect(screen.getByText('small')).toBeTruthy());
  });

  it('groups items under a heading', async () => {
    render(
      <MenuTrigger defaultOpen>
        <OutlinedButton>Actions</OutlinedButton>
        <Menu aria-label="Actions">
          <MenuSection title="Edit">
            <MenuItem key="cut">Cut</MenuItem>
            <MenuItem key="copy">Copy</MenuItem>
          </MenuSection>
          <MenuSection title="Danger">
            <MenuItem key="delete">Delete</MenuItem>
          </MenuSection>
        </Menu>
      </MenuTrigger>,
    );
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Danger')).toBeTruthy();
    expect(screen.getAllByRole('group')).toHaveLength(2);
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('reaches the item slot', async () => {
    render(
      <GrangeProvider classNames={{ Menu: { item: 'my-item' } }}>
        <Basic />
      </GrangeProvider>,
    );
    await openMenu();
    expect(screen.getAllByRole('menuitem')[0]!.className).toContain('my-item');
  });
});
