/**
 * The clock face's arithmetic, kept out of the component so it can be tested on its own.
 *
 * Angles are degrees clockwise from the top, which is how a clock is read and not how
 * `Math.atan2` reports them, so every conversion goes through here.
 */
import { DEGREES_PER_HOUR, DEGREES_PER_MINUTE, timePicker as spec } from './specs';

export type DialMode = 'hour' | 'minute';

/** A label on the face: the value it sets, what it reads, and which ring it belongs to. */
export interface DialLabel {
  value: number;
  text: string;
  /** 24-hour faces have two rings; a 12-hour face and the minutes have only the outer one. */
  ring: 'outer' | 'inner';
}

/** Degrees clockwise from the top for a value, which is what positions both labels and handle. */
export function angleFor(value: number, mode: DialMode): number {
  if (mode === 'minute') return (value % 60) * DEGREES_PER_MINUTE;
  // Midnight and noon are both at the top, and 13 through 23 repeat the same twelve positions.
  return (value % 12) * DEGREES_PER_HOUR;
}

/** Which ring a value sits on. Only a 24-hour face has an inner one. */
export function ringFor(value: number, mode: DialMode, hourCycle: 12 | 24): 'outer' | 'inner' {
  if (mode === 'minute' || hourCycle === 12) return 'outer';
  // The outer ring reads 1 to 12, so the inner one takes midnight and 13 through 23.
  return value === 0 || value >= 13 ? 'inner' : 'outer';
}

/** The pixel radius of a ring on the dial. */
export function radiusFor(ring: 'outer' | 'inner'): number {
  const inset = ring === 'inner' ? spec.innerRingInset : spec.outerRingInset;
  return spec.dialSize / 2 - inset * spec.handleSize;
}

/** Where a value's label or the handle sits, in px from the dial's top left corner. */
export function pointFor(value: number, mode: DialMode, hourCycle: 12 | 24): { x: number; y: number } {
  const radians = (angleFor(value, mode) * Math.PI) / 180;
  const radius = radiusFor(ringFor(value, mode, hourCycle));
  const centre = spec.dialSize / 2;
  return { x: centre + radius * Math.sin(radians), y: centre - radius * Math.cos(radians) };
}

/** Every label a face shows, in clockwise order, which is also the order the arrow keys follow. */
export function labelsFor(mode: DialMode, hourCycle: 12 | 24): DialLabel[] {
  if (mode === 'minute') {
    // The face is marked every five minutes, as a clock is, though any minute can be set.
    return Array.from({ length: 12 }, (_, i) => ({
      value: i * 5,
      text: String(i * 5).padStart(2, '0'),
      ring: 'outer' as const,
    }));
  }
  if (hourCycle === 12) {
    // 12 sits at the top, then 1 through 11 clockwise.
    return Array.from({ length: 12 }, (_, i) => {
      const value = i === 0 ? 12 : i;
      return { value, text: String(value), ring: 'outer' as const };
    });
  }
  const outer = Array.from({ length: 12 }, (_, i) => {
    const value = i === 0 ? 12 : i;
    return { value, text: String(value).padStart(2, '0'), ring: 'outer' as const };
  });
  const inner = Array.from({ length: 12 }, (_, i) => {
    const value = i === 0 ? 0 : i + 12;
    return { value, text: String(value).padStart(2, '0'), ring: 'inner' as const };
  });
  return [...outer, ...inner];
}

/**
 * The value a point on the dial means.
 *
 * `x` and `y` are relative to the dial's top left corner. On a 24-hour face the distance from
 * the middle picks the ring, so dragging inwards moves from the afternoon to the small hours,
 * which is how the face is read.
 */
export function valueAt(x: number, y: number, mode: DialMode, hourCycle: 12 | 24): number {
  const centre = spec.dialSize / 2;
  const dx = x - centre;
  const dy = y - centre;
  // atan2 measures anticlockwise from the positive x axis; a clock measures clockwise from the top.
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const clockwise = (angle + 360) % 360;

  if (mode === 'minute') return Math.round(clockwise / DEGREES_PER_MINUTE) % 60;

  const step = Math.round(clockwise / DEGREES_PER_HOUR) % 12;
  if (hourCycle === 12) return step === 0 ? 12 : step;

  // Halfway between the rings is where one gives way to the other.
  const boundary = (radiusFor('outer') + radiusFor('inner')) / 2;
  const inner = Math.hypot(dx, dy) < boundary;
  if (inner) return step === 0 ? 0 : step + 12;
  return step === 0 ? 12 : step;
}

/** The 0 to 23 hour a face value means, given which half of the day is selected. */
export function toHour24(value: number, hourCycle: 12 | 24, period: 'AM' | 'PM'): number {
  if (hourCycle === 24) return value === 24 ? 0 : value;
  const twelve = value % 12;
  return period === 'PM' ? twelve + 12 : twelve;
}

/** The face value a 0 to 23 hour shows as. */
export function fromHour24(hour: number, hourCycle: 12 | 24): number {
  if (hourCycle === 24) return hour;
  const twelve = hour % 12;
  return twelve === 0 ? 12 : twelve;
}

export function periodOf(hour: number): 'AM' | 'PM' {
  return hour >= 12 ? 'PM' : 'AM';
}
