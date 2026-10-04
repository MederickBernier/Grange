import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

/**
 * The label of every node in a tree, by key.
 *
 * A field that holds a tree in a popover has to name what was chosen, and the only place that
 * name exists is the tree's own children — a nested React structure rather than a flat list. So
 * it is walked once, here, outside the component, which also makes it testable without
 * rendering anything.
 *
 * A branch's label is its `title` and a leaf's is its `children`, because that is the split the
 * collection builder makes: a branch's `children` are the rows underneath it.
 */
export function treeLabels(children: ReactNode): Map<string | number, ReactNode> {
  const out = new Map<string | number, ReactNode>();

  const walk = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      const element = child as ReactElement<{ title?: ReactNode; children?: ReactNode }>;

      // A fragment is not an item; the items are inside it. Children.forEach does not flatten.
      if (element.type === Fragment) {
        walk(element.props.children);
        return;
      }

      const { title, children: inner } = element.props;
      if (element.key != null) out.set(element.key, title ?? inner);
      // Only a branch has rows underneath it, and a branch is what carries a title.
      if (title != null) walk(inner);
    });
  };

  walk(children);
  return out;
}
