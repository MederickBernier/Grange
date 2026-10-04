import { useMemo, useRef, type CSSProperties, type Key as ReactKey, type ReactNode } from 'react';
import {
  ListDropTargetDelegate,
  ListKeyboardDelegate,
  mergeProps,
  useDraggableCollection,
  useDraggableItem,
  useDropIndicator,
  useDroppableCollection,
  useButton,
  useFocusRing,
  useGridList,
  useGridListItem,
} from 'react-aria';
import {
  Item,
  useDraggableCollectionState,
  useDroppableCollectionState,
  useListState,
  type DraggableCollectionState,
  type DroppableCollectionState,
  type ListState,
} from 'react-stately';
import { useControlledState } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type SortableSlot,
} from '../../config/config';
import { moveToEnd, reorder } from './reorder';
import styles from './Sortable.module.scss';

type Key = string;
type Node = ListState<unknown>['collection'] extends Iterable<infer N> ? N : never;

export interface SortableItem {
  id: Key;
  label: ReactNode;
  /** What typeahead matches, when the label is not a plain string. */
  textValue?: string;
}

export interface SortableProps {
  /** The items, in their current order. */
  items: readonly SortableItem[];
  /** The order, as ids. Leave it out and the component keeps its own. */
  order?: readonly Key[];
  defaultOrder?: readonly Key[];
  onReorder?: (order: Key[]) => void;
  /** What the list is called. Read out, so it should say what the order means. */
  'aria-label'?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SortableSlot>;
}

/**
 * A list whose order is the user's to change — by dragging, and by keyboard.
 *
 * This is the one component in the library where React Aria's drag-and-drop hooks are the right
 * answer rather than a near miss, and they are here in full: `useDraggableCollection` and
 * `useDroppableCollection` with their states, `ListDropTargetDelegate` for pointer targets and
 * `ListKeyboardDelegate` for the keyboard ones.
 *
 * **The keyboard path is the reason.** Nearly every sortable list on the web can only be
 * reordered with a pointer, which means it cannot be reordered at all by a good number of
 * people. Here each row has a drag button: Tab to the row, ArrowRight into the handle, press
 * it, and the list enters a drag mode where the arrows move between drop positions, Enter
 * drops and Escape cancels — announced throughout, because the hooks carry a live region for
 * exactly this.
 *
 * The reordering arithmetic is in `reorder.ts`, kept pure: the cases that bite are dropping a
 * run of items into a gap inside itself and the indices shifting the moment the first item is
 * removed, and neither needs a drag to test.
 */
export function Sortable(props: SortableProps) {
  const { slots } = useComponentConfig('Sortable');
  const {
    items,
    order,
    defaultOrder,
    onReorder,
    disabled,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const [current, setOrder] = useControlledState<readonly Key[]>(order, defaultOrder ?? ids, (next) =>
    onReorder?.([...next]),
  );

  /*
   * The order outlives the items it was made for, so it is reconciled on every render: ids that
   * have gone are dropped and new ones join the end. Without this a removed item leaves a hole
   * the list renders as nothing, and a new one never appears at all.
   */
  const ordered = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    const kept = current.filter((id) => byId.has(id));
    const known = new Set(kept);
    return [...kept, ...ids.filter((id) => !known.has(id))].map((id) => byId.get(id)!);
  }, [current, items, ids]);

  const state = useListState({
    items: ordered,
    children: (item: SortableItem) => (
      <Item key={item.id} textValue={item.textValue}>
        {item.label}
      </Item>
    ),
    selectionMode: 'none',
  });

  const ref = useRef<HTMLUListElement>(null);
  /*
   * A grid list, not a listbox, and for the same reason the tree is a treegrid: a listbox
   * option cannot hold interactive content, so a drag handle inside one is unreachable by Tab —
   * the option is the tab stop and the button inside it is not. A grid list's rows have cells,
   * which is where a handle can legally live and where the keyboard can actually get to it.
   */
  const { gridProps } = useGridList({ 'aria-label': ariaLabel }, state, ref);

  const dragState = useDraggableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    isDisabled: disabled,
    // Plain text, because the only consumer is this list. A sortable that accepts drops from
    // elsewhere would need a real type, and would be a different component.
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
  });
  useDraggableCollection({}, dragState, ref);

  const dropState = useDroppableCollectionState({
    collection: state.collection,
    selectionManager: state.selectionManager,
    isDisabled: disabled,
    acceptedDragTypes: ['text/plain'],
    // Only its own items: a drop from outside has no id this list knows.
    getDropOperation: (_target, _types, operations) => (operations.includes('move') ? 'move' : 'cancel'),
    onReorder: (event) => {
      const keys = [...event.keys].map(String);
      const target = String(event.target.key);
      setOrder(
        event.target.dropPosition === 'after' && target === ordered[ordered.length - 1]?.id
          ? moveToEnd(
              ordered.map((i) => i.id),
              keys,
            )
          : reorder(
              ordered.map((i) => i.id),
              keys,
              target,
              event.target.dropPosition === 'before' ? 'before' : 'after',
            ),
      );
    },
  });

  const { collectionProps } = useDroppableCollection(
    {
      keyboardDelegate: new ListKeyboardDelegate({
        collection: state.collection,
        disabledKeys: state.disabledKeys,
        ref,
      }),
      dropTargetDelegate: new ListDropTargetDelegate(state.collection, ref),
    },
    dropState,
    ref,
  );

  const slot = (name: SortableSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const rows = [...state.collection];

  return (
    <ul
      {...mergeProps(gridProps, collectionProps)}
      ref={ref}
      className={slot('root', 'grange-sortable', styles.sortable)}
      style={style}
    >
      {rows.map((node, i) => (
        <Row
          key={node.key}
          node={node}
          state={state}
          dragState={dragState}
          dropState={dropState}
          rowClass={slot('row', 'grange-sortable-row', styles.row)}
          // A gap after the last row as well, or there is nowhere to drop something at the end.
          last={i === rows.length - 1}
        />
      ))}
    </ul>
  );
}

