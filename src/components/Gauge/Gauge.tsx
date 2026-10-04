import { type CSSProperties, type ReactNode } from 'react';
import { useMeter } from 'react-aria';
import {
  resolveSlotClass,
  useComponentConfig,
  type GaugeSlot,
  type SlotOverrides,
} from '../../config/config';
import { arcPath, fraction, pointOn, tickAngles, tickValues } from './arc';
import { gauge as spec } from './specs';
import styles from './Gauge.module.scss';

export interface GaugeBand {
  /** Where the band starts and ends, in the gauge's own units. */
  from: number;
  to: number;
  /** Any CSS colour. A token reference is the sensible thing to pass. */
  color: string;
}

export interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  /**
   * What the value means in words. Without one, `useMeter` formats the value against the range
   * as a percentage, which is usually right and occasionally nonsense — a temperature gauge is
   * not "40%".
   */
  valueLabel?: ReactNode;
  /** How to format the number drawn in the middle. The accessible text is separate. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Coloured ranges behind the value, for a scale with meaning: green, amber, red. */
  bands?: readonly GaugeBand[];
  /** The drawing box, px. */
  size?: number;
  /** The arc's thickness, px. */
  thickness?: number;
  /** Hides the number in the middle, for a gauge that is read by its position alone. */
  showValue?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<GaugeSlot>;
  'aria-label'?: string;
}

/**
 * The shared body of the three round gauges.
 *
 * **They are meters, not progress bars**, and that is the one decision worth stating. A
 * progress bar says a task is partly done and will finish; a meter says a quantity sits
 * somewhere in a range. A disk that is 80% full is not 80% finished, and `useMeter` is what
 * says so — it gives the right role and a value text that reads as a measurement.
 *
 * The geometry is in `arc.ts` and pure. SVG measures angles from three o'clock and a gauge is
 * read from twelve, so every angle is converted in one place rather than at each call site,
 * which is where a quarter-turn bug otherwise lives.
 */
