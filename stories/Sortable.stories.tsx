import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sortable, Stack, type SortableItem } from '../src';

/**
 * A list whose order is the user's to change.
 *
 * This is the one component here where React Aria's drag-and-drop hooks are the right answer
 * rather than a near miss, and they are used in full: `useDraggableCollection` and
 * `useDroppableCollection` with their states, `ListDropTargetDelegate` for pointer targets and
 * `ListKeyboardDelegate` for keyboard ones. All of them are re-exported from this package, so
 * an app building its own draggable collection gets the versions this library was tested
 * against.
 *
 * **It is a grid, not a listbox**, for the same reason the tree is a treegrid: a listbox option
 * cannot hold a focusable control, so a drag handle inside one is unreachable — the option is
 * the tab stop and the button inside it is not. A grid's rows have cells, which is somewhere a
 * handle can legally live.
 *
 * **Try it without a pointer.** Tab to a row, ArrowRight into its handle, press Enter: the list
 * enters a drag mode where the arrows move between drop positions, Enter drops and Escape
 * cancels. Every step is announced, because the hooks carry a live region for it. Nearly every
 * sortable list on the web can only be reordered with a mouse.
 */
const meta: Meta = {
  title: 'Components/Sortable',
  parameters: { layout: 'padded' },
};
export default meta;

const tasks: SortableItem[] = [
  { id: 'design', label: 'Capture the tokens' },
  { id: 'build', label: 'Build the components' },
  { id: 'test', label: 'Write the tests' },
  { id: 'shoot', label: 'Shoot the baselines' },
  { id: 'ship', label: 'Ship it' },
];

/** The plain case. */
export const Reorderable: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Sortable items={tasks} aria-label="Tasks, in order" />
    </div>
  ),
};

/** Controlled, so the order is the app's to keep. */
export const Controlled: StoryObj = {
  render: function Render() {
    const [order, setOrder] = useState(tasks.map((task) => task.id));
    return (
      <Stack gap="md" style={{ maxWidth: 420 }}>
        <Sortable items={tasks} order={order} onReorder={setOrder} aria-label="Tasks, in order" />
        <code className="sb-label">{order.join(' → ')}</code>
      </Stack>
    );
  },
};

/** A saved order outlives the items it was made for: missing ids drop, new ones join the end. */
export const Reconciled: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Sortable
        items={[tasks[4]!, tasks[0]!, { id: 'extra', label: 'Something new' }]}
        order={['ship', 'design', 'gone']}
        aria-label="Tasks, in order"
      />
    </div>
  ),
};