function Row({
  node,
  state,
  dragState,
  dropState,
  rowClass,
  last,
}: {
  node: Node;
  state: ListState<unknown>;
  dragState: DraggableCollectionState;
  dropState: DroppableCollectionState;
  rowClass: string;
  last: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { rowProps, gridCellProps, isFocused } = useGridListItem({ node }, state, ref);
  const { dragProps, dragButtonProps } = useDraggableItem({ key: node.key, hasDragButton: true }, dragState);
  const { focusProps, isFocusVisible } = useFocusRing();
  const dragging = dragState.isDragging(node.key);

  return (
    <>
      <DropGap target={{ type: 'item', key: node.key, dropPosition: 'before' }} state={dropState} />

      <li
        {...mergeProps(rowProps, dragProps, focusProps)}
        ref={ref}
        className={rowClass}
        data-dragging={dragging || undefined}
        data-focused={isFocused || undefined}
        data-focus-visible={isFocusVisible || undefined}
      >
        {/*
          An explicit drag affordance, which is what `hasDragButton` tells the hook to expect.
          Without one, starting a drag from the keyboard competes with the row's own actions;
          with one, the button is a plain focus stop that says what it does.
        */}
        <div {...gridCellProps} className={styles.cell}>
          <DragButton options={dragButtonProps} />
          <span className={styles.label}>{node.rendered}</span>
        </div>
      </li>

      {last && <DropGap target={{ type: 'item', key: node.key, dropPosition: 'after' }} state={dropState} />}
    </>
  );
}

/**
 * The gap between two rows, where a drop lands.
 *
 * Rendered only while it is a live target: `isHidden` means the hook has decided this gap is
 * not one, and leaving it in the DOM would put an empty announced element between every pair
 * of rows.
 */
function DropGap({
  target,
  state,
}: {
  target: { type: 'item'; key: ReactKey; dropPosition: 'before' | 'after' };
  state: DroppableCollectionState;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { dropIndicatorProps, isHidden, isDropTarget } = useDropIndicator(
    { target: target as never },
    state,
    ref,
  );
  if (isHidden) return null;

  return (
    <li {...dropIndicatorProps} ref={ref} className={styles.gap} data-active={isDropTarget || undefined} />
  );
}

function DragButton({ options }: { options: Parameters<typeof useButton>[0] }) {
  const ref = useRef<HTMLButtonElement>(null);
  /*
   * dragButtonProps are button options rather than DOM props — the eighth component here where
   * spreading a hook's button props straight onto an element would look right and do nothing.
   */
  const { buttonProps } = useButton(options, ref);
  return (
    <button {...buttonProps} ref={ref} type="button" className={styles.handle}>
      <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
        <path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z" />
      </svg>
    </button>
  );
}
