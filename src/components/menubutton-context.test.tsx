import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ComboBoxItem,
  ContextMenu,
  GrangeProvider,
  Menu,
  MenuButton,
  MenuItem,
  MultiColumnComboBox,
} from '../index';

const items = (
  <>
    <MenuItem key="cut">Cut</MenuItem>
    <MenuItem key="copy">Copy</MenuItem>
    <MenuItem key="paste" isDisabled>
      Paste
    </MenuItem>
  </>
);

describe('MenuButton', () => {
  it('is a button that opens a menu, named by that button', async () => {
    const user = userEvent.setup();
    render(<MenuButton items={items}>Edit</MenuButton>);
    const trigger = screen.getByRole('button', { name: 'Edit' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(screen.queryByRole('menu')).toBeNull();

    await user.click(trigger);
    /*
     * The menu takes its name from the trigger, and there is no way to give it another:
     * useMenuTrigger points its aria-labelledby at the button, which wins over any aria-label.
     * A menuLabel prop would have sat in the API looking like it worked.
     */
    expect(screen.getByRole('menu', { name: 'Edit' })).toBeTruthy();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('reports the chosen item and closes', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <MenuButton items={items} onAction={onAction}>
        Edit
      </MenuButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onAction.mock.calls[0]![0]).toBe('copy');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('keeps the button it is built on: variants, sizes and disabled', () => {
    const { container, unmount } = render(
      <MenuButton items={items} variant="outlined" size="l">
        Edit
      </MenuButton>,
    );
    const trigger = container.querySelector('button')!;
    expect(trigger.getAttribute('data-variant')).toBe('outlined');
    expect(trigger.getAttribute('data-size')).toBe('l');
    unmount();

    render(
      <MenuButton items={items} disabled>
        Edit
      </MenuButton>,
    );
    expect((screen.getByRole('button', { name: 'Edit' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('carries selection through to the menu', async () => {
    const user = userEvent.setup();
    render(
      <MenuButton items={items} selectionMode="single" defaultSelectedKeys={['cut']}>
        Edit
      </MenuButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const options = screen.getAllByRole('menuitemradio');
    expect(options[0]!.getAttribute('aria-checked')).toBe('true');
  });

  it('is controlled when it is given an open prop', () => {
    const { rerender } = render(
      <MenuButton items={items} open={false}>
        Edit
      </MenuButton>,
    );
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(
      <MenuButton items={items} open>
        Edit
      </MenuButton>,
    );
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('takes the M3E menu restyles', async () => {
    const user = userEvent.setup();
    render(
      <MenuButton items={items} menuVariant="vibrant">
        Edit
      </MenuButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('menu').getAttribute('data-variant')).toBe('vibrant');
  });
});

describe('ContextMenu', () => {
  const target = (onOpenChange?: (open: boolean) => void) => (
    <ContextMenu onOpenChange={onOpenChange}>
      <div data-testid="canvas" style={{ width: 200, height: 100 }}>
        Right-click me
      </div>
      <Menu aria-label="Canvas actions">{items}</Menu>
    </ContextMenu>
  );

  /** jsdom gives every element a zero box, so the target is given one to place the menu against. */
  const withBox = (el: Element) => {
    el.getBoundingClientRect = () =>
      ({ left: 10, top: 20, width: 200, height: 100, right: 210, bottom: 120, x: 10, y: 20, toJSON: () => ({}) }) as DOMRect;
  };

  it('opens on a right-click, at the pointer', async () => {
    render(target());
    const canvas = screen.getByTestId('canvas');
    withBox(canvas);
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.contextMenu(canvas, { clientX: 60, clientY: 50, button: 2 });
    await waitFor(() => expect(screen.getByRole('menu', { name: 'Canvas actions' })).toBeTruthy());
  });

  it('puts focus in the menu, so the arrows and Escape work', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(target(onOpenChange));
    const canvas = screen.getByTestId('canvas');
    withBox(canvas);

    fireEvent.contextMenu(canvas, { clientX: 60, clientY: 50, button: 2 });
    await waitFor(() => expect(screen.getByRole('menu')).toBeTruthy());
    // Nothing else moves focus into a menu opened at a pointer, which is why it says autoFocus.
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Cut'));

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Copy');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
  });

  it('chooses an item and closes', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ContextMenu>
        <div data-testid="canvas">Right-click me</div>
        <Menu aria-label="Canvas actions" onAction={onAction}>
          {items}
        </Menu>
      </ContextMenu>,
    );
    const canvas = screen.getByTestId('canvas');
    withBox(canvas);
    fireEvent.contextMenu(canvas, { clientX: 60, clientY: 50, button: 2 });
    await waitFor(() => expect(screen.getByRole('menu')).toBeTruthy());

    await user.click(screen.getByRole('menuitem', { name: 'Cut' }));
    expect(onAction.mock.calls[0]![0]).toBe('cut');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('leaves the target usable when nothing has been pressed', () => {
    render(target());
    expect(screen.getByTestId('canvas').textContent).toBe('Right-click me');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('says so rather than failing quietly without a menu', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <ContextMenu>
          <div>Target</div>
          {'not a menu' as never}
        </ContextMenu>,
      ),
    ).toThrow(/followed by a Menu/);
    quiet.mockRestore();
  });
});

describe('MultiColumnComboBox', () => {
  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'country', title: 'Country', width: '120px' },
  ];
  const rows = (
    <>
      <ComboBoxItem key="par" cells={['Paris', 'France']}>
        Paris
      </ComboBoxItem>
      <ComboBoxItem key="rom" cells={['Rome', 'Italy']}>
        Rome
      </ComboBoxItem>
    </>
  );
  const input = () => screen.getByRole('combobox', { name: 'City' }) as HTMLInputElement;

  it('shows a header and a row of cells per option', async () => {
    const user = userEvent.setup();
    render(
      <MultiColumnComboBox label="City" columns={columns}>
        {rows}
      </MultiColumnComboBox>,
    );
    await user.click(screen.getByRole('button', { name: /City/ }));

    expect(screen.getByText('Country')).toBeTruthy();
    const option = screen.getByRole('option', { name: 'Paris' });
    // The label is in there too, visually hidden, because the cells are hidden from assistive
    // tech and the option would otherwise have no name at all.
    expect(option.textContent).toBe('ParisParisFrance');
    expect(option.querySelector('[class*="cells"]')?.textContent).toBe('ParisFrance');
  });

  it('keeps each option one option, named by its label', async () => {
    const user = userEvent.setup();
    render(
      <MultiColumnComboBox label="City" columns={columns}>
        {rows}
      </MultiColumnComboBox>,
    );
    await user.click(screen.getByRole('button', { name: /City/ }));

    // The columns are presentation: a real tabular list would need useGridList and would make
    // every cell a focus stop, which is the wrong trade for picking one thing.
    expect(screen.queryByRole('grid')).toBeNull();
    expect(screen.queryAllByRole('gridcell')).toHaveLength(0);
    expect(screen.getAllByRole('option')).toHaveLength(2);
    // The cells are hidden from assistive tech, so the row is not read twice.
    expect(screen.getByRole('option', { name: 'Paris' }).getAttribute('aria-label')).toBeNull();
  });

  it('shares its tracks between the header and the rows', async () => {
    const user = userEvent.setup();
    render(
      <MultiColumnComboBox label="City" columns={columns}>
        {rows}
      </MultiColumnComboBox>,
    );
    await user.click(screen.getByRole('button', { name: /City/ }));
    const list = screen.getByRole('listbox');
    expect(list.style.getPropertyValue('--grange-option-columns')).toBe('1fr 120px');
  });

  it('still filters on the label', async () => {
    const user = userEvent.setup();
    render(
      <MultiColumnComboBox label="City" columns={columns}>
        {rows}
      </MultiColumnComboBox>,
    );
    await user.type(input(), 'rom');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    expect(screen.getByRole('option', { name: 'Rome' })).toBeTruthy();
  });

  it('is a plain list again without columns', async () => {
    const user = userEvent.setup();
    render(
      <GrangeProvider>
        <MultiColumnComboBox label="City" columns={[]}>
          <ComboBoxItem key="par">Paris</ComboBoxItem>
        </MultiColumnComboBox>
      </GrangeProvider>,
    );
    await user.click(screen.getByRole('button', { name: /City/ }));
    expect(screen.getByRole('option', { name: 'Paris' }).textContent).toBe('Paris');
  });
});
