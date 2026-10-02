/**
 * Sine path builders for the M3 Expressive wavy progress indicators.
 *
 * Both return an SVG path. They are pure so the geometry can be tested without rendering, and
 * they sample the curve as short line segments, which at a couple of pixels a step is
 * indistinguishable from a smooth curve and far easier to reason about than fitted béziers.
 */

const STEP = 2;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A horizontal wave from x = 0 to `width`, centred on `centerY`.
 *
 * `overshoot` draws extra wavelengths past the end so the path can be translated by one
 * wavelength to animate the flow without its end coming into view.
 */
export function linearWavePath(options: {
  width: number;
  centerY: number;
  amplitude: number;
  wavelength: number;
  overshoot?: number;
}): string {
  const { width, centerY, amplitude, wavelength, overshoot = 0 } = options;
  const end = width + overshoot;
  if (end <= 0 || wavelength <= 0) return '';

  const points: string[] = [];
  for (let x = 0; x <= end; x += STEP) {
    const y = centerY + amplitude * Math.sin((2 * Math.PI * x) / wavelength);
    points.push(`${round(x)} ${round(y)}`);
  }
  // Land exactly on the end rather than wherever the last whole step fell.
  const y = centerY + amplitude * Math.sin((2 * Math.PI * end) / wavelength);
  points.push(`${round(end)} ${round(y)}`);

  return `M ${points.join(' L ')}`;
}

/**
 * A wave wrapped around a circle: the radius rises and falls as the angle advances, with the
 * wavelength measured along the arc so the crests stay evenly spaced however big the circle is.
 *
 * `sweep` is the fraction of the circle to draw, 0 to 1, starting at twelve o'clock.
 */
export function circularWavePath(options: {
  radius: number;
  amplitude: number;
  wavelength: number;
  sweep: number;
  centerX: number;
  centerY: number;
}): string {
  const { radius, amplitude, wavelength, sweep, centerX, centerY } = options;
  if (sweep <= 0 || radius <= 0 || wavelength <= 0) return '';

  const totalAngle = Math.PI * 2 * Math.min(sweep, 1);
  // One step every STEP pixels of arc, so the sampling does not thin out on a larger circle.
  const steps = Math.max(2, Math.ceil((radius * totalAngle) / STEP));

  const points: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (totalAngle * i) / steps;
    const arcLength = radius * angle;
    const r = radius + amplitude * Math.sin((2 * Math.PI * arcLength) / wavelength);
    // Start at twelve o'clock and run clockwise, as the spec draws it.
    const x = centerX + r * Math.sin(angle);
    const y = centerY - r * Math.cos(angle);
    points.push(`${round(x)} ${round(y)}`);
  }

  return `M ${points.join(' L ')}`;
}
