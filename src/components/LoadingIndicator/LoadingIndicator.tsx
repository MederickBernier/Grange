import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { useProgressBar } from 'react-aria';
import { resolveSlotClass, useComponentConfig, type SlotOverrides } from '../../config/config';
import { defaultShapes, loadingIndicator as spec } from './specs';
import { morph, resample } from './polygon';
import { flatten, polylinePath, shape as libraryShape, type ShapeName } from '../../shapes';
import styles from './LoadingIndicator.module.scss';

export interface LoadingIndicatorProps {
  /** Fills a container behind the shape, in the primary container colour. */
  contained?: boolean;
  /** Diameter in px. Defaults to the token's 48. */
  size?: number;
  /** Names from the M3E shape library to cycle through. */
  shapes?: readonly ShapeName[];
  /** One of aria-label or aria-labelledby, so the wait is announced. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root'>;
}

/**
 * M3 Expressive's loading indicator: a shape that morphs through a sequence while you wait.
 *
 * For a wait under about five seconds, which is what the spec reserves it for; anything longer
 * wants a progress indicator that says how far along it is.
 *
 * The shapes are the real ones: `src/shapes` is a port of the rounded-polygon geometry in
 * androidx.graphics.shapes, and all 35 of the library's shapes are available by name.
 *
 * The morph is not upstream's `Morph`, which matches the features of two shapes to decide which
 * corner becomes which. Each outline is flattened and resampled to the same number of points
 * instead, and those are interpolated — which is why a shape with eight corners can turn into one
 * with three without a side collapsing, and why the drawn path is a polyline: by then the samples
 * are carrying the curvature.
 */
export function LoadingIndicator(props: LoadingIndicatorProps) {
  const { slots } = useComponentConfig('LoadingIndicator');
  const {
    contained = false,
    size = spec.size,
    shapes = defaultShapes,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const reduceMotion = useReducedMotion();
  const { progressBarProps } = useProgressBar({ ...aria, isIndeterminate: true });
  const [step, setStep] = useState(0);
  const [t, setT] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    // With reduced motion the indicator holds its first shape: still legible, not moving.
    if (reduceMotion || shapes.length < 2) return;

    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      if (elapsed >= spec.morphMs) {
        start = now;
        setStep((s) => (s + 1) % shapes.length);
        setT(0);
      } else {
        setT(elapsed / spec.morphMs);
      }
      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [reduceMotion, shapes.length]);

  // The library's shapes fill the unit square, so this places one in the middle of the canvas at
  // the token's active size.
  const drawn = size * (spec.activeSize / spec.size);
  const inset = (size - drawn) / 2;
  const place = (points: ReturnType<typeof flatten>) =>
    points.map((p) => ({ x: inset + p.x * drawn, y: inset + p.y * drawn }));

  const outline = (name: ShapeName | undefined) =>
    resample(place(flatten(libraryShape(name ?? defaultShapes[0]))), spec.samples);

  const from = outline(shapes[step]);
  const to = outline(shapes[(step + 1) % shapes.length]);
  // Eased, so each shape settles rather than arriving at a constant rate.
  const eased = t < 0.5 ? 2 * t * t : 1 - (1 - t) * (1 - t) * 2;
  const points = from.length === to.length ? morph(from, to, eased) : from;

  return (
    <div
      {...progressBarProps}
      className={resolveSlotClass(
        'grange-loading-indicator',
        styles.indicator,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={{ ['--_size' as string]: `${size}px`, ...style }}
      data-contained={contained || undefined}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className={styles.canvas}>
        <path className={styles.shape} d={polylinePath(points)} />
      </svg>
    </div>
  );
}
