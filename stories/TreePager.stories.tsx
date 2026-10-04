import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, List, ListItem, Pager, Stack, TreeItem, TreeView, pageRange } from '../src';
import { HeartIcon, PersonIcon } from './icons';

/**
 * A tree and a pager: the two ways a long list stops being a long list.
 *
 * **The tree is a `treegrid`, not a `tree`, and that is React Aria's decision rather than a
 * slip.** A `role="tree"` cannot hold interactive content in a row — a treeitem's children must
 * be treeitems — so a checkbox or a menu button in a row has nowhere legal to live. A treegrid
 * gives each row cells, and the things people actually put in tree rows then work. The cost is
 * that a screen reader says "grid" where someone might expect "tree".
 *
 * **The pager's summary is a live region**, which most pagers miss: pressing "next" changes a
 * table somewhere else on the page, and without an announcement the press is silent.
 *
 * Neither has Material tokens. A tree row is a list row — `ListTokens` gives the 56px height,
 * the 16px gutters, the 24px icons and the body-large label — and the pager takes the same
 * metrics so it lines up under whatever it is paging.
 */
const meta: Meta = {
  title: 'Components/Tree and Pager',
  parameters: { layout: 'padded' },
};
export default meta;

/** A file tree. Arrow keys expand, collapse and move; typing jumps to a row. */
export const Files: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <TreeView aria-label="Files" defaultExpandedKeys={['documents']}>
        <TreeItem
          key="documents"
          title="Documents"
          icon={
            <Icon size={24}>
              <PersonIcon />
            </Icon>
          }
        >
          <TreeItem key="cv">CV.pdf</TreeItem>
          <TreeItem key="letters" title="Letters">
            <TreeItem key="bank">Bank.docx</TreeItem>
            <TreeItem key="landlord">Landlord.docx</TreeItem>
          </TreeItem>
          <TreeItem key="taxes">Taxes 2025.xlsx</TreeItem>
        </TreeItem>
        <TreeItem
          key="photos"
          title="Photos"
          icon={
            <Icon size={24}>
              <HeartIcon />
            </Icon>
          }
        >
          <TreeItem key="trip">Trip</TreeItem>
          <TreeItem key="family">Family</TreeItem>
        </TreeItem>
        <TreeItem key="readme">README.md</TreeItem>
      </TreeView>
    </div>
  ),
};

/** Selectable, one row at a time. */
export const Selectable: StoryObj = {
  render: function Render() {
    // React Aria's own key type, which unlike React 19's does not include bigint.
    const [selected, setSelected] = useState<Set<string | number> | 'all'>(new Set(['bank']));
    return (
      <Stack gap="md" style={{ maxWidth: 420 }}>
        <TreeView
          aria-label="Pick a file"
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={(keys) => setSelected(keys === 'all' ? 'all' : new Set(keys))}
          defaultExpandedKeys={['documents', 'letters']}
        >
          <TreeItem key="documents" title="Documents">
            <TreeItem key="cv">CV.pdf</TreeItem>
            <TreeItem key="letters" title="Letters">
              <TreeItem key="bank">Bank.docx</TreeItem>
              <TreeItem key="landlord">Landlord.docx</TreeItem>
            </TreeItem>
          </TreeItem>
        </TreeView>
        <span className="sb-label">
          Chosen: {selected === 'all' ? 'all' : [...selected].join(', ') || 'nothing'}
        </span>
      </Stack>
    );
  },
};

/** Multiple selection, with the keyboard ranges the hook brings. */
export const MultipleSelection: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <TreeView
        aria-label="Pick files"
        selectionMode="multiple"
        defaultSelectedKeys={['cv', 'taxes']}
        defaultExpandedKeys={['documents']}
      >
        <TreeItem key="documents" title="Documents">
          <TreeItem key="cv">CV.pdf</TreeItem>
          <TreeItem key="taxes">Taxes 2025.xlsx</TreeItem>
          <TreeItem key="notes">Notes.txt</TreeItem>
        </TreeItem>
      </TreeView>
    </div>
  ),
};

/** A pager over a real list, so the summary means something. */
export const Paged: StoryObj = {
  render: function Render() {
    const rows = useMemo(
      () => Array.from({ length: 243 }, (_, i) => `Row ${i + 1}`),
      [],
    );
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const { from, to } = pageRange(rows.length, page, size);

    return (
      <Stack gap="sm" style={{ maxWidth: 560 }}>
        <List aria-label="Rows">
          {rows.slice(from - 1, to).map((row) => (
            <ListItem key={row}>{row}</ListItem>
          ))}
        </List>
        <Pager
          total={rows.length}
          page={page}
          onPageChange={setPage}
          pageSize={size}
          onPageSizeChange={setSize}
        />
      </Stack>
    );
  },
};

/**
 * The last page is short, which is the bug every pager writes once: 25 × 10 would read
 * "241–250 of 243".
 */
export const LastPage: StoryObj = {
  render: () => <Pager total={243} defaultPage={25} defaultPageSize={10} />,
};

/** Arrows and a summary only, for a pager that has no room for numbers. */
export const Compact: StoryObj = {
  render: () => <Pager total={240} defaultPage={3} defaultPageSize={10} pageSizes={[]} numbers={false} />,
};
