import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GrangeProvider,
  Pager,
  TreeItem,
  TreeView,
  clampPage,
  list,
  pageCount,
  pageList,
  pageRange,
  pager,
  tree,
} from '../index';

describe('tokens', () => {
  it('makes a tree row a list row', () => {
    expect(tree.rowHeight).toBe(list.oneLine);
    expect(tree.gutter).toBe(list.leadingSpace);
    expect(tree.icon).toBe(list.leadingIcon);
    // The one chosen value: an indent that puts a child's label where its parent's starts.
    expect(tree.indent).toBe(list.leadingIcon + list.betweenSpace);
  });

  it('lines the pager up with the list it sits under', () => {
    expect(pager.height).toBe(list.oneLine);
    expect(pager.gutter).toBe(list.leadingSpace);
  });
});

/*
 * Paging is almost entirely off-by-one cases, so the arithmetic is tested as arithmetic.
 */
describe('pageCount', () => {
  it('rounds up, because a part page is still a page', () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(1, 10)).toBe(1);
    expect(pageCount(10, 10)).toBe(1);
    expect(pageCount(11, 10)).toBe(2);
  });

  it('never reports zero pages, so a pager always reads "1 of 1"', () => {
    expect(pageCount(0, 25)).toBe(1);
    expect(pageCount(-5, 25)).toBe(1);
  });

  it('survives a page size of nothing rather than dividing by zero', () => {
    expect(pageCount(100, 0)).toBe(1);
  });
});

describe('clampPage', () => {
  it('keeps a page inside the range that exists', () => {
    expect(clampPage(0, 100, 10)).toBe(1);
    expect(clampPage(99, 100, 10)).toBe(10);
    expect(clampPage(4, 100, 10)).toBe(4);
  });

  it('falls back to the first page for a number that is not one', () => {
    expect(clampPage(NaN, 100, 10)).toBe(1);
  });
});

describe('pageRange', () => {
  it('reports the items a page actually shows', () => {
    expect(pageRange(240, 5, 10)).toEqual({ from: 41, to: 50, pages: 24 });
  });

  it('shortens the last page rather than claiming rows that are not there', () => {
    // The classic pager bug: 25 × 10 would read "241–250 of 243".
    expect(pageRange(243, 25, 10)).toEqual({ from: 241, to: 243, pages: 25 });
  });

  it('reads as empty when there is nothing', () => {
    expect(pageRange(0, 1, 10)).toEqual({ from: 0, to: 0, pages: 1 });
  });
});

describe('pageList', () => {
  it('keeps the first and last page, which are the two a reader reaches for', () => {
    expect(pageList(5, 10, 1)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
  });

  it('draws a short run whole', () => {
    expect(pageList(2, 4, 1)).toEqual([1, 2, 3, 4]);
  });

  it('spells out the page a gap would have hidden, rather than hiding one page', () => {
    // Pages 1, 2 and 4 are kept, so 3 is the only one a gap would stand for — and a gap that
    // hides exactly one page is wider than the page it hides.
    expect(pageList(1, 4, 1)).toEqual([1, 2, 3, 4]);
    // Two or more is worth a gap.
    expect(pageList(1, 5, 1)).toEqual([1, 2, 'gap', 5]);
  });

  it('holds together at the ends', () => {
    expect(pageList(1, 10, 1)).toEqual([1, 2, 'gap', 10]);
    expect(pageList(10, 10, 1)).toEqual([1, 'gap', 9, 10]);
  });

  it('never repeats a page, however the window falls', () => {
    for (let page = 1; page <= 12; page += 1) {
      const out = pageList(page, 12, 2).filter((e): e is number => e !== 'gap');
      expect(new Set(out).size).toBe(out.length);
    }
  });
});

describe('TreeView', () => {
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
  const rows = () => screen.getAllByRole('row');

  it('is a treegrid, which is what lets a row hold its own controls', () => {
    render(<TreeView aria-label="Files">{nodes}</TreeView>);
    // Not role="tree": a treeitem's children must be treeitems, so nothing interactive can
    // live in a row. React Aria uses a treegrid, where a row has cells.
    expect(screen.getByRole('treegrid', { name: 'Files' })).not.toBeNull();
  });

  it('renders only what is expanded, which for a tree is the whole point', () => {
    render(<TreeView aria-label="Files">{nodes}</TreeView>);
    expect(rows()).toHaveLength(2);
    expect(screen.queryByText('CV')).toBeNull();
  });

  it('opens what defaultExpandedKeys names', () => {
    render(
      <TreeView aria-label="Files" defaultExpandedKeys={['docs']}>
        {nodes}
      </TreeView>,
    );
    expect(screen.getByText('CV')).not.toBeNull();
    expect(screen.queryByText('Bank')).toBeNull();
  });

  it('carries the level, position and size on every row', () => {
    render(
      <TreeView aria-label="Files" defaultExpandedKeys={['docs']}>
        {nodes}
      </TreeView>,
    );
    const [first, child] = rows();
    expect(first!.getAttribute('aria-level')).toBe('1');
    expect(first!.getAttribute('aria-expanded')).toBe('true');
    expect(child!.getAttribute('aria-level')).toBe('2');
    expect(child!.getAttribute('aria-posinset')).toBe('1');
    expect(child!.getAttribute('aria-setsize')).toBe('2');
  });

  it('numbers a row among its own siblings, not among every visible row', async () => {
    render(
      <TreeView aria-label="Files" defaultExpandedKeys={['docs', 'photos']}>
        {nodes}
      </TreeView>,
    );
    /*
     * The second branch's only child is "1 of 1". React Aria derives this from node.index,
     * which react-stately numbers globally across the visible rows, so without the override
     * this row announces itself as something like "item 4 of 1".
     */
    const trip = screen.getByText('Trip').closest('[role="row"]')!;
    expect(trip.getAttribute('aria-posinset')).toBe('1');
    expect(trip.getAttribute('aria-setsize')).toBe('1');
  });

  it('expands from the keyboard, with the arrows the pattern expects', async () => {
    const user = userEvent.setup();
    render(<TreeView aria-label="Files">{nodes}</TreeView>);

    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('CV')).not.toBeNull();

    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByText('CV')).toBeNull();
  });

  it('reports what was expanded, by key', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <TreeView aria-label="Files" onExpandedChange={onExpandedChange}>
        {nodes}
      </TreeView>,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['docs']));
  });

  it('selects when it is asked to, and not otherwise', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <TreeView aria-label="Files" onSelectionChange={onSelectionChange}>
        {nodes}
      </TreeView>,
    );
    await user.click(screen.getByText('Documents'));
    expect(onSelectionChange).not.toHaveBeenCalled();

    rerender(
      <TreeView aria-label="Files" selectionMode="single" onSelectionChange={onSelectionChange}>
        {nodes}
      </TreeView>,
    );
    await user.click(screen.getByText('Documents'));
    // React Aria hands back a Selection, which is a Set subclass, so the contents are what
    // can be compared rather than the object itself.
    expect([...onSelectionChange.mock.calls[0]![0]]).toEqual(['docs']);
  });

  it('indents a row by its level', () => {
    const { container } = render(
      <TreeView aria-label="Files" defaultExpandedKeys={['docs']}>
        {nodes}
      </TreeView>,
    );
    const levels = [...container.querySelectorAll('.grange-tree-row')].map((el) =>
      (el as HTMLElement).style.getPropertyValue('--grange-tree-level'),
    );
    expect(levels).toEqual(['0', '1', '1', '0']);
  });

  it('takes its selection mode from the provider', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <GrangeProvider defaultProps={{ TreeView: { selectionMode: 'multiple' } }}>
        <TreeView aria-label="Files" onSelectionChange={onSelectionChange}>
          {nodes}
        </TreeView>
      </GrangeProvider>,
    );
    await user.click(screen.getByText('Documents'));
    await user.click(screen.getByText('Photos'));
    expect([...onSelectionChange.mock.lastCall![0]].sort()).toEqual(['docs', 'photos']);
  });
});

