import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilterBuilder,
  GrangeProvider,
  appendAt,
  emptyGroup,
  filterItems,
  newCondition,
  nodeAt,
  prune,
  replaceAt,
  type CompositeFilter,
  type FilterField,
} from '../index';

const fields: FilterField[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'score', label: 'Score', type: 'number' },
  { name: 'active', label: 'Active', type: 'boolean' },
];

const tree: CompositeFilter = {
  logic: 'and',
  filters: [
    { field: 'name', operator: 'contains', value: 'a' },
    { logic: 'or', filters: [{ field: 'score', operator: 'gt', value: 10 }] },
  ],
};

describe('the tree edits', () => {
  it('finds a node by path', () => {
    expect(nodeAt(tree, [0])).toEqual({ field: 'name', operator: 'contains', value: 'a' });
    expect(nodeAt(tree, [1, 0])).toEqual({ field: 'score', operator: 'gt', value: 10 });
  });

  it('gives nothing for a path that has gone stale', () => {
    expect(nodeAt(tree, [9])).toBeUndefined();
    expect(nodeAt(tree, [0, 0])).toBeUndefined();
  });

  it('copies every group on the way down, so React sees a change', () => {
    const next = replaceAt(tree, [1, 0], { field: 'score', operator: 'lt', value: 3 });
    expect(next).not.toBe(tree);
    // The group that contains the edit is a new object, not the same one mutated.
    expect(next.filters[1]).not.toBe(tree.filters[1]);
    // The untouched sibling is left exactly as it was.
    expect(next.filters[0]).toBe(tree.filters[0]);
  });

  it('removes a node when given nothing to put there', () => {
    expect(replaceAt(tree, [0], undefined).filters).toHaveLength(1);
  });

  it('appends into the group a path names', () => {
    const next = appendAt(tree, [1], newCondition('name', 'eq'));
    expect((next.filters[1] as CompositeFilter).filters).toHaveLength(2);
    expect(tree.filters).toHaveLength(2);
  });

  it('refuses to append into a condition, which has nothing to append to', () => {
    expect(appendAt(tree, [0], newCondition('name', 'eq'))).toBe(tree);
  });

  it('drops empty groups, which would otherwise widen the filter silently', () => {
    const withEmpty: CompositeFilter = {
      logic: 'and',
      filters: [{ field: 'name', operator: 'eq', value: 'x' }, emptyGroup()],
    };
    // An empty group matches everything, so one left behind by a removal is not harmless.
    expect(prune(withEmpty).filters).toHaveLength(1);
    expect(prune(emptyGroup()).filters).toEqual([]);
  });
});

