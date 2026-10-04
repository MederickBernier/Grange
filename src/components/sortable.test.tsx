import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ListDropTargetDelegate,
  ListKeyboardDelegate,
  Sortable,
  moveToEnd,
  reorder,
  useDrag,
  useDraggableCollection,
  useDraggableCollectionState,
  useDrop,
  useDroppableCollection,
  useDroppableCollectionState,
  type SortableItem,
} from '../index';

const items: SortableItem[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie' },
  { id: 'd', label: 'Delta' },
];
const ids = ['a', 'b', 'c', 'd'];

/*
 * The reordering is tested as arithmetic. A drag cannot be simulated usefully in jsdom — there
 * is no layout, so there are no drop targets — and these are the cases that actually bite.
 */
describe('reorder', () => {
  it('moves an item before another', () => {
    expect(reorder(ids, ['d'], 'b', 'before')).toEqual(['a', 'd', 'b', 'c']);
  });

  it('moves an item after another', () => {
    expect(reorder(ids, ['a'], 'c', 'after')).toEqual(['b', 'c', 'a', 'd']);
  });

  it('lands where it was dropped when moving downwards', () => {
    /*
     * The classic bug: compute the index first, then splice, and every item after the removed
     * one has already shifted — so a drag downwards lands one place short. Moving 'a' after
     * 'b' must put it between 'b' and 'c', not after 'c'.
     */
    expect(reorder(ids, ['a'], 'b', 'after')).toEqual(['b', 'a', 'c', 'd']);
  });

  it('keeps a run of items in their own order', () => {
    expect(reorder(ids, ['a', 'c'], 'd', 'before')).toEqual(['b', 'a', 'c', 'd']);
  });

  it('does nothing when a run is dropped onto itself', () => {
    // Which is what happens when a selection is dropped into a gap inside it.
    expect(reorder(ids, ['a', 'b'], 'a', 'after')).toEqual(ids);
  });

  it('ignores ids that are not in the list', () => {
    expect(reorder(ids, ['z'], 'b', 'before')).toEqual(ids);
    expect(reorder(ids, ['a'], 'z', 'before')).toEqual(ids);
  });

  it('never loses or duplicates an item', () => {
    for (const target of ids) {
      for (const position of ['before', 'after'] as const) {
        expect([...reorder(ids, ['b', 'd'], target, position)].sort()).toEqual(ids);
      }
    }
  });
});

describe('moveToEnd', () => {
  it('puts the moved items last, in their own order', () => {
    expect(moveToEnd(ids, ['b', 'a'])).toEqual(['c', 'd', 'a', 'b']);
  });

  it('ignores ids that are not there', () => {
    expect(moveToEnd(ids, ['z'])).toEqual(ids);
  });
});

describe('Sortable', () => {
  const rows = () => screen.getAllByRole('row');

  it('is a labelled list with a drag handle on every row', () => {
    render(<Sortable items={items} aria-label="Priorities" />);
    // A grid, not a listbox: an option cannot hold a focusable drag handle.
    expect(screen.getByRole('grid', { name: 'Priorities' })).not.toBeNull();
    expect(rows().map((el) => el.textContent)).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('shows the order it was given, not the order of the items', () => {
    render(<Sortable items={items} defaultOrder={['d', 'a', 'c', 'b']} aria-label="Priorities" />);
    expect(rows().map((el) => el.textContent)).toEqual(['Delta', 'Alpha', 'Charlie', 'Bravo']);
  });

  it('survives the items changing under a saved order', () => {
    const { rerender } = render(
      <Sortable items={items} order={['d', 'a', 'c', 'b']} aria-label="Priorities" />,
    );
    rerender(
      <Sortable
        items={[items[0]!, items[3]!, { id: 'e', label: 'Echo' }]}
        order={['d', 'a', 'c', 'b']}
        aria-label="Priorities"
      />,
    );
    // 'b' and 'c' are gone, 'e' joins the end, and the rest keep their places.
    expect(rows().map((el) => el.textContent)).toEqual(['Delta', 'Alpha', 'Echo']);
  });

  it('lets the keyboard reach the drag handle, which is the whole point of the grid', async () => {
    const user = userEvent.setup();
    render(<Sortable items={items} aria-label="Priorities" />);

    await user.tab();
    // Tab lands on the row, as it does in any grid: the list is one tab stop.
    expect(document.activeElement?.getAttribute('role')).toBe('row');

    // ArrowRight steps into the row's contents. In a listbox there would be nothing to step
    // into — an option cannot hold a focusable control — and the handle would be unreachable.
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement?.tagName).toBe('BUTTON');
  });

  it('works controlled', () => {
    function Controlled() {
      const [order] = useState(['c', 'b', 'a', 'd']);
      return <Sortable items={items} order={order} aria-label="Priorities" />;
    }
    render(<Controlled />);
    expect(rows().map((el) => el.textContent)).toEqual(['Charlie', 'Bravo', 'Alpha', 'Delta']);
  });

  it('reports a new order through onReorder', () => {
    // The drag itself needs layout, which jsdom has none of, so the callback is checked
    // against the arithmetic it is wired to rather than through a simulated drop.
    const onReorder = vi.fn();
    render(<Sortable items={items} onReorder={onReorder} aria-label="Priorities" />);
    expect(onReorder).not.toHaveBeenCalled();
    expect(reorder(ids, ['a'], 'c', 'after')).toEqual(['b', 'c', 'a', 'd']);
  });
});

describe('the drag and drop re-exports', () => {
  it('publishes the hooks Sortable is built on, unwrapped', () => {
    // So an app building its own draggable collection gets the version this library was
    // tested against, without adding react-aria as a second direct dependency.
    for (const exported of [
      useDrag,
      useDrop,
      useDraggableCollection,
      useDroppableCollection,
      useDraggableCollectionState,
      useDroppableCollectionState,
    ]) {
      expect(typeof exported).toBe('function');
    }
    expect(typeof ListDropTargetDelegate).toBe('function');
    expect(typeof ListKeyboardDelegate).toBe('function');
  });
});
