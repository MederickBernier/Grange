import { useMemo, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { mergeProps, useButton, useFocusRing, useHover, useTree, useTreeItem } from 'react-aria';
import { Item, useTreeState, type TreeProps as AriaTreeProps, type TreeState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type TreeSlot,
} from '../../config/config';
import styles from './Tree.module.scss';

type Key = NonNullable<AriaTreeProps<unknown>['disabledKeys']> extends Iterable<infer K> ? K : never;
type CollectionChildren = AriaTreeProps<object>['children'];
type Node = TreeState<unknown>['collection'] extends Iterable<infer N> ? N : never;

export interface TreeItemProps {
  /**
   * The row's label when this item has children, and the whole item when it does not.
   *
   * A branch puts its label in `title` and its children in `children`; a leaf puts its label in
   * `children`. That split is the collection builder's, not this component's: it is how it
   * tells a row's own content apart from the rows underneath it.
   */
  children?: ReactNode;
  title?: ReactNode;
  /** An icon before the label. */
  icon?: ReactNode;
  /** What typeahead matches, when the label is not a plain string. */
  textValue?: string;
  hasChildItems?: boolean;
}

/** One node. Identified by its React `key`, as every other collection item here is. */
export const TreeItem = Item as (props: TreeItemProps) => ReactElement;

export interface TreeViewProps {
  /** TreeItem children, nested. */
  children: CollectionChildren;
  /** What the tree is called. Required in practice: a tree with no name is unidentifiable. */
  'aria-label'?: string;
  expandedKeys?: Iterable<Key>;
  defaultExpandedKeys?: Iterable<Key>;
  onExpandedChange?: (keys: Set<Key>) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Iterable<Key> | 'all';
  defaultSelectedKeys?: Iterable<Key> | 'all';
  onSelectionChange?: (keys: Set<Key> | 'all') => void;
  disabledKeys?: Iterable<Key>;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TreeSlot>;
}

/**
 * A tree, on React Aria's `useTree`.
 *
 * **It is a `treegrid`, not a `tree`, and that is the hook's decision rather than a slip.** A
 * plain `role="tree"` cannot hold interactive content in a row — a checkbox, a menu button, a
 * second action — because a treeitem's children are other treeitems. A treegrid can: each row
 * is a row with cells, so the things people actually put in tree rows have somewhere legal to
 * live. The cost is that a screen reader says "grid" where a user might expect "tree", and that
 * is the trade React Aria makes for the whole pattern working.
 *
 * What the hook brings is the part that is laborious and easy to get subtly wrong: `aria-level`,
 * `aria-posinset` and `aria-setsize` on every row, arrow keys that expand, collapse and step
 * through only the rows that are visible, typeahead across them, and selection that knows the
 * difference between a click and a keyboard range.
 *
 * Collapsed rows are not rendered. That is the collection's doing — a `TreeCollection` iterates
 * only what is expanded — and it is the right default for a tree, which is the one case where
 * the hidden subtree may be enormous.
 */
export function TreeView(props: TreeViewProps) {
  const { defaults, slots } = useComponentConfig('TreeView');
  const { className, classNames, style, selectionMode = defaults?.selectionMode ?? 'none', ...rest } = props;

  const built = useTreeState({ ...rest, selectionMode });
  const state = useMemo(() => withChildren(built), [built]);
  const ref = useRef<HTMLDivElement>(null);
  const { gridProps } = useTree({ ...rest, selectionMode }, state, ref);

  const slot = (name: TreeSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <div
      {...gridProps}
      ref={ref}
      className={slot('root', 'grange-tree', styles.tree)}
      style={style}
    >
      {rows(state).map((node) => (
        <Row
          key={node.key}
          node={node}
          state={state}
          rowClass={slot('row', 'grange-tree-row', styles.row)}
          labelClass={slot('label', 'grange-tree-label', styles.label)}
        />
      ))}
    </div>
  );
}

/**
 * Adds `getChildren` to the collection `useTreeState` builds.
 *
 * `useTreeItem` needs it, and react-stately's `TreeCollection` does not have it: the hook was
 * written against react-aria-components' collection, which does. Without it a row's siblings
 * come back empty and the hook throws reading `siblings[0].type` the moment anything below the
 * first level is rendered — so a tree works until you expand it. A child's `childNodes` is
 * exactly what the hook is asking for.
 *
 * `Object.create` rather than a spread, so the collection keeps its prototype: its iterator and
 * every `getKeyBefore`/`getKeyAfter` the keyboard navigation depends on live there.
 */
function withChildren(state: TreeState<unknown>): TreeState<unknown> {
  const collection = state.collection as TreeState<unknown>['collection'] & {
    getChildren?: (key: Key) => Iterable<Node>;
  };
  if (typeof collection.getChildren === 'function') return state;

  const patched = Object.create(collection) as typeof collection;
  patched.getChildren = (key: Key) =>
    (collection.getItem(key) as Node & { childNodes?: Iterable<Node> })?.childNodes ?? [];
  return { ...state, collection: patched };
}

/**
 * The rows to draw, in order.
 *
 * Not `[...state.collection]`: a `TreeCollection`'s iterator yields only its **root** nodes,
 * because that is the shape the collection was built from. The flattened, visible rows — the
 * roots plus the descendants of whatever is expanded — are what it keyed, so they come from
 * `getKeys`. Iterating the collection instead renders a tree that never opens, with no error
 * anywhere to say why.
 */
function rows(state: TreeState<unknown>): Node[] {
  const out: Node[] = [];
  for (const key of state.collection.getKeys()) {
    const node = state.collection.getItem(key);
    if (node) out.push(node);
  }
  return out;
}

function Row({
  node,
  state,
  rowClass,
  labelClass,
}: {
  node: Node;
  state: TreeState<unknown>;
  rowClass: string;
  labelClass: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    rowProps,
    gridCellProps,
    expandButtonProps,
    isSelected,
    isDisabled,
    isFocused,
  } = useTreeItem({ node }, state, ref);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const expandRef = useRef<HTMLSpanElement>(null);
  /*
   * expandButtonProps are button options rather than DOM props — the seventh component here
   * where spreading them onto an element would look right and do nothing. The chevron is a span
   * rather than a button on purpose: a button inside a row that is itself pressable nests two
   * controls, and useButton gives a span everything a button has except the element name.
   */
  const { buttonProps: chevronProps } = useButton({ ...expandButtonProps, elementType: 'span' }, expandRef);

  /*
   * The position among siblings, computed here rather than taken from the hook.
   *
   * `useTreeItem` derives `aria-posinset` from `node.index`, which react-stately's
   * TreeCollection numbers globally across every visible row rather than per parent — so the
   * first child of the second branch announces itself as "item 5 of 2". The hook was written
   * against react-aria-components' collection, where the index is per parent. This is the
   * second assumption of its that does not hold here; the first is `getChildren`.
   */
  const siblings = state.collection.getChildren?.(node.parentKey as never) ?? [];
  const list = node.parentKey != null ? [...siblings] : rows(state).filter((n) => n.level === 0);
  const position = list.findIndex((sibling) => sibling.key === node.key);

  const props = node.props as TreeItemProps;
  const branch = node.hasChildNodes;
  // useTreeItem reports selection and focus but not expansion, so it is read off the state,
  // which is where the collection reads it from too.
  const isExpanded = state.expandedKeys.has(node.key);

  return (
    <div
      {...mergeProps(rowProps, hoverProps, focusProps)}
      ref={ref}
      className={rowClass}
      data-expanded={isExpanded || undefined}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      // One indent per level, as a custom property so a stylesheet can restyle the row without
      // recalculating where its text should start.
      style={{ ['--grange-tree-level' as string]: node.level }}
      aria-posinset={position >= 0 ? position + 1 : undefined}
      aria-setsize={list.length || undefined}
    >
      <div {...gridCellProps} className={styles.cell}>
        {branch ? (
          <span {...chevronProps} ref={expandRef} className={styles.chevron}>
            <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
              <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
            </svg>
          </span>
        ) : (
          // A leaf keeps the chevron's space, so every label at a level starts in one column.
          <span className={styles.chevron} aria-hidden="true" />
        )}

        {props.icon && <span className={styles.icon}>{props.icon}</span>}
        <span className={labelClass}>{branch ? props.title : props.children}</span>
      </div>
    </div>
  );
}
