import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropDownTree, MultiSelectTree, Stack, TransferList, TreeItem, type TransferItem } from '../src';

/**
 * A tree in a field, and two lists with buttons between them.
 *
 * The drop-down tree is `Select` with a tree where the list goes, assembled from the parts
 * rather than written again: the trigger wears the text field's chrome, the surface is the
 * shared `Popover`, the contents are `TreeView`. It says `aria-haspopup="dialog"` rather than
 * `listbox`, because a tree is not a list of options and promising one would be a lie.
 *
 * The transfer list is Kendo's ListBox — the part `SelectableList` does not already cover. Its
 * one real decision is that **both sides keep the order of `items`**: a transfer list is
 * usually a set of options in a meaningful order, and moving one back should return it to its
 * place rather than to the end. A list whose order is the user's to choose is `Sortable`.
 *
 * Every move is announced. Pressing "move right" changes two lists at once and leaves focus
 * where it was, so without a live region the press is silent.
 */
const meta: Meta = {
  title: 'Components/Drop-down Tree and Transfer List',
  parameters: { layout: 'padded' },
};
export default meta;

const folders = (
  <>
    <TreeItem key="documents" title="Documents">
      <TreeItem key="cv">CV.pdf</TreeItem>
      <TreeItem key="letters" title="Letters">
        <TreeItem key="bank">Bank.docx</TreeItem>
        <TreeItem key="landlord">Landlord.docx</TreeItem>
      </TreeItem>
    </TreeItem>
    <TreeItem key="photos" title="Photos">
      <TreeItem key="trip">Trip</TreeItem>
      <TreeItem key="family">Family</TreeItem>
    </TreeItem>
    <TreeItem key="readme">README.md</TreeItem>
  </>
);

/** One choice. The field closes on it, as a select does. */
export const SingleChoice: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <DropDownTree label="Folder" defaultSelectedKeys={['bank']} defaultExpandedKeys={['documents', 'letters']}>
        {folders}
      </DropDownTree>
    </div>
  ),
};

/** Several. The field stays open, because the next choice is the point of it. */
export const SeveralChoices: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <MultiSelectTree
        label="Folders"
        defaultSelectedKeys={['cv', 'trip']}
        defaultExpandedKeys={['documents']}
        supportingText="Stays open while you pick"
      >
        {folders}
      </MultiSelectTree>
    </div>
  ),
};

/** Outlined, with an error. */
export const Outlined: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <DropDownTree variant="outlined" label="Folder" error errorText="Pick a folder" placeholder="None yet">
        {folders}
      </DropDownTree>
    </div>
  ),
};

const days: TransferItem[] = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday', disabled: true },
];

/** Two lists and four buttons. Saturday is disabled, so "move all" leaves it behind. */
export const Transfer: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<string[]>(['wed']);
    return (
      <Stack gap="md">
        <TransferList
          items={days}
          value={value}
          onChange={setValue}
          sourceLabel="Available days"
          targetLabel="Working days"
        />
        <span className="sb-label">Chosen: {value.join(', ') || 'none'}</span>
      </Stack>
    );
  },
};

/** Without the move-all buttons, for a list where moving everything would be a mistake. */
export const OneAtATime: StoryObj = {
  render: () => <TransferList items={days.slice(0, 4)} defaultValue={['mon']} allowMoveAll={false} />,
};
