/**
 * The tree edits behind `FilterBuilder`, kept pure.
 *
 * A filter is a tree, and every edit is "replace the node at this path". Doing that in place
 * inside a component is where these things go wrong: a group keeps a stale copy of a child, or
 * a removal leaves an empty group that then matches everything. Paths and copies make it
 * ordinary arithmetic.
 */
import { isComposite, type CompositeFilter, type Filter, type FilterDescriptor } from '../../data/query';

/** Where a node sits: the index to take at each level, from the root down. */
export type Path = number[];

export const emptyGroup = (logic: 'and' | 'or' = 'and'): CompositeFilter => ({ logic, filters: [] });

/** The node at a path, or undefined if the path has gone stale. */
export function nodeAt(root: CompositeFilter, path: Path): Filter | undefined {
  let node: Filter | undefined = root;
  for (const index of path) {
    if (node == null || !isComposite(node)) return undefined;
    node = node.filters[index];
  }
  return node;
}

/**
 * Replaces the node at a path, copying every group on the way down.
 *
 * `undefined` removes it. The copies are the point: a React state update that mutates a nested
 * group in place gives back an object that is `===` what it was, and nothing re-renders.
 */
export function replaceAt(root: CompositeFilter, path: Path, value: Filter | undefined): CompositeFilter {
  if (path.length === 0) return (value as CompositeFilter) ?? emptyGroup(root.logic);

  const [index, ...rest] = path;
  const filters = [...root.filters];
  const child = filters[index!];
  if (!child) return root;

  if (rest.length === 0) {
    if (value === undefined) filters.splice(index!, 1);
    else filters[index!] = value;
  } else {
    if (!isComposite(child)) return root;
    filters[index!] = replaceAt(child, rest, value);
  }

  return { ...root, filters };
}

/** Adds a node to the end of the group at a path. */
export function appendAt(root: CompositeFilter, path: Path, value: Filter): CompositeFilter {
  const target = nodeAt(root, path);
  if (!target || !isComposite(target)) return root;
  return replaceAt(root, path, { ...target, filters: [...target.filters, value] });
}

/**
 * Drops groups that have nothing in them, from the leaves up.
 *
 * An empty group matches everything, so one left behind by a removal silently widens the
 * filter. The root is kept whatever happens, because the builder needs something to draw.
 */
export function prune(root: CompositeFilter): CompositeFilter {
  const filters = root.filters
    .map((child) => (isComposite(child) ? prune(child) : child))
    .filter((child) => !isComposite(child) || child.filters.length > 0);
  return { ...root, filters };
}

/** A row with sensible defaults for a field, for the "add condition" button. */
export function newCondition(field: string, operator: FilterDescriptor['operator']): FilterDescriptor {
  return { field, operator, value: '' };
}
