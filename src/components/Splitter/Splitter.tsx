import {
  isValidElement,
  useCallback,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useLocale, useMove } from 'react-aria';
import { flattenChildren, useControlledState } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type SplitterSlot,
} from '../../config/config';
import { moveBoundary } from './resize';
import { splitter as spec } from './specs';
import styles from './Splitter.module.scss';

export interface SplitterPaneProps {
  children?: ReactNode;
  /** The smallest this pane may be dragged to, px. */
  min?: number;
  /** The largest, px. */
  max?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * One pane. Described rather than rendered, because the splitter needs the limits before it can
 * work out where a boundary is allowed to land.
 */
export function SplitterPane(_props: SplitterPaneProps): ReactElement | null {
  return null;
}

export interface SplitterProps {
  /** SplitterPane children, two or more. */
  children?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  /**
   * The panes' sizes as percentages of the container, one per pane, summing to 100. Percentages
   * rather than pixels on purpose: the split survives the container being resized, which a set
   * of pixel widths does not.
   */
  sizes?: number[];
  defaultSizes?: number[];
  onSizesChange?: (sizes: number[]) => void;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SplitterSlot>;
}

const isPane = (child: ReactNode): child is ReactElement<SplitterPaneProps> =>
  isValidElement(child) && child.type === SplitterPane;

/**
 * Resizable panes with a draggable boundary between them.
 *
 * **The boundary is a `separator` with `aria-valuenow`, and it is focusable.** That is the whole
 * accessibility story of a splitter, and the usual implementation has none of it: a `div` with
 * a mousedown handler cannot be moved without a pointer, and announces nothing. Here the arrows
 * move the boundary, Home and End take it to its limits, and the value is read out as a
 * percentage as it moves.
 *
 * Sizes are percentages, which matters more than it looks. A splitter holding pixel widths is
 * correct exactly once: resize the window and the panes no longer fill it, or overflow it.
 *
 * Pane limits are in pixels, because that is how a minimum is actually known — "this toolbar
 * needs 180px" — so they are converted against the live container size on every move rather
 * than being baked into the percentages.
 */
export function Splitter(props: SplitterProps) {
  const { defaults, slots } = useComponentConfig('Splitter');
  const {
    children,
    orientation = defaults?.orientation ?? 'horizontal',
    sizes,
    defaultSizes,
    onSizesChange,
    className,
    classNames,
    style,
  } = props;

  const panes = flattenChildren(children).filter(isPane).map((child) => child.props);
  const even = panes.length > 0 ? panes.map(() => 100 / panes.length) : [];
  const [current, setSizes] = useControlledState(sizes, defaultSizes ?? even, onSizesChange);
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontal = orientation === 'horizontal';

  const slot = (name: SplitterSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  /**
   * Turns a drag in pixels into a move in percentage points, and hands the clamping to
   * `moveBoundary`.
   *
   * The limits are given in pixels because that is how a minimum is actually known — "this
   * toolbar needs 180px" — so they are converted against the live container size on every move
   * rather than being baked into the percentages once.
   */
  const move = useCallback(
    (index: number, deltaPx: number, from: number[]) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const total = (horizontal ? rect?.width : rect?.height) ?? 0;
      // No container, no percentages: dividing by zero here would make every pane NaN wide.
      if (total === 0) return from;

      const pct = (px: number) => (px / total) * 100;
      return moveBoundary(from, index, pct(deltaPx), (i) => ({
        min: pct(panes[i]?.min ?? spec.minSize),
        max: panes[i]?.max != null ? pct(panes[i]!.max!) : Infinity,
      }));
    },
    [horizontal, panes],
  );

  return (
    <div
      ref={containerRef}
      className={slot('root', 'grange-splitter', styles.splitter)}
      style={style}
      data-orientation={orientation}
    >
      {panes.map((pane, i) => (
        <PaneAndBoundary
          key={i}
          index={i}
          pane={pane}
          size={current[i] ?? 0}
          last={i === panes.length - 1}
          horizontal={horizontal}
          paneClass={slot('pane', 'grange-splitter-pane', styles.pane)}
          barClass={slot('bar', 'grange-splitter-bar', styles.bar)}
          onMove={(deltaPx) => setSizes(move(i, deltaPx, current))}
          onJump={(to) => {
            const box = containerRef.current?.getBoundingClientRect();
            const total = (horizontal ? box?.width : box?.height) ?? 0;
            // Home and End ask for "as far as it goes", which the clamp above resolves into
            // whatever the two neighbours actually allow.
            setSizes(move(i, to === 'min' ? -total : total, current));
          }}
          value={current[i] ?? 0}
        />
      ))}
    </div>
  );
}

function PaneAndBoundary({
  index,
  pane,
  size,
  last,
  horizontal,
  paneClass,
  barClass,
  onMove,
  onJump,
  value,
}: {
  index: number;
  pane: SplitterPaneProps;
  size: number;
  last: boolean;
  horizontal: boolean;
  paneClass: string;
  barClass: string;
  onMove: (deltaPx: number) => void;
  onJump: (to: 'min' | 'max') => void;
  value: number;
}) {
  const { direction } = useLocale();
  // In RTL the panes are laid out right to left, so dragging right makes the leading pane
  // smaller rather than larger.
  const sign = horizontal && direction === 'rtl' ? -1 : 1;

  const { moveProps } = useMove({
    onMove: (event) => {
      const raw = horizontal ? event.deltaX : event.deltaY;
      // An arrow key reports a delta of 1; a pointer already moves in real pixels.
      const delta = event.pointerType === 'keyboard' ? raw * spec.keyboardStep : raw;
      onMove(delta * sign);
    },
  });

  return (
    <>
      <div
        className={`${paneClass} ${pane.className ?? ''}`.trim()}
        style={{ flexBasis: `${size}%`, ...pane.style }}
      >
        {pane.children}
      </div>
      {!last && (
        <div
          {...moveProps}
          className={barClass}
          role="separator"
          tabIndex={0}
          aria-label={`Resize pane ${index + 1}`}
          /*
           * The orientation of the separator itself, which is the opposite of the splitter's:
           * panes side by side are divided by a vertical line.
           */
          aria-orientation={horizontal ? 'vertical' : 'horizontal'}
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${Math.round(value)}%`}
          onKeyDown={(event) => {
            // Home and End are not arrow keys and useMove does not handle them, but a separator
            // is expected to answer them.
            if (event.key === 'Home') {
              event.preventDefault();
              onJump('min');
            } else if (event.key === 'End') {
              event.preventDefault();
              onJump('max');
            }
          }}
        />
      )}
    </>
  );
}
