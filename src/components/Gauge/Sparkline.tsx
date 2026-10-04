import { type CSSProperties } from 'react';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
} from '../../config/config';
import { areaPath, bars, linePath, scalePoints } from './sparkline';
import { sparkline as spec } from './specs';
import styles from './Gauge.module.scss';

export interface SparklineProps {
  /** The series. Order is the x axis; there is no other. */
  values: readonly number[];
  variant?: 'line' | 'area' | 'bar';
  width?: number;
  height?: number;
  /** Pins the scale, for several sparklines that have to be comparable with each other. */
  min?: number;
  max?: number;
  /** Marks the last value with a dot, which is what a sparkline is usually read for. */
  showLast?: boolean;
  /**
   * What it says out loud. Without one it is hidden, which is the right default: a sparkline
   * nearly always sits beside the number it illustrates, and reading the shape out as well
   * would say the same thing twice, worse.
   */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root'>;
}

/**
 * A line of data the size of a line of text.
 *
 * No axes, no grid, no legend — that is the definition rather than a limitation. A sparkline is
 * a word-sized graphic that goes next to the number it is about.
 *
 * **It is hidden from assistive tech unless it is given a label**, and that is deliberate. The
 * shape is almost always a second rendering of a figure that is already on the page, and a
 * screen reader does not want "a line that goes up and then down" after hearing the number.
 * Where the sparkline really is the only carrier of the information, a label is the place to
 * say what it shows — "Sales, rising from 12 to 48 over six months" — which is a sentence the
 * component cannot write for you.
 *
 * The scaling is in `sparkline.ts` and pure: at this size an off-by-one flattens the line, and
 * a one-point series divides by zero.
 */
export function Sparkline(props: SparklineProps) {
  const { defaults, slots } = useComponentConfig('Sparkline');
  const {
    values,
    variant = defaults?.variant ?? 'line',
    width = defaults?.width ?? spec.width,
    height = defaults?.height ?? spec.height,
    min,
    max,
    showLast = defaults?.showLast ?? true,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const scale = { width, height, min, max };
  const points = scalePoints(values, scale);
  const last = points[points.length - 1];

  const root = resolveSlotClass(
    'grange-sparkline',
    styles.sparkline,
    ...(slots?.root ?? []),
    classNames?.root,
    className,
  );

  return (
    <svg
      className={root}
      style={style}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      data-variant={variant}
    >
      {variant === 'bar' ? (
        bars(values, scale).map((bar, i) => (
          <rect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height} className={styles.sparkBar} />
        ))
      ) : (
        <>
          {variant === 'area' && <path d={areaPath(points, height)} className={styles.sparkArea} />}
          <path
            d={linePath(points)}
            className={styles.sparkLine}
            fill="none"
            strokeWidth={spec.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {showLast && last && <circle cx={last.x} cy={last.y} r={spec.strokeWidth * 1.5} className={styles.sparkDot} />}
        </>
      )}
    </svg>
  );
}