describe('Pager', () => {
  const nav = () => screen.getByRole('navigation', { name: 'Pagination' });

  it('says which rows are showing, out loud', () => {
    render(<Pager total={240} defaultPage={5} defaultPageSize={10} />);
    const summary = within(nav()).getByText('41–50 of 240');
    // A live region: pressing next changes a table elsewhere, and a silent press tells a
    // screen reader user nothing about what happened.
    expect(summary.getAttribute('aria-live')).toBe('polite');
  });

  it('marks the page you are on', () => {
    render(<Pager total={100} defaultPage={3} defaultPageSize={10} />);
    expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBeNull();
  });

  it('steps through the pages', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pager total={100} defaultPage={2} defaultPageSize={10} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);

    // Uncontrolled, so the press above moved it: back from 3 is 2, not 1.
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(10);
  });

  it('disables the ends rather than letting them do nothing', () => {
    render(<Pager total={100} defaultPage={1} defaultPageSize={10} />);
    expect(screen.getByRole('button', { name: 'First page' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Next page' }).hasAttribute('disabled')).toBe(false);
  });

  it('keeps the reader near where they were when the page size changes', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pager total={240} defaultPage={5} defaultPageSize={10} onPageChange={onPageChange} />);
    // Page 5 of 10 starts at row 41; at 25 a page that row is on page 2, not page 1.
    await user.click(screen.getByRole('button', { name: /Rows per page/ }));
    await user.click(screen.getByRole('option', { name: '25' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it('reads as one empty page when there is nothing', () => {
    render(<Pager total={0} />);
    expect(screen.getByText('0–0 of 0')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Next page' }).hasAttribute('disabled')).toBe(true);
  });

  it('drops the chooser and the numbers when told to', () => {
    render(<Pager total={100} pageSizes={[]} numbers={false} />);
    expect(screen.queryByRole('button', { name: /Rows per page/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Page 1' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toBeNull();
  });

  it('takes a custom summary', () => {
    render(<Pager total={30} defaultPageSize={10} summary={({ to, total }) => `${to}/${total}`} />);
    expect(screen.getByText('10/30')).not.toBeNull();
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [page, setPage] = useState(1);
      return <Pager total={50} page={page} onPageChange={setPage} defaultPageSize={10} />;
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(screen.getByText('11–20 of 50')).not.toBeNull();
  });

  it('takes its defaults from the provider', () => {
    render(
      <GrangeProvider defaultProps={{ Pager: { pageSize: 25, numbers: false } }}>
        <Pager total={100} />
      </GrangeProvider>,
    );
    expect(screen.getByText('1–25 of 100')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Page 1' })).toBeNull();
  });
});
