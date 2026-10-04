import { isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { flattenChildren } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type TimelineSlot,
} from '../../config/config';
import styles from './Timeline.module.scss';

export interface TimelineItemProps {
  /** The entry's headline. */
  title: ReactNode;
  /** When it happened. Rendered in a `<time>` when a `dateTime` is given. */
  time?: ReactNode;
  /** A machine-readable timestamp, which is what makes the `<time>` worth having. */
  dateTime?: string;
  /** The body. */
  children?: ReactNode;
  /** Replaces the dot on the rail. An icon, a number, anything small. */
  marker?: ReactNode;
  /** Draws the marker filled, for the entry the timeline is about. */
  current?: boolean;
}

/**
 * One entry. Described rather than rendered, because the timeline decides which side of the rail
 * it goes on and whether it is the last one — neither of which the entry can know.
 */
export function TimelineItem(_props: TimelineItemProps): ReactElement | null {
  return null;
}

export interface TimelineProps {
  /** TimelineItem children, in the order they should be read. */
  children?: ReactNode;
  orientation?: 'vertical' | 'horizontal';
  /**
   * Puts entries on alternating sides of the rail. Vertical only: a horizontal timeline has one
   * side, and asking for both would just mean two rows.
   */
  alternating?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TimelineSlot>;
}

const isItem = (child: ReactNode): child is ReactElement<TimelineItemProps> =>
  isValidElement(child) && child.type === TimelineItem;

/**
 * A sequence of things that happened, on a rail.
 *
 * Presentational, and it says so: there is no hook here and no interaction to wire. What it does
 * take seriously is the markup. The entries are an ordered list, because the order is the whole
 * content — a timeline read out of sequence is not a timeline — and the rail, the dots and the
 * connectors are `aria-hidden`, because they are a drawing of that order and reading them would
 * say the same thing twice.
 *
 * A timestamp given with `dateTime` is a real `<time>` element, which is the one piece of
 * machine-readable semantics a timeline can honestly offer.
 */
export function Timeline(props: TimelineProps) {
  const { defaults, slots } = useComponentConfig('Timeline');
  const {
    children,
    orientation = defaults?.orientation ?? 'vertical',
    alternating = defaults?.alternating ?? false,
    'aria-label': ariaLabel,
    className,
    classNames,
    style,
  } = props;

  // flattenChildren, not Children.toArray: toArray does not flatten fragments, so a timeline
  // written as <>{a}{b}</> would see one entry.
  const items = flattenChildren(children)
    .filter(isItem)
    .map((child) => child.props);
  // Alternating is a vertical idea: a horizontal rail has one side, so asking for both sides
  // there would only mean a second row.
  const sides = alternating && orientation === 'vertical';

  const slot = (name: TimelineSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <ol
      className={slot('root', 'grange-timeline', styles.timeline)}
      style={style}
      data-orientation={orientation}
      data-alternating={sides || undefined}
      aria-label={ariaLabel}
    >
      {items.map((item, i) => (
        <li
          key={i}
          className={slot('item', 'grange-timeline-item', styles.item)}
          data-side={sides ? (i % 2 === 0 ? 'start' : 'end') : undefined}
          data-current={item.current || undefined}
          data-last={i === items.length - 1 || undefined}
        >
          {/* The drawing of the order, which the list already carries. */}
          <span className={styles.rail} aria-hidden="true">
            <span className={styles.marker}>{item.marker}</span>
          </span>

          <div className={slot('content', 'grange-timeline-content', styles.content)}>
            {item.time != null &&
              (item.dateTime != null ? (
                <time className={styles.time} dateTime={item.dateTime}>
                  {item.time}
                </time>
              ) : (
                <span className={styles.time}>{item.time}</span>
              ))}
            <span className={styles.title}>{item.title}</span>
            {item.children != null && <span className={styles.body}>{item.children}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
