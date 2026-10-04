import { useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { useLocale } from 'react-aria';
import { Time } from '@internationalized/date';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type TimePickerSlot,
} from '../../config/config';
import { useControlledState } from '../../utils';
import { TimeField } from '../TimeField/TimeField';
import {
  angleFor,
  fromHour24,
  labelsFor,
  periodOf,
  pointFor,
  radiusFor,
  ringFor,
  toHour24,
  valueAt,
  type DialMode,
} from './dial';
import { timePicker as spec } from './specs';
import styles from './TimePicker.module.scss';

export interface TimePickerProps {
  value?: Time;
  defaultValue?: Time;
  onChange?: (value: Time) => void;
  /** 12 or 24 hour. Left out, it follows the locale rather than an assumption. */
  hourCycle?: 12 | 24;
  /** The label over the control, which the spec writes as "Select time". */
  headline?: ReactNode;
  /** Whether the AM/PM selector stands beside the boxes or sits under them. 12 hour only. */
  periodOrientation?: 'vertical' | 'horizontal';
  /** Which of the spec's two modes is showing. The dial by default. */
  mode?: 'dial' | 'input';
  onModeChange?: (mode: 'dial' | 'input') => void;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TimePickerSlot>;
}

/**
 * The dial mode of the time picker: the clock face the spec draws beside the hour and minute
 * boxes, with `TimeField` as the other mode behind the same value.
 *
 * The dial is a circular slider, and that is what it says it is: `role="slider"` with
 * `aria-valuenow` and an `aria-valuetext` that reads the hour or the minute out. That matters
 * more here than anywhere else in the library, because a clock face is the one control where
 * the obvious markup — a ring of buttons — gives a keyboard user twelve tab stops and no way to
 * set a minute that is not a multiple of five. As a slider it is one tab stop, the arrows move a
 * single unit, Page Up and Page Down move five, and Home and End go to the ends.
 *
 * A 24-hour face has two rings, and on a pointer the distance from the middle picks between
 * them, so dragging inwards moves from the afternoon into the small hours. From the keyboard the
 * value simply runs 0 to 23 and the handle crosses between the rings on its own.
 *
 * The numbers themselves are `aria-hidden`: the slider already says what the value is, and
 * having assistive tech read a ring of loose numbers after it is noise.
 */
