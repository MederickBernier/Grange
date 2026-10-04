import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropDownTree,
  GrangeProvider,
  MultiSelectTree,
  TransferList,
  TreeItem,
  keepSelected,
  movable,
  transfer,
  treeLabels,
  type TransferItem,
} from '../index';

const nodes = (
  <>
    <TreeItem key="docs" title="Documents">
      <TreeItem key="cv">CV</TreeItem>
      <TreeItem key="letters" title="Letters">
        <TreeItem key="bank">Bank</TreeItem>
      </TreeItem>
    </TreeItem>
    <TreeItem key="photos" title="Photos">
      <TreeItem key="trip">Trip</TreeItem>
    </TreeItem>
  </>
);

describe('treeLabels', () => {
  it('reads a branch from its title and a leaf from its children', () => {
    const labels = treeLabels(nodes);
    expect(labels.get('docs')).toBe('Documents');
    expect(labels.get('cv')).toBe('CV');
  });

  it('walks all the way down, not just the first level', () => {
    expect(treeLabels(nodes).get('bank')).toBe('Bank');
  });

  it('sees through a fragment, which Children.forEach does not flatten', () => {
    // The whole tree above is written inside one.
    expect(treeLabels(nodes).size).toBe(6);
  });

  it('skips anything without a key, because there is nothing to look it up by', () => {
    expect(treeLabels(<TreeItem title="No key">x</TreeItem>).size).toBe(0);
  });
});

describe('DropDownTree', () => {
  const trigger = (name = /Folder/) => screen.getByRole('button', { name });

  it('says it opens a dialog, because a tree is not a list of options', () => {
    render(
      <DropDownTree label="Folder" aria-label="Folder">
        {nodes}
      </DropDownTree>,
    );
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the tree and names the field', async () => {
    const user = userEvent.setup();
    render(<DropDownTree label="Folder">{nodes}</DropDownTree>);

    // Held onto before opening: the popover is modal, so once it is open the rest of the page
    // is hidden from assistive tech and the trigger can no longer be found by role.
    const button = trigger();
    await user.click(button);
    expect(screen.getByRole('treegrid', { name: 'Folder' })).not.toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('names what was chosen, which means walking the tree for its labels', () => {
    render(
      <DropDownTree label="Folder" defaultSelectedKeys={['bank']}>
        {nodes}
      </DropDownTree>,
    );
    expect(trigger().textContent).toContain('Bank');
  });

  it('closes on a single choice, as a select does', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <DropDownTree label="Folder" defaultExpandedKeys={['docs']} onSelectionChange={onSelectionChange}>
        {nodes}
      </DropDownTree>,
    );

    await user.click(trigger());
    await user.click(screen.getByText('CV'));
    expect([...onSelectionChange.mock.calls[0]![0]]).toEqual(['cv']);
    expect(screen.queryByRole('treegrid')).toBeNull();
  });

  it('stays open when several can be chosen, because the next choice is the point', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectTree label="Folders" defaultExpandedKeys={['docs']}>
        {nodes}
      </MultiSelectTree>,
    );

    await user.click(screen.getByRole('button', { name: /Folders/ }));
    await user.click(screen.getByText('CV'));
    expect(screen.queryByRole('treegrid')).not.toBeNull();
  });

  it('lists several chosen labels', () => {
    render(
      <MultiSelectTree label="Folders" defaultSelectedKeys={['cv', 'trip']}>
        {nodes}
      </MultiSelectTree>,
    );
    const text = screen.getByRole('button', { name: /Folders/ }).textContent ?? '';
    expect(text).toContain('CV');
    expect(text).toContain('Trip');
  });

  it('shows its placeholder when nothing is chosen', () => {
    render(
      <DropDownTree label="Folder" placeholder="Pick one">
        {nodes}
      </DropDownTree>,
    );
    expect(trigger().textContent).toContain('Pick one');
  });

  it('describes itself by its supporting text, and by the error instead when there is one', () => {
    const { container, rerender } = render(
      <DropDownTree label="Folder" supportingText="Where it goes">
        {nodes}
      </DropDownTree>,
    );
    const described = () => {
      const id = trigger().getAttribute('aria-describedby');
      return id ? container.querySelector(`#${CSS.escape(id)}`)?.textContent : null;
    };
    expect(described()).toBe('Where it goes');

    rerender(
      <DropDownTree label="Folder" supportingText="Where it goes" error errorText="Pick a folder">
        {nodes}
      </DropDownTree>,
    );
    expect(described()).toBe('Pick a folder');
  });

  it('takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ DropDownTree: { variant: 'outlined' } }}>
        <DropDownTree label="Folder">{nodes}</DropDownTree>
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-dropdown-tree') as HTMLElement).dataset.variant).toBe('outlined');
  });
});

