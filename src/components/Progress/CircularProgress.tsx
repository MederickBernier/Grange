import { forwardRef, type CSSProperties } from 'react';
import { useProgressBar } from 'react-aria';
import {
  resolveSlotClass,
  useComponentConfig,
  type ProgressSlot,
  type SlotOverrides,
} from '../../config/config';
import { circularProgress as spec } from './specs';
import { circularWavePath } from './wave';
import styles from './Progress.module.scss';

export interface CircularProgressProps {
  /** Progress from 0 to 1. Leave it out for an indeterminate spinner. */
  value?: number;
  /** The M3 Expressive wavy ring. Compose exposes this as a separate composable. */
  wavy?: boolean;
  /** Diameter in px. Defaults to 40, or 48 when wavy, since the wave needs room to swing out. */
  size?: number;
  /** One of aria-label or aria-labelledby is needed, so the spinner is announced with a name. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ProgressSlot>;
}

/** The arc an indeterminate spinner sweeps while it rotates. */
const INDETERMINATE_SWEEP = 0.75;

/**
 * A circular progress indicator. The determinate ring starts at twelve o'clock and runs
 * clockwise, leaving the token's gap between the active arc and the rest of the track.
 *
 * The wavy ring is drawn by walking the circle and letting the radius rise and fall, with the
 * wavelength measured along the arc so the crests stay evenly spaced at any diameter.
 */
export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  function CircularProgress(props, ref) {
    const { defaults, slots } = useComponentConfig('CircularProgress');
    const {
      value,
      wavy = defaults?.wavy ?? false,
      size,
      className,
      classNames,
      style,
      ...aria
    } = props;

    const isIndeterminate = value === undefined;
    const clamped = isIndeterminate ? INDETERMINATE_SWEEP : Math.min(1, Math.max(0, value));
    const { progressBarProps } = useProgressBar({
      ...aria,
      value: isIndeterminate ? 0 : clamped,
      minValue: 0,
      maxValue: 1,
      isIndeterminate,
    });

    const box = size ?? (wavy ? spec.waveSize : spec.size);
    const center = box / 2;
    // Keep the stroke, and the wave's full swing, inside the box.
    const inset = spec.thickness / 2 + (wavy ? spec.waveAmplitude : 0);
    const radius = center - inset;
    const circumference = 2 * Math.PI * radius;
    // The gap between the active arc and the remaining track, as a fraction of the circle.
    const gap = radius > 0 ? spec.trackGap / circumference : 0;

    const slot = (name: ProgressSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    const wavePath = (sweep: number) =>
      circularWavePath({
        radius,
        amplitude: spec.waveAmplitude,
        wavelength: spec.waveWavelength,
        sweep,
        centerX: center,
        centerY: center,
      });

    // Determinate leaves a gap at both ends of the remaining track; indeterminate has no track.
    const trackSweep = Math.max(0, 1 - clamped - gap * 2);

    return (
      <div
        {...progressBarProps}
        ref={ref}
        className={slot('root', 'grange-circular-progress', styles.circular)}
        style={{
          ['--_thickness' as string]: `${spec.thickness}px`,
          ['--_size' as string]: `${box}px`,
          ...style,
        }}
        data-wavy={wavy || undefined}
        data-indeterminate={isIndeterminate || undefined}
      >
        <svg className={styles.canvas} viewBox={`0 0 ${box} ${box}`} aria-hidden="true">
          <g className={styles.spin}>
            {!isIndeterminate &&
              trackSweep > 0 &&
              (wavy ? (
                <path
                  className={slot('track', 'grange-progress-track', styles.track)}
                  // Rotated to start after the active arc and its gap.
                  transform={`rotate(${(clamped + gap) * 360} ${center} ${center})`}
                  d={wavePath(trackSweep)}
                />
              ) : (
                <circle
                  className={slot('track', 'grange-progress-track', styles.track)}
                  cx={center}
                  cy={center}
                  r={radius}
                  transform={`rotate(${(clamped + gap) * 360 - 90} ${center} ${center})`}
                  strokeDasharray={`${trackSweep * circumference} ${circumference}`}
                />
              ))}

            {wavy ? (
              <path
                className={slot('active', 'grange-progress-active', styles.active)}
                d={wavePath(clamped)}
              />
            ) : (
              <circle
                className={slot('active', 'grange-progress-active', styles.active)}
                cx={center}
                cy={center}
                r={radius}
                transform={`rotate(-90 ${center} ${center})`}
                strokeDasharray={`${clamped * circumference} ${circumference}`}
              />
            )}
          </g>
        </svg>
      </div>
    );
  },
);
