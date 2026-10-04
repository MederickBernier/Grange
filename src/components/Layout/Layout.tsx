import { forwardRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { resolveSlotClass, useComponentConfig, type SlotOverrides } from '../../config/config';
import { space, type SpaceName } from './specs';
import styles from './Layout.module.scss';

/** A step on the scale, or any CSS length for the case the scale does not cover. */
export type Space = SpaceName | number | (string & {});

/**
 * Turns a gap into a CSS length.
 *
 * A name becomes the custom property, so a theme that overrides the scale moves the layout with
 * it; a number is px; anything else is passed through as the length it is. The property rather
 * than the number matters: `var(--grange-space-lg)` keeps following `theme()`, while `16px`
 * does not.
 */
export function spaceValue(value: Space | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value in space ? `var(--grange-space-${value})` : value;
}

type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch';

const ALIGN: Record<Align, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};
const JUSTIFY: Record<Justify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  stretch: 'stretch',
};

export interface StackProps {
  children?: ReactNode;
  /** Down the page by default, which is what most stacks are. */
  direction?: 'row' | 'column';
  /** A step on the scale, a number of px, or any CSS length. */
  gap?: Space;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  /** Reverses the visual order only. See the note on the component about when not to. */
  reverse?: boolean;
  /** The element to render. A list of things deserves a `ul`, a section deserves a `section`. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root'>;
}

/**
 * A row or a column with a gap.
 *
 * It is flexbox with the spacing scale attached, and that is the whole of it — the value is in
 * what it stops: a hundred one-off `display: flex; gap: 14px` rules that each disagree with the
 * components inside them by two pixels.
 *
 * `as` exists because a stack is layout and layout should not decide semantics. A list of
 * things is a `ul` whether or not it is laid out with flexbox, and a `div` wrapping `li`s is
 * worse than no stack at all.
 *
 * **`reverse` moves the pixels, not the DOM.** Tab order, screen reader order and find-in-page
 * all follow the source, so a reversed stack reads in one order and looks like another. It is
 * here because it is occasionally right — a chat log pinned to the bottom — and it is the
 * caller's job to make sure the source order is the meaningful one.
 */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(props, ref) {
  const { defaults, slots } = useComponentConfig('Stack');
  const {
    children,
    direction = defaults?.direction ?? 'column',
    gap = defaults?.gap,
    align,
    justify,
    wrap,
    reverse,
    as: As = 'div',
    className,
    classNames,
    style,
  } = props;

  const Component = As;
  return (
    <Component
      ref={ref}
      className={resolveSlotClass(
        'grange-stack',
        styles.stack,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={{
        flexDirection: reverse ? `${direction}-reverse` : direction,
        gap: spaceValue(gap),
        alignItems: align && ALIGN[align],
        justifyContent: justify && JUSTIFY[justify],
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
    >
      {children}
    </Component>
  );
});

export interface GridProps {
  children?: ReactNode;
  /**
   * A column count, which becomes that many equal tracks, or any `grid-template-columns` value
   * for the cases a count cannot express — `repeat(auto-fit, minmax(200px, 1fr))` being the one
   * worth knowing.
   */
  columns?: number | string;
  rows?: number | string;
  gap?: Space;
  columnGap?: Space;
  rowGap?: Space;
  align?: Align;
  justify?: Justify;
  /** Lays items out down the columns rather than along the rows. */
  flow?: 'row' | 'column' | 'dense';
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root'>;
}

const tracks = (value: number | string | undefined) =>
  typeof value === 'number' ? `repeat(${value}, minmax(0, 1fr))` : value;

/**
 * A grid with the spacing scale attached.
 *
 * `columns={3}` is `repeat(3, minmax(0, 1fr))` and not `repeat(3, 1fr)`, which is the bug
 * everyone writes once: a `1fr` track has an automatic minimum of its content, so one long
 * unbreakable word makes its column wider than its share and pushes the others off. The
 * `minmax(0, …)` is what makes the columns actually equal.
 */
export const Grid = forwardRef<HTMLElement, GridProps>(function Grid(props, ref) {
  const { defaults, slots } = useComponentConfig('Grid');
  const {
    children,
    columns = defaults?.columns,
    rows,
    gap = defaults?.gap,
    columnGap,
    rowGap,
    align,
    justify,
    flow,
    as: As = 'div',
    className,
    classNames,
    style,
  } = props;

  const Component = As;
  return (
    <Component
      ref={ref}
      className={resolveSlotClass(
        'grange-grid',
        styles.grid,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={{
        gridTemplateColumns: tracks(columns),
        gridTemplateRows: tracks(rows),
        /*
         * Longhands only, never `gap` alongside them. React writes a style object key by key
         * and an undefined value clears that property, so `{ gap: '…', columnGap: undefined }`
         * sets the shorthand and then wipes both of its halves — the grid came out with no
         * gaps at all and nothing in the markup said why.
         */
        rowGap: spaceValue(rowGap ?? gap),
        columnGap: spaceValue(columnGap ?? gap),
        alignItems: align && ALIGN[align],
        justifyContent: justify && JUSTIFY[justify],
        gridAutoFlow: flow,
        ...style,
      }}
    >
      {children}
    </Component>
  );
});

export interface GridItemProps {
  children?: ReactNode;
  /** How many columns to cover. `'all'` takes the whole row, whatever the grid's width is. */
  colSpan?: number | 'all';
  rowSpan?: number;
  /** One-based, as CSS grid lines are. */
  colStart?: number;
  rowStart?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/**
 * A cell that covers more than one track.
 *
 * Only needed for the cells that are not ordinary: a grid's children are placed automatically,
 * so most of them need no wrapper at all. Writing one around every child is the common mistake.
 */
export const GridItem = forwardRef<HTMLElement, GridItemProps>(function GridItem(props, ref) {
  const { children, colSpan, rowSpan, colStart, rowStart, as: As = 'div', className, style } = props;
  const Component = As;
  return (
    <Component
      ref={ref}
      className={resolveSlotClass('grange-grid-item', undefined, className)}
      /*
       * Longhands, not the `grid-column` shorthand. Two reasons, one of which cost a round:
       * a shorthand and a `gridColumnStart` in the same style object fight over which wins,
       * and React's style writer does not reliably set both halves of `grid-column: 1 / -1`
       * — the browser ended up with only the end line and the span silently did nothing.
       * The longhands are also what the props actually mean.
       */
      style={{
        // Line 1 to line -1 reaches the last track whatever the column count is, which a span
        // cannot do without knowing the count.
        gridColumnStart: colSpan === 'all' ? 1 : colStart,
        gridColumnEnd: colSpan === 'all' ? -1 : colSpan != null ? `span ${colSpan}` : undefined,
        gridRowStart: rowStart,
        gridRowEnd: rowSpan != null ? `span ${rowSpan}` : undefined,
        ...style,
      }}
    >
      {children}
    </Component>
  );
});
