import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Controlled or uncontrolled value, the usual React pattern. */
export function useControlledState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const set = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [current, set];
}

/**
 * The element children of a node, with fragments flattened away.
 *
 * `Children.toArray` flattens arrays but not fragments, so a group given
 * `<>{a}{b}{c}</>` sees one child rather than three. Anything that counts its children — a
 * connected group deciding which item is first and last, a toolbar handing out indices — then
 * gets it wrong, and nothing about it looks wrong until the corners are off.
 */
export function flattenChildren(children: ReactNode): ReactElement[] {
  const out: ReactElement[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type === Fragment) {
      out.push(...flattenChildren((child.props as { children?: ReactNode }).children));
      continue;
    }
    out.push(child);
  }
  return out;
}