export function TimePicker(props: TimePickerProps) {
  const { defaults, slots } = useComponentConfig('TimePicker');
  const { locale } = useLocale();
  const {
    value,
    defaultValue,
    onChange,
    hourCycle = defaults?.hourCycle ?? localeHourCycle(locale),
    headline,
    periodOrientation = defaults?.periodOrientation ?? 'vertical',
    mode = defaults?.mode ?? 'dial',
    onModeChange,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const [time, setTime] = useControlledState<Time>(value, defaultValue ?? new Time(0, 0), onChange);
  const [editing, setEditing] = useState<DialMode>('hour');

  const slot = (name: TimePickerSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const period = periodOf(time.hour);
  const setPeriod = (next: 'AM' | 'PM') => {
    if (next === period) return;
    setTime(time.set({ hour: next === 'PM' ? (time.hour % 12) + 12 : time.hour % 12 }));
  };

  /** The value the dial is editing, in the units the face is marked in. */
  const dialValue = editing === 'hour' ? fromHour24(time.hour, hourCycle) : time.minute;
  const setDialValue = (next: number) => {
    if (editing === 'minute') {
      setTime(time.set({ minute: ((next % 60) + 60) % 60 }));
      return;
    }
    setTime(time.set({ hour: toHour24(next, hourCycle, period) }));
  };

  const selector = (which: DialMode) => (
    <button
      type="button"
      className={slot(which === 'hour' ? 'hour' : 'minute', `grange-time-picker-${which}`, styles.selector)}
      // Not a tab: pressing it changes what the dial edits, it does not reveal a panel.
      aria-pressed={editing === which}
      aria-label={which === 'hour' ? 'Hour' : 'Minute'}
      data-selected={editing === which}
      onClick={() => setEditing(which)}
    >
      {which === 'hour'
        ? String(fromHour24(time.hour, hourCycle)).padStart(2, '0')
        : String(time.minute).padStart(2, '0')}
    </button>
  );

  return (
    <div
      {...aria}
      role="group"
      className={slot('root', 'grange-time-picker', styles.picker)}
      style={style}
      data-mode={mode}
      data-hour-cycle={hourCycle}
    >
      {headline != null && (
        <p className={slot('headline', 'grange-time-picker-headline', styles.headline)}>{headline}</p>
      )}

      <div className={styles.entry} data-period={periodOrientation}>
        <div className={styles.boxes} data-cycle={hourCycle}>
          {selector('hour')}
          <span className={styles.separator} aria-hidden="true">
            :
          </span>
          {selector('minute')}
        </div>

        {hourCycle === 12 && (
          <div
            role="group"
            aria-label="AM or PM"
            className={slot('period', 'grange-time-picker-period', styles.period)}
            data-orientation={periodOrientation}
          >
            {(['AM', 'PM'] as const).map((which) => (
              <button
                key={which}
                type="button"
                className={styles.periodOption}
                aria-pressed={period === which}
                data-selected={period === which}
                onClick={() => setPeriod(which)}
              >
                {which}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === 'dial' ? (
        <Dial
          className={slot('dial', 'grange-time-picker-dial', styles.dial)}
          mode={editing}
          hourCycle={hourCycle}
          value={dialValue}
          onChange={setDialValue}
        />
      ) : (
        <TimeField
          aria-label="Time"
          value={time}
          onChange={(next) => next && setTime(next)}
          hourCycle={hourCycle}
        />
      )}

      {onModeChange && (
        <button
          type="button"
          className={styles.modeToggle}
          onClick={() => onModeChange(mode === 'dial' ? 'input' : 'dial')}
        >
          {mode === 'dial' ? 'Enter time' : 'Select on the clock'}
        </button>
      )}
    </div>
  );
}

function Dial({
  className,
  mode,
  hourCycle,
  value,
  onChange,
}: {
  className: string;
  mode: DialMode;
  hourCycle: 12 | 24;
  value: number;
  onChange: (value: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const labels = useMemo(() => labelsFor(mode, hourCycle), [mode, hourCycle]);

  /** What the slider can be set to, which is the face's own range rather than a fixed one. */
  const [min, max] = mode === 'minute' ? [0, 59] : hourCycle === 24 ? [0, 23] : [1, 12];

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = host.current?.getBoundingClientRect();
    if (!box) return;
    // The dial is a fixed size, but a stylesheet could still scale it, so the point is mapped
    // back into the dial's own coordinates rather than assumed to be in them.
    const scale = box.width === 0 ? 1 : spec.dialSize / box.width;
    onChange(valueAt((event.clientX - box.left) * scale, (event.clientY - box.top) * scale, mode, hourCycle));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // A page is the five-minute mark the face is drawn with, or a quarter of the hours.
    const page = mode === 'minute' ? 5 : 3;
    const span = max - min + 1;
    const step = (by: number) => onChange(((((value - min + by) % span) + span) % span) + min);

    switch (event.key) {
      // Clockwise is up and forward, which is the direction the numbers run.
      case 'ArrowUp':
      case 'ArrowRight':
        step(1);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        step(-1);
        break;
      case 'PageUp':
        step(page);
        break;
      case 'PageDown':
        step(-page);
        break;
      case 'Home':
        onChange(min);
        break;
      case 'End':
        onChange(max);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const handle = pointFor(value, mode, hourCycle);
  const trackLength = radiusFor(ringFor(value, mode, hourCycle));

  return (
    <div
      ref={host}
      className={className}
      role="slider"
      tabIndex={0}
      aria-label={mode === 'hour' ? 'Hour' : 'Minute'}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={mode === 'hour' ? `${value} o'clock` : `${value} minutes`}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragging.current = true;
        host.current?.setPointerCapture?.(event.pointerId);
        host.current?.focus();
        fromPointer(event);
      }}
      onPointerMove={(event) => {
        if (dragging.current) fromPointer(event);
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        host.current?.releasePointerCapture?.(event.pointerId);
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      {/* The hand: a line out to the handle, turned to the value's angle. */}
      <span
        className={styles.track}
        aria-hidden="true"
        // The hand hangs downwards from the middle, so a half turn is added to put zero at the top.
        style={{ height: `${trackLength}px`, rotate: `${angleFor(value, mode) + 180}deg` }}
      />
      <span className={styles.centre} aria-hidden="true" />
      <span
        className={styles.handle}
        aria-hidden="true"
        style={{ left: `${handle.x}px`, top: `${handle.y}px` }}
      />

      {labels.map((label) => {
        const at = pointFor(label.value, mode, hourCycle);
        return (
          <span
            key={`${label.ring}-${label.value}`}
            // The slider says what the value is; a ring of loose numbers after it is noise.
            aria-hidden="true"
            className={styles.label}
            data-selected={label.value === value || undefined}
            data-ring={label.ring}
            style={{ left: `${at.x}px`, top: `${at.y}px` }}
          >
            {label.text}
          </span>
        );
      })}
    </div>
  );
}

/** Whether a locale writes the time on a 12 or a 24 hour clock. */
function localeHourCycle(locale: string): 12 | 24 {
  const resolved = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
  return resolved.hourCycle === 'h11' || resolved.hourCycle === 'h12' ? 12 : 24;
}
