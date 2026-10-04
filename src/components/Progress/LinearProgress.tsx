import { forwardRef, useId, type CSSProperties } from 'react';
import { useProgressBar } from 'react-aria';
import {
  resolveSlotClass,
  useComponentConfig,
  type ProgressSlot,
  type SlotOverrides,
} from '../../config/config';
import { linearProgress as spec } from './specs';
import { linearWavePath } from './wave';
import styles from './Progress.module.scss';

export interface LinearProgressProps {
  /**
   * Progress from 0 to 1. Leave it out for an indeterminate bar, which is the right choice when
   * the wait has no measurable end.
   */
  value?: number;
  /** The M3 Expressive wavy track. Compose exposes this as a separate composable. */
  wavy?: boolean;
  /**
   * The dot at the far end of the track, which marks where full is. On for a determinate bar,
   * and meaningless for an indeterminate one.
   */
  stopIndicator?: boolean;
  /** One of aria-label or aria-labelledby is needed, so the bar is announced with a name. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ProgressSlot>;
}

/** How far past the viewport the wave is drawn, in wavelengths, so the flow can loop seamlessly. */
const FLOW_WAVELENGTHS = 1;

/**
 * A horizontal progress bar. Thickness, the gap between bar and track, the stop dot and the wave
 * geometry all come from the Compose tokens.
 *
 * The bar is laid out in a viewBox whose width is a round 100 units, so the active portion is
 * just a percentage and the component never has to measure itself.
 */
export const LinearProgress = forwardRef<HTMLDivElement, LinearProgressProps>(
  function LinearProgress(props, ref) {
    const { slots } = useComponentConfig('LinearProgress');
    const { value, wavy = false, stopIndicator = true, className, classNames, style, ...aria } = props;

    const isIndeterminate = value === undefined;
    const clamped = isIndeterminate ? 0 : Math.min(1, Math.max(0, value));
    const { progressBarProps } = useProgressBar({
      ...aria,
      value: clamped,
      minValue: 0,
      maxValue: 1,
      isIndeterminate,
    });

    const clipId = useId();
    const height = wavy ? spec.waveHeight : spec.thickness;
    const centerY = height / 2;
    // A fixed 100-unit viewBox, stretched to the real width, so "percent" is literal here.
    const width = 100;
    const wavelength = isIndeterminate ? spec.indeterminateWaveWavelength : spec.waveWavelength;

    const slot = (name: ProgressSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    return (
      <div
        {...progressBarProps}
        ref={ref}
        className={slot('root', 'grange-linear-progress', styles.linear)}
        style={{
          ['--_thickness' as string]: `${spec.thickness}px`,
          ['--_height' as string]: `${height}px`,
          ['--_value' as string]: clamped,
          ...style,
        }}
        data-wavy={wavy || undefined}
        data-indeterminate={isIndeterminate || undefined}
      >
        <svg
          className={styles.canvas}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/*
              The active portion is one long wave, revealed by a clip that follows the value.
              In user units, not objectBoundingBox, which would measure the path's own box and
              that overshoots the viewport so the flow can loop.
            */}
            <clipPath id={clipId}>
              <rect x="0" y="0" height={height} width={isIndeterminate ? width : clamped * width} />
            </clipPath>
          </defs>

          <line
            className={slot('track', 'grange-progress-track', styles.track)}
            x1="0"
            x2={width}
            y1={centerY}
            y2={centerY}
          />

          <g clipPath={`url(#${clipId})`}>
            {wavy ? (
              <path
                className={slot('active', 'grange-progress-active', styles.active)}
                d={linearWavePath({
                  width,
                  centerY,
                  amplitude: spec.waveAmplitude,
                  wavelength,
                  overshoot: wavelength * FLOW_WAVELENGTHS,
                })}
                style={{ ['--_wavelength' as string]: `${wavelength}` }}
              />
            ) : (
              <line
                className={slot('active', 'grange-progress-active', styles.active)}
                x1="0"
                x2={width}
                y1={centerY}
                y2={centerY}
              />
            )}
          </g>

          {stopIndicator && !isIndeterminate && (
            <circle
              className={styles.stop}
              cx={width - spec.stopSize / 2}
              cy={centerY}
              r={spec.stopSize / 2}
            />
          )}
        </svg>
      </div>
    );
  },
);