const items: TransferItem[] = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday', disabled: true },
];

describe('transfer', () => {
  it('moves the named items and leaves the rest', () => {
    const out = transfer(items, [], ['tue'], items);
    expect(out.from.map((i) => i.id)).toEqual(['mon', 'wed', 'thu']);
    expect(out.to.map((i) => i.id)).toEqual(['tue']);
  });

  it('puts an item back where it belongs rather than at the end', () => {
    // Moving Monday back has to land it before Wednesday, not after it.
    const target = [items[2]!];
    const out = transfer([items[0]!], target, ['mon'], items);
    expect(out.to.map((i) => i.id)).toEqual(['mon', 'wed']);
  });

  it('refuses to move a disabled item, however it came to be selected', () => {
    const out = transfer(items, [], ['thu'], items);
    expect(out.to).toEqual([]);
    expect(out.from).toHaveLength(4);
  });

  it('ignores an id that is not on this side', () => {
    const out = transfer([items[0]!], [], ['wed'], items);
    expect(out.from.map((i) => i.id)).toEqual(['mon']);
    expect(out.to).toEqual([]);
  });

  it('never loses or duplicates an item', () => {
    const out = transfer(items, [], ['mon', 'wed'], items);
    expect([...out.from, ...out.to].map((i) => i.id).sort()).toEqual(['mon', 'thu', 'tue', 'wed']);
  });
});

describe('movable and keepSelected', () => {
  it('counts only what can actually move', () => {
    expect(movable(items)).toEqual(['mon', 'tue', 'wed']);
  });

  it('drops keys for items that are no longer on this side', () => {
    expect([...keepSelected(['mon', 'wed'], [items[0]!])]).toEqual(['mon']);
  });
});

describe('TransferList', () => {
  const list = (name: string) => screen.getByRole('listbox', { name });

  it('shows everything on the left until something is chosen', () => {
    render(<TransferList items={items} />);
    expect(within(list('Available')).getAllByRole('option')).toHaveLength(4);
    expect(within(list('Chosen')).queryAllByRole('option')).toHaveLength(0);
  });

  it('starts with the value it was given on the right', () => {
    render(<TransferList items={items} defaultValue={['tue']} />);
    expect(within(list('Chosen')).getAllByRole('option')).toHaveLength(1);
    expect(within(list('Available')).getAllByRole('option')).toHaveLength(3);
  });

  it('moves what is selected, and reports the new value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TransferList items={items} onChange={onChange} />);

    await user.click(within(list('Available')).getByRole('option', { name: 'Monday' }));
    await user.click(screen.getByRole('button', { name: 'Move selected to chosen' }));
    expect(onChange).toHaveBeenCalledWith(['mon']);
  });

  it('says what moved, because the press changes two lists and moves focus nowhere', async () => {
    const user = userEvent.setup();
    render(<TransferList items={items} />);

    await user.click(within(list('Available')).getByRole('option', { name: 'Monday' }));
    await user.click(screen.getByRole('button', { name: 'Move selected to chosen' }));
    expect(screen.getByRole('status').textContent).toBe('1 item moved to chosen');
  });

  it('moves everything that is allowed to move', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TransferList items={items} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Move all to chosen' }));
    // Thursday is disabled, so it stays.
    expect(onChange).toHaveBeenCalledWith(['mon', 'tue', 'wed']);
  });

  it('disables a button that would do nothing', () => {
    render(<TransferList items={items} />);
    expect(
      screen.getByRole('button', { name: 'Move selected to chosen' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Move all to available' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('drops the move-all buttons when told to', () => {
    render(<TransferList items={items} allowMoveAll={false} />);
    expect(screen.queryByRole('button', { name: 'Move all to chosen' })).toBeNull();
  });

  it('keeps both sides in the order the items were given in', async () => {
    const user = userEvent.setup();
    render(<TransferList items={items} defaultValue={['wed']} />);

    await user.click(within(list('Available')).getByRole('option', { name: 'Monday' }));
    await user.click(screen.getByRole('button', { name: 'Move selected to chosen' }));
    expect(within(list('Chosen')).getAllByRole('option').map((el) => el.textContent)).toEqual([
      'Monday',
      'Wednesday',
    ]);
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string[]>([]);
      return <TransferList items={items} value={value} onChange={setValue} />;
    }
    render(<Controlled />);

    await user.click(within(list('Available')).getByRole('option', { name: 'Tuesday' }));
    await user.click(screen.getByRole('button', { name: 'Move selected to chosen' }));
    expect(within(list('Chosen')).getAllByRole('option')).toHaveLength(1);
  });
});