function RoundGauge({
  sweep,
  startAngle,
  needle,
  props,
  configKey,
}: {
  sweep: number;
  startAngle: number;
  needle?: boolean;
  props: GaugeProps;
  configKey: 'ArcGauge' | 'CircularGauge' | 'RadialGauge';
}) {
  const { defaults, slots } = useComponentConfig(configKey);
  const {
    value,
    min = 0,
    max = 100,
    label,
    valueLabel,
    formatOptions,
    bands,
    size = defaults?.size ?? spec.size,
    thickness = defaults?.thickness ?? spec.thickness,
    showValue = defaults?.showValue ?? true,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const { meterProps, labelProps } = useMeter({
    value,
    minValue: min,
    maxValue: max,
    label: typeof label === 'string' ? label : undefined,
    'aria-label': ariaLabel,
    valueLabel,
    formatOptions,
  });

  const centre = { x: size / 2, y: size / 2 };
  const radius = size / 2 - thickness / 2;
  const end = startAngle + sweep;
  const atValue = startAngle + sweep * fraction(value, min, max);

  const slot = (name: GaugeSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const formatted = new Intl.NumberFormat(undefined, formatOptions).format(value);

  return (
    <div
      {...meterProps}
      className={slot('root', 'grange-gauge', styles.gauge)}
      style={{ width: size, ...style }}
      data-needle={needle || undefined}
    >
      {label != null && (
        <span {...labelProps} className={slot('label', 'grange-gauge-label', styles.label)}>
          {label}
        </span>
      )}

      {/* The drawing is a picture of the value the meter already carries, so it says nothing. */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className={styles.svg}
      >
        <path
          d={arcPath(centre, radius, startAngle, end)}
          className={styles.track}
          strokeWidth={thickness}
          fill="none"
        />

        {bands?.map((band, i) => (
          <path
            key={i}
            d={arcPath(
              centre,
              radius,
              startAngle + sweep * fraction(band.from, min, max),
              startAngle + sweep * fraction(band.to, min, max),
            )}
            stroke={band.color}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="butt"
          />
        ))}

        {needle ? (
          <Needle centre={centre} radius={radius - thickness} angle={atValue} />
        ) : (
          <path
            d={arcPath(centre, radius, startAngle, atValue)}
            className={styles.value}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>

      {showValue && <span className={slot('value', 'grange-gauge-value', styles.number)}>{formatted}</span>}
    </div>
  );
}

function Needle({
  centre,
  radius,
  angle,
}: {
  centre: { x: number; y: number };
  radius: number;
  angle: number;
}) {
  const tip = pointOn(centre, radius, angle);
  return (
    <>
      <line
        x1={centre.x}
        y1={centre.y}
        x2={tip.x}
        y2={tip.y}
        className={styles.needle}
        strokeWidth={spec.needleWidth}
        strokeLinecap="round"
      />
      <circle cx={centre.x} cy={centre.y} r={spec.needleWidth} className={styles.hub} />
    </>
  );
}

/** A gauge that sweeps most of a circle, read like a speedometer. */
export function ArcGauge(props: GaugeProps) {
  return (
    <RoundGauge sweep={spec.arcSweep} startAngle={-spec.arcSweep / 2} props={props} configKey="ArcGauge" />
  );
}

/** A full ring, for a value that has no natural start and end — a disk, a quota. */
export function CircularGauge(props: GaugeProps) {
  return <RoundGauge sweep={360} startAngle={0} props={props} configKey="CircularGauge" />;
}

/** A dial with a needle, which is what a gauge looks like when it is pretending to be a dial. */
export function RadialGauge(props: GaugeProps & { ticks?: number }) {
  const { ticks = spec.ticks, ...rest } = props;
  return (
    <div className={styles.radial}>
      <RoundGauge
        sweep={spec.arcSweep}
        startAngle={-spec.arcSweep / 2}
        needle
        props={rest}
        configKey="RadialGauge"
      />
      <Ticks {...rest} ticks={ticks} />
    </div>
  );
}

/**
 * The marks and numbers around a dial.
 *
 * Drawn as a second, hidden layer rather than inside the meter, because they are a legend: the
 * meter already reports the value, and reading the scale out as well would be noise.
 */
function Ticks({ min = 0, max = 100, size = spec.size, ticks }: GaugeProps & { ticks: number }) {
  const centre = { x: size / 2, y: size / 2 };
  const angles = tickAngles(-spec.arcSweep / 2, spec.arcSweep / 2, ticks);
  const values = tickValues(min, max, ticks);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className={styles.ticks}
    >
      {angles.map((angle, i) => {
        const outer = pointOn(centre, size / 2 - spec.thickness - 6, angle);
        const inner = pointOn(centre, size / 2 - spec.thickness - 12, angle);
        const label = pointOn(centre, size / 2 - spec.thickness - 24, angle);
        return (
          <g key={angle}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className={styles.tick} />
            <text
              x={label.x}
              y={label.y}
              className={styles.tickLabel}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {values[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface LinearGaugeProps extends Omit<GaugeProps, 'size' | 'thickness'> {
  orientation?: 'horizontal' | 'vertical';
  /** The bar's length, px. */
  length?: number;
  /** The bar's thickness, px. */
  thickness?: number;
}

/**
 * The same measurement as a bar.
 *
 * A meter again rather than a progress bar, for the same reason, and the bands are the point
 * of it: a linear gauge is what you draw when the scale has regions that mean something.
 */
export function LinearGauge(props: LinearGaugeProps) {
  const { defaults, slots } = useComponentConfig('LinearGauge');
  const {
    value,
    min = 0,
    max = 100,
    label,
    valueLabel,
    formatOptions,
    bands,
    orientation = defaults?.orientation ?? 'horizontal',
    length = defaults?.length ?? spec.size,
    thickness = defaults?.thickness ?? spec.barThickness,
    showValue = defaults?.showValue ?? true,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const { meterProps, labelProps } = useMeter({
    value,
    minValue: min,
    maxValue: max,
    label: typeof label === 'string' ? label : undefined,
    'aria-label': ariaLabel,
    valueLabel,
    formatOptions,
  });

  const filled = fraction(value, min, max) * 100;
  const vertical = orientation === 'vertical';

  const slot = (name: GaugeSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <div
      {...meterProps}
      className={slot('root', 'grange-linear-gauge', styles.linear)}
      style={style}
      data-orientation={orientation}
    >
      {label != null && (
        <span {...labelProps} className={slot('label', 'grange-gauge-label', styles.label)}>
          {label}
        </span>
      )}

      <div
        className={styles.bar}
        style={vertical ? { width: thickness, height: length } : { width: length, height: thickness }}
        aria-hidden="true"
      >
        {bands?.map((band, i) => {
          const from = fraction(band.from, min, max) * 100;
          const to = fraction(band.to, min, max) * 100;
          return (
            <span
              key={i}
              className={styles.band}
              style={{
                background: band.color,
                ...(vertical
                  ? { bottom: `${from}%`, height: `${to - from}%`, left: 0, right: 0 }
                  : { left: `${from}%`, width: `${to - from}%`, top: 0, bottom: 0 }),
              }}
            />
          );
        })}
        <span
          className={styles.marker}
          style={vertical ? { bottom: `${filled}%` } : { left: `${filled}%` }}
        />
      </div>

      {showValue && (
        <span className={slot('value', 'grange-gauge-value', styles.linearNumber)}>
          {new Intl.NumberFormat(undefined, formatOptions).format(value)}
        </span>
      )}
    </div>
  );
}