describe('FilterBuilder', () => {
  const rendered = (extra: Partial<React.ComponentProps<typeof FilterBuilder>> = {}) =>
    render(<FilterBuilder fields={fields} {...extra} />);

  it('is a labelled group with a logic chooser', () => {
    rendered();
    expect(screen.getByRole('group', { name: 'Filter' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Match/ })).not.toBeNull();
  });

  it('says that an empty filter matches everything, rather than leaving it blank', () => {
    rendered();
    expect(screen.getByText(/matches everything/)).not.toBeNull();
  });

  it('adds a condition with the first field and a sensible operator', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    rendered({ onChange });

    await user.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(onChange).toHaveBeenCalledWith({
      logic: 'and',
      filters: [{ field: 'name', operator: 'contains', value: '' }],
    });
  });

  it('offers only the operators the chosen field can be compared with', async () => {
    const user = userEvent.setup();
    rendered({ defaultValue: { logic: 'and', filters: [{ field: 'score', operator: 'gt', value: 1 }] } });

    await user.click(screen.getByRole('button', { name: /Operator/ }));
    const options = within(screen.getByRole('listbox')).getAllByRole('option').map((el) => el.textContent);
    expect(options).toContain('Is greater than');
    // "Contains" on a number is a row that cannot run.
    expect(options).not.toContain('Contains');
  });

  it('keeps an operator the new field still offers, and resets one it does not', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    rendered({
      defaultValue: { logic: 'and', filters: [{ field: 'name', operator: 'contains', value: 'x' }] },
      onChange,
    });

    await user.click(screen.getByRole('button', { name: /Field/ }));
    await user.click(screen.getByRole('option', { name: 'Score' }));
    // 'contains' means nothing on a number, so it resets rather than leaving a dead row.
    expect(onChange.mock.lastCall![0].filters[0]).toEqual({ field: 'score', operator: 'eq', value: '' });
  });

  it('offers no value input for an operator that takes none', () => {
    const { rerender } = rendered({
      defaultValue: { logic: 'and', filters: [{ field: 'name', operator: 'contains', value: 'x' }] },
    });
    expect(screen.getByRole('textbox', { name: 'Value' })).not.toBeNull();

    rerender(
      <FilterBuilder
        fields={fields}
        value={{ logic: 'and', filters: [{ field: 'name', operator: 'isempty' }] }}
      />,
    );
    expect(screen.queryByRole('textbox', { name: 'Value' })).toBeNull();
  });

  it('draws a boolean value as a switch and a number as a number field', () => {
    render(
      <FilterBuilder
        fields={fields}
        value={{
          logic: 'and',
          filters: [
            { field: 'active', operator: 'eq', value: true },
            { field: 'score', operator: 'gt', value: 5 },
          ],
        }}
      />,
    );
    expect(screen.getByRole('switch', { name: 'Value' })).not.toBeNull();
    expect(screen.getByRole('textbox', { name: 'Value' }).getAttribute('inputmode')).toBe('numeric');
  });

  it('nests a group, and labels how deep it is', async () => {
    const user = userEvent.setup();
    rendered({ defaultValue: tree });
    expect(screen.getByRole('group', { name: /Nested filter group, level 2/ })).not.toBeNull();

    await user.click(screen.getAllByRole('button', { name: 'Add group' })[0]!);
    expect(screen.getAllByRole('group', { name: /Nested filter group/ })).toHaveLength(2);
  });

  it('stops offering groups at the depth it was given', () => {
    rendered({ defaultValue: tree, maxDepth: 2 });
    // The root may still nest; the level-2 group may not.
    expect(screen.getAllByRole('button', { name: 'Add group' })).toHaveLength(1);
  });

  it('removes a condition and a group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    rendered({ defaultValue: tree, onChange });

    await user.click(screen.getByRole('button', { name: 'Remove condition on Name' }));
    expect(onChange.mock.lastCall![0].filters).toHaveLength(1);

    // Uncontrolled, so the first removal has already landed: taking the group as well empties
    // the root, which is the state the builder draws its "matches everything" line for.
    await user.click(screen.getByRole('button', { name: 'Remove group' }));
    expect(onChange.mock.lastCall![0].filters).toHaveLength(0);
    expect(screen.getByText(/matches everything/)).not.toBeNull();
  });

  it('builds a filter the query can actually run', async () => {
    const user = userEvent.setup();
    function Live() {
      const [filter, setFilter] = useState<CompositeFilter>({
        logic: 'and',
        filters: [{ field: 'name', operator: 'contains', value: 'a' }],
      });
      const rows = [{ name: 'Ada' }, { name: 'Bob' }];
      return (
        <>
          <FilterBuilder fields={fields} value={filter} onChange={setFilter} />
          <p>matched: {filterItems(rows, filter).length}</p>
        </>
      );
    }
    render(<Live />);
    expect(screen.getByText('matched: 1')).not.toBeNull();

    await user.clear(screen.getByRole('textbox', { name: 'Value' }));
    await user.type(screen.getByRole('textbox', { name: 'Value' }), 'o');
    expect(screen.getByText('matched: 1')).not.toBeNull();
  });

  it('takes its depth from the provider', () => {
    render(
      <GrangeProvider defaultProps={{ FilterBuilder: { maxDepth: 1 } }}>
        <FilterBuilder fields={fields} />
      </GrangeProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Add group' })).toBeNull();
  });
});
