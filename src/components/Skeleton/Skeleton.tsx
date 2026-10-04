import { forwardRef, type CSSProperties } from 'react';
import {
  resolveSlotClass,
  useComponentConfig,
  type SkeletonSlot,
  type SlotOverrides,
} from '../../config/config';
import { skeleton as spec, type SkeletonAnimation, type SkeletonShape } from './specs';
import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  /**
   * `text` draws one or more lines at a text line's height, `rect` a block, `circle` a disc the
   * size of its height. Text is the default because it is what most loading content is.
   */
  shape?: SkeletonShape;
  /** How many lines, for `text`. The last one is short, as a paragraph's last line is. */
  lines?: number;
  /**
   * Any CSS length or percentage. Defaults to filling the row, and is ignored by `circle`,
   * whose height decides both of its dimensions — a circle with a width is an ellipse.
   */
  width?: number | string;
  /** Any CSS length. For `text` it is the height of one line. */
  height?: number | string;
  /** Overrides the corner, for a `rect` that has to match the thing it stands in for. */
  radius?: number | string;
  /**
   * The sweep, the fade, or nothing. All three hold still under `prefers-reduced-motion`, which
   * is not a nicety: a looping shimmer is exactly the kind of repetitive motion that setting
   * exists to stop.
   */
  animation?: SkeletonAnimation;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SkeletonSlot>;
}

const length = (value: number | string | undefined) => (typeof value === 'number' ? `${value}px` : value);

/**
 * The shape of content that has not arrived yet.
 *
 * **It is hidden from assistive tech, always, and that is the design.** A screen reader has
 * nothing to gain from being told the shape of absent text; what it needs is to be told that
 * something is loading, once, by the region that is doing the loading. So a skeleton is
 * `aria-hidden` with no way to label it, and the thing it fills should carry `aria-busy="true"`
 * and announce its own progress. Offering a `label` prop here would be offering a way to make
 * the page worse.
 *
 * The animation stops under reduced motion rather than being replaced by a slower one. A
 * shimmer is a loop with no end state, which is the case that setting is most clearly about.
 */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(props, ref) {
  const { defaults, slots } = useComponentConfig('Skeleton');
  const {
    shape = defaults?.shape ?? 'text',
    lines = 1,
    width,
    height,
    radius,
    animation = defaults?.animation ?? 'shimmer',
    className,
    classNames,
    style,
  } = props;

  const slot = (name: SkeletonSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const bar = (key: number, barWidth: string | undefined) => (
    <span
      key={key}
      className={slot('bar', 'grange-skeleton-bar', styles.bar)}
      style={{ width: barWidth, height: length(height), borderRadius: length(radius) }}
    />
  );

  const count = shape === 'text' ? Math.max(1, Math.trunc(lines)) : 1;

  return (
    <span
      ref={ref}
      className={slot('root', 'grange-skeleton', styles.skeleton)}
      // A circle takes its width from its height, so a width here would only make it an ellipse.
      style={{ width: shape === 'circle' ? undefined : length(width), ...style }}
      data-shape={shape}
      data-animation={animation}
      // Not labellable on purpose: see the component's own documentation.
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) =>
        // The last line of a paragraph is short. One line is not a paragraph, so it stays full.
        bar(i, count > 1 && i === count - 1 ? `${spec.lastLineWidth * 100}%` : undefined),
      )}
    </span>
  );
});
