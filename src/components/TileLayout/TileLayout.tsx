import {
  isValidElement,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useMove } from 'react-aria';
import { flattenChildren, useControlledState } from '../../utils';
import { spaceValue, type Space } from '../Layout/Layout';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type TileLayoutSlot,
} from '../../config/config';
import { moveTile, reconcile, resizeTile, tileAt, type TileSpec } from './layout';
import { tileLayout as spec } from './specs';
import styles from './TileLayout.module.scss';

export interface TileProps {
  /** Identifies the tile in the layout. Stable across renders, or its place is lost. */
  id: string;
  /** The tile's heading, which is also its accessible name. */
  title: ReactNode;
  children?: ReactNode;
  /** Controls in the tile's header, before the move and resize handles. */
  actions?: ReactNode;
  colSpan?: number;
  rowSpan?: number;
}

/**
 * One tile. Described rather than rendered: the layout owns where each tile sits and how big it
 * is, which a tile cannot know about itself.
 */
export function Tile(_props: TileProps): ReactElement | null {
  return null;
}

export interface TileLayoutProps {
  /** Tile children. */
  children?: ReactNode;
  columns?: number;
  /** The gap between tiles: a step on the spacing scale, a number of px, or any CSS length. */
  gap?: Space;
  /** How tall one grid row is. A tile's `rowSpan` is counted in these. */
  rowHeight?: number;
  /** The order and the spans, as one array. Position in the array is position in the grid. */
  layout?: TileSpec[];
  defaultLayout?: TileSpec[];
  onLayoutChange?: (layout: TileSpec[]) => void;
  reorderable?: boolean;
  resizable?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TileLayoutSlot>;
}

const isTile = (child: ReactNode): child is ReactElement<TileProps> =>
  isValidElement(child) && child.type === Tile;

/**
 * A dashboard: a grid of cards that can be reordered and resized.
 *
 * **The layout is an order plus a span per tile, not a position per tile**, and that is the
 * decision everything else follows from. Free x/y placement lets a dashboard reach states no
 * one wants — holes in the middle, two tiles on the same cell, a tile off the end of the grid —
 * and every implementation that allows it then spends its life repairing them. An ordered list
 * laid out by CSS grid auto-placement cannot reach those states at all: growing a tile pushes
 * the others along, and the result is always a valid grid.
 *
 * **It is fully operable from the keyboard**, which is where drag-and-drop components usually
 * stop. Each tile carries a move handle and a resize handle; both are on `useMove`, so the
 * arrows do exactly what a drag does. Neither has an ARIA role that fits — there is no "move
 * handle" role, and `separator` describes a boundary on one axis rather than a tile corner —
 * so each handle carries a label that says what it does and where the tile currently is, the
 * same choice `Window` makes.
 *
 * The arithmetic is in `layout.ts` and tested there, because jsdom has no layout and a rendered
 * grid cannot be measured in it.
 */
