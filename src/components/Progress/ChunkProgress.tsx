import { forwardRef, type CSSProperties } from 'react';
import { useProgressBar } from 'react-aria';
import {
  resolveSlotClass,
  useComponentConfig,
  type ProgressSlot,
  type SlotOverrides,
} from '../../config/config';
import { linearProgress as spec } from './specs';
import styles from './Progress.module.scss';

export interface ChunkProgressProps {
  /** Progress from 0 to 1. */
  value?: number;
  /** How many segments the bar is divided into. */
  chunks?: number;
  /**
   * Fills a segment only once it is wholly complete, rather than part-filling the one in
   * progress. On by default: the point of a chunked bar is that it counts whole steps, and a
   * half-lit chunk is a smooth bar wearing stripes.
   */
  whole?: boolean;
  /** The bar's thickness, px. */
  thickness?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ProgressSlot>;
}

/**
 * A progress bar in discrete segments — the catalog's ChunkProgressBar.
 *
 * **It is still one progress bar, not a row of them.** `useProgressBar` reports a single value
 * and the segments are a drawing of it: a screen reader hears "62%", once, rather than being
 * read eight boxes. The segments are `aria-hidden` for the same reason the gauges' arcs are.
 *
 * Whole chunks by default. A chunked bar exists to count steps — three of five files, four of
 * ten pages — and part-filling the chunk in progress turns it back into a smooth bar with
 * stripes drawn on it. `whole={false}` is there for the case where the chunks really are only
 * a texture.
 */
export const ChunkProgress = forwardRef<HTMLDivElement, ChunkProgressProps>(
  function ChunkProgress(props, ref) {
    const { defaults, slots } = useComponentConfig('ChunkProgress');
    const {
      value,
      chunks = defaults?.chunks ?? 5,
      whole = defaults?.whole ?? true,
      thickness = defaults?.thickness ?? spec.thickness,
      className,
      classNames,
      style,
      ...aria
    } = props;

    const count = Math.max(1, Math.trunc(chunks));
    const clamped = value == null ? undefined : Math.min(1, Math.max(0, value));

    const { progressBarProps } = useProgressBar({
      ...aria,
      value: clamped,
      minValue: 0,
      maxValue: 1,
      isIndeterminate: clamped == null,
    });

    const slot = (name: ProgressSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

    /*
     * How much of each segment is lit. With whole chunks the one in progress is dark until it
     * is finished, which is what makes the bar count rather than slide.
     */
    const filledFor = (index: number): number => {
      if (clamped == null) return 0;
      const exact = clamped * count - index;
      if (whole) return exact >= 1 ? 1 : 0;
      return Math.min(1, Math.max(0, exact));
    };

    return (
      <div
        {...progressBarProps}
        ref={ref}
        className={slot('root', 'grange-chunk-progress', styles.chunked)}
        style={style}
        data-indeterminate={clamped == null || undefined}
      >
        {/* A drawing of the value the bar already reports, so it says nothing of its own. */}
        <span className={styles.chunks} aria-hidden="true" style={{ height: thickness }}>
          {Array.from({ length: count }, (_, index) => (
            <span key={index} className={styles.chunk} data-filled={filledFor(index) === 1 || undefined}>
              {filledFor(index) > 0 && filledFor(index) < 1 && (
                <span className={styles.chunkPart} style={{ width: `${filledFor(index) * 100}%` }} />
              )}
            </span>
          ))}
        </span>
      </div>
    );
  },
);
