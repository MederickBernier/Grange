import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { resolveSlotClass, useComponentConfig, type CarouselSlot, type SlotOverrides } from '../../config/config';
import { carousel as spec, type CarouselVariant } from './specs';
import styles from './Carousel.module.scss';

export interface CarouselProps {
  /** CarouselItem children. */
  children: ReactNode;
  /**
   * Which of the spec's four layouts. `full-screen` is the vertical one, a page at a time.
   */
  variant?: CarouselVariant;
  /** Fired when the scroll settles on a different item, for building an indicator. */
  onIndexChange?: (index: number) => void;
  /** A carousel is a scrollable region, so it needs a name. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<CarouselSlot>;
}

/**
 * The carousel, in the spec's four layouts.
 *
 * This is the one component here with no React Aria hook behind it, so the behaviour is ours.
 * Most of it is deliberately the platform's: the strip is a scroll container with CSS scroll
 * snapping, which already brings touch dragging, trackpad and wheel scrolling, a scrollbar, and
 * momentum, all of it matching how the rest of the system scrolls. Reimplementing that in JS is
 * how carousels end up feeling wrong.
 *
 * What the platform does not give is added here:
 *
 * - **Keyboard.** A scrollable region needs a tab stop, and the arrow keys move a whole item
 *   rather than a few pixels. Home and End go to the ends. The step is measured off a real item,
 *   so it is right in every layout without the variant being consulted.
 * - **Mouse dragging.** Touch can drag a scroll container; a mouse cannot. This adds it with
 *   plain pointer capture rather than useMove, because useMove sets `touch-action: none`, which
 *   would take away the native touch scrolling this is imitating. A drag past a few pixels
 *   swallows the click so dragging across a link does not follow it.
 *
 * What is not here: this is a scroll region, not a listbox, so there is no selection, no
 * typeahead and no active item. An item that should be activatable carries its own control.
 */
export function Carousel(props: CarouselProps) {
  const { defaults, slots } = useComponentConfig('Carousel');
  const {
    children,
    variant = defaults?.variant ?? 'multi-browse',
    onIndexChange,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const scroller = useRef<HTMLDivElement>(null);
  const vertical = variant === 'full-screen';
  const drag = useRef({ active: false, start: 0, from: 0, travelled: 0 });

  /** One item plus the gap, measured rather than derived from the variant. */
  const step = useCallback(() => {
    const el = scroller.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el) return 0;
    if (!first) return vertical ? el.clientHeight : el.clientWidth;
    return (vertical ? first.offsetHeight : first.offsetWidth) + spec.gap;
  }, [vertical]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el) return;
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    const previous = vertical ? 'ArrowUp' : 'ArrowLeft';

    // The arrows are physical, which is what a scroll region does in every direction: the right
    // arrow moves the view to the right whether the text runs that way or not.
    let by: number;
    if (event.key === next) by = step();
    else if (event.key === previous) by = -step();
    else if (event.key === 'Home') by = -(vertical ? el.scrollHeight : el.scrollWidth);
    else if (event.key === 'End') by = vertical ? el.scrollHeight : el.scrollWidth;
    else return;
    el.scrollBy(vertical ? { top: by } : { left: by });
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    // Touch already drags this container natively, and a secondary button is not a drag.
    if (!el || event.pointerType !== 'mouse' || event.button !== 0) return;
    drag.current = {
      active: true,
      start: vertical ? event.clientY : event.clientX,
      from: vertical ? el.scrollTop : el.scrollLeft,
      travelled: 0,
    };
    el.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el || !drag.current.active) return;
    const moved = (vertical ? event.clientY : event.clientX) - drag.current.start;
    drag.current.travelled = Math.max(drag.current.travelled, Math.abs(moved));
    // Snapping fights a drag in progress, so it is suspended until the pointer is released.
    el.dataset.dragging = 'true';
    if (vertical) el.scrollTop = drag.current.from - moved;
    else el.scrollLeft = drag.current.from - moved;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el || !drag.current.active) return;
    drag.current.active = false;
    delete el.dataset.dragging;
    el.releasePointerCapture?.(event.pointerId);
    // Snapping does not reapply on its own once it is allowed again, so the strip is told to
    // settle on the nearest item explicitly.
    const size = step();
    if (size > 0) {
      const at = vertical ? el.scrollTop : el.scrollLeft;
      const to = Math.round(at / size) * size;
      el.scrollTo(vertical ? { top: to } : { left: to });
    }
  };

  /** A drag that moved anywhere should not also count as a click on whatever was under it. */
  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.travelled > spec.dragThreshold) {
      event.preventDefault();
      event.stopPropagation();
    }
    drag.current.travelled = 0;
  };

  // The index is reported once the scroll settles, which is when an indicator wants it. There is
  // no scrollend event everywhere yet, so this is a short quiet period after the last scroll.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !onIndexChange) return;
    let timer: ReturnType<typeof setTimeout>;
    let last = -1;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const size = step();
        if (size <= 0) return;
        const index = Math.round((vertical ? el.scrollTop : el.scrollLeft) / size);
        if (index !== last) {
          last = index;
          onIndexChange(index);
        }
      }, 100);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
    };
  }, [onIndexChange, step, vertical]);

  return (
    <div
      {...aria}
      ref={scroller}
      role="group"
      aria-roledescription="carousel"
      tabIndex={0}
      className={resolveSlotClass(
        'grange-carousel',
        styles.carousel,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={
        {
          '--grange-carousel-gap': `${spec.gap}px`,
          '--grange-carousel-corner': `${spec.corner}px`,
          ...style,
        } as CSSProperties
      }
      data-variant={variant}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}

export interface CarouselItemProps {
  children: ReactNode;
  /**
   * Multi-browse draws three sizes. The first item is the large one by default and the rest
   * shrink, which this overrides for an item that should be a given size whatever its position.
   */
  size?: 'large' | 'medium' | 'small';
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<CarouselSlot>;
}

/** One item in the strip. It is a plain box, so any content goes in it. */
export function CarouselItem({ children, size, className, style, classNames }: CarouselItemProps) {
  const { slots } = useComponentConfig('CarouselItem');
  return (
    <div
      className={resolveSlotClass(
        'grange-carousel-item',
        styles.item,
        ...(slots?.item ?? []),
        classNames?.item,
        className,
      )}
      style={style}
      data-size={size}
    >
      {children}
    </div>
  );
}