export function TileLayout(props: TileLayoutProps) {
  const { defaults, slots } = useComponentConfig('TileLayout');
  const {
    children,
    columns = defaults?.columns ?? 4,
    gap = defaults?.gap ?? 'lg',
    rowHeight = defaults?.rowHeight ?? spec.rowHeight,
    layout,
    defaultLayout,
    onLayoutChange,
    reorderable = defaults?.reorderable ?? true,
    resizable = defaults?.resizable ?? true,
    'aria-label': ariaLabel = 'Tiles',
    className,
    classNames,
    style,
  } = props;

  const tiles = flattenChildren(children).filter(isTile).map((child) => child.props);
  const declared = useMemo(
    () =>
      tiles.map(
        (tile): TileSpec => ({ id: tile.id, colSpan: tile.colSpan ?? 1, rowSpan: tile.rowSpan ?? 1 }),
      ),
    // The tiles' own declarations only matter when the set of tiles or their defaults change.
    [tiles.map((t) => `${t.id}:${t.colSpan ?? 1}:${t.rowSpan ?? 1}`).join('|')], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [saved, setLayout] = useControlledState(layout, defaultLayout ?? declared, onLayoutChange);
  // A saved layout outlives the tiles it was saved for: dropped tiles go, new ones join the end.
  const current = useMemo(() => reconcile(saved, declared), [saved, declared]);

  const byId = new Map(tiles.map((tile) => [tile.id, tile]));
  const gridRef = useRef<HTMLUListElement>(null);

  const slot = (name: TileLayoutSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  /** The rectangle of every tile, in viewport coordinates, for the pointer hit test. */
  const rects = () =>
    [...(gridRef.current?.children ?? [])].map((child) => child.getBoundingClientRect());

  return (
    <ul
      ref={gridRef}
      className={slot('root', 'grange-tile-layout', styles.layout)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: `${rowHeight}px`,
        // Longhands, never the `gap` shorthand: React writes a style object key by key and an
        // undefined value clears the property, so a shorthand beside its longhands wipes itself.
        rowGap: spaceValue(gap),
        columnGap: spaceValue(gap),
        ...style,
      }}
      aria-label={ariaLabel}
    >
      {current.map((placed, index) => {
        const tile = byId.get(placed.id);
        if (!tile) return null;
        return (
          <TileCard
            key={placed.id}
            tile={tile}
            placed={placed}
            index={index}
            total={current.length}
            columns={columns}
            reorderable={reorderable}
            resizable={resizable}
            classes={{
              root: slot('tile', 'grange-tile', styles.tile),
              header: slot('header', 'grange-tile-header', styles.header),
              body: slot('body', 'grange-tile-body', styles.body),
            }}
            onMoveTo={(to) => setLayout(moveTile(current, index, to))}
            onResize={(dCol, dRow) => setLayout(resizeTile(current, placed.id, dCol, dRow, columns))}
            rects={rects}
          />
        );
      })}
    </ul>
  );
}

function TileCard({
  tile,
  placed,
  index,
  total,
  columns,
  reorderable,
  resizable,
  classes,
  onMoveTo,
  onResize,
  rects,
}: {
  tile: TileProps;
  placed: TileSpec;
  index: number;
  total: number;
  columns: number;
  reorderable: boolean;
  resizable: boolean;
  classes: { root: string; header: string; body: string };
  onMoveTo: (to: number) => void;
  onResize: (deltaCols: number, deltaRows: number) => void;
  rects: () => DOMRect[];
}) {
  const name = typeof tile.title === 'string' ? tile.title : tile.id;

  /*
   * Pointer dragging works in absolute coordinates, which useMove does not give: it reports
   * deltas. So the handle's starting centre is taken once and the deltas accumulate onto it,
   * and the tile under that point is the one the dragged tile moves to.
   */
  const dragging = useRef<{ x: number; y: number } | null>(null);

  const { moveProps } = useMove({
    onMoveStart: () => {
      dragging.current = null;
    },
    onMove: (event) => {
      if (event.pointerType === 'keyboard') {
        // One arrow key is one place along the order, or one row, which is `columns` places.
        const step =
          event.deltaX !== 0 ? Math.sign(event.deltaX) : Math.sign(event.deltaY) * columns;
        if (step !== 0) onMoveTo(index + step);
        return;
      }

      const boxes = rects();
      const own = boxes[index];
      if (!own) return;
      const from = dragging.current ?? { x: own.left + own.width / 2, y: own.top + own.height / 2 };
      const at = { x: from.x + event.deltaX, y: from.y + event.deltaY };
      dragging.current = at;

      const over = tileAt(boxes, at.x, at.y);
      if (over !== -1 && over !== index) {
        onMoveTo(over);
        // The tile has moved under the pointer, so the accumulated point starts again from the
        // tile it landed on rather than drifting away from it.
        dragging.current = null;
      }
    },
    onMoveEnd: () => {
      dragging.current = null;
    },
  });

  const { moveProps: resizeProps } = useMove({
    onMove: (event) => {
      if (event.pointerType === 'keyboard') {
        onResize(Math.sign(event.deltaX), Math.sign(event.deltaY));
        return;
      }
      const own = rects()[index];
      if (!own) return;
      // A pointer resize only counts when the drag has crossed most of a track, or the tile
      // would jump a column for a two-pixel wobble.
      const colWidth = own.width / placed.colSpan;
      const rowHeight = own.height / placed.rowSpan;
      const dCol = Math.abs(event.deltaX) > colWidth * 0.5 ? Math.sign(event.deltaX) : 0;
      const dRow = Math.abs(event.deltaY) > rowHeight * 0.5 ? Math.sign(event.deltaY) : 0;
      if (dCol !== 0 || dRow !== 0) onResize(dCol, dRow);
    },
  });

  return (
    <li
      className={classes.root}
      style={{ gridColumnEnd: `span ${placed.colSpan}`, gridRowEnd: `span ${placed.rowSpan}` }}
      aria-label={name}
    >
      <div className={classes.header}>
        <span className={styles.title}>{tile.title}</span>
        {tile.actions}
        {reorderable && (
          <div
            {...moveProps}
            className={styles.handle}
            tabIndex={0}
            /*
             * The position is in the label rather than only in the layout, the same way the
             * stepper says which step it is on: a tile that moves and announces nothing has
             * moved for a screen reader user only in the sense that it is now somewhere else.
             */
            aria-label={`Move ${name}, position ${index + 1} of ${total}, use the arrow keys`}
            data-handle="move"
          >
            <Glyph path="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z" />
          </div>
        )}
      </div>

      <div className={classes.body}>{tile.children}</div>

      {resizable && (
        <div
          {...resizeProps}
          className={styles.grip}
          tabIndex={0}
          aria-label={`Resize ${name}, ${placed.colSpan} by ${placed.rowSpan}`}
        />
      )}
    </li>
  );
}

const Glyph = ({ path }: { path: string }) => (
  <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
    <path d={path} />
  </svg>
);
