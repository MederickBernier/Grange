import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { useProgressBar } from 'react-aria';
import { resolveSlotClass, useComponentConfig, type SlotOverrides } from '../../config/config';
import { defaultShapes, loadingIndicator as spec } from './specs';
import { morph, regularPolygon, resample, roundedPath } from './polygon';
import styles from './LoadingIndicator.module.scss';

export interface LoadingIndicatorProps {
  /** Fills a container behind the shape, in the primary container colour. */
  contained?: boolean;
  /** Diameter in px. Defaults to the token's 48. */
  size?: number;
  /** Side counts to cycle through. Defaults to a run of regular polygons. */
  shapes?: readonly number[];
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
 * The morph is the real mechanism, interpolating corresponding points between two polygons, but
 * over the regular shapes only. The full 35-shape library is defined in
 * androidx.graphics.shapes as rounded polygons with per-corner rounding, and reproducing those
 * means porting that library.
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

  const radius = (size * (spec.activeSize / spec.size)) / 2;
  const center = { x: size / 2, y: size / 2 };

  const from = resample(regularPolygon(shapes[step] ?? 4, radius), spec.samples);
  const to = resample(regularPolygon(shapes[(step + 1) % shapes.length] ?? 4, radius), spec.samples);
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
        <path className={styles.shape} d={roundedPath(points, spec.rounding, center)} />
      </svg>
    </div>
  );
}
