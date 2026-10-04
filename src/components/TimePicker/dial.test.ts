import { describe, expect, it } from 'vitest';
import { angleFor, fromHour24, labelsFor, pointFor, radiusFor, ringFor, toHour24, valueAt } from './dial';
import { timePicker as spec } from './specs';

describe('token values', () => {
  it('matches TimePickerTokens', () => {
    expect(spec).toMatchObject({
      selectorWidth: 96,
      selectorHeight: 80,
      selectorWidth24H: 114,
      selectorCorner: 8,
      periodWidth: 52,
      periodHeight: 80,
      periodHorizontalWidth: 216,
      periodHorizontalHeight: 38,
      dialSize: 256,
      handleSize: 48,
      centreSize: 8,
      trackWidth: 2,
    });
  });

  it('keeps both rings inside the dial and clear of each other', () => {
    const outer = radiusFor('outer');
    const inner = radiusFor('inner');
    expect(outer).toBe(104);
    expect(inner).toBe(56);
    // The handle has to fit inside the dial on the outer ring...
    expect(outer + spec.handleSize / 2).toBeLessThanOrEqual(spec.dialSize / 2);
    // ...and the two rings must not overlap, or the numbers would collide.
    expect(outer - inner).toBeGreaterThanOrEqual(spec.handleSize);
  });
});

describe('angles', () => {
  it('puts twelve and midnight at the top and runs clockwise', () => {
    expect(angleFor(12, 'hour')).toBe(0);
    expect(angleFor(0, 'hour')).toBe(0);
    expect(angleFor(3, 'hour')).toBe(90);
    expect(angleFor(6, 'hour')).toBe(180);
    expect(angleFor(9, 'hour')).toBe(270);
  });

  it('reads an afternoon hour at the same angle as its morning twin', () => {
    expect(angleFor(15, 'hour')).toBe(angleFor(3, 'hour'));
    expect(angleFor(23, 'hour')).toBe(angleFor(11, 'hour'));
  });

  it('turns six degrees a minute', () => {
    expect(angleFor(0, 'minute')).toBe(0);
    expect(angleFor(15, 'minute')).toBe(90);
    expect(angleFor(30, 'minute')).toBe(180);
    expect(angleFor(59, 'minute')).toBe(354);
  });
});

describe('rings', () => {
  it('uses one ring for minutes and for a twelve hour face', () => {
    expect(ringFor(30, 'minute', 24)).toBe('outer');
    expect(ringFor(11, 'hour', 12)).toBe('outer');
  });

  it('puts the small hours and the afternoon on the inner ring of a 24 hour face', () => {
    expect(ringFor(0, 'hour', 24)).toBe('inner');
    expect(ringFor(13, 'hour', 24)).toBe('inner');
    expect(ringFor(23, 'hour', 24)).toBe('inner');
    expect(ringFor(1, 'hour', 24)).toBe('outer');
    expect(ringFor(12, 'hour', 24)).toBe('outer');
  });
});

describe('positions', () => {
  const centre = spec.dialSize / 2;

  it('places twelve straight up and three straight out to the right', () => {
    const top = pointFor(12, 'hour', 12);
    expect(top.x).toBeCloseTo(centre);
    expect(top.y).toBeCloseTo(centre - radiusFor('outer'));

    const right = pointFor(3, 'hour', 12);
    expect(right.x).toBeCloseTo(centre + radiusFor('outer'));
    expect(right.y).toBeCloseTo(centre);
  });

  it('places an inner ring hour closer in at the same angle', () => {
    const outer = pointFor(3, 'hour', 24);
    const inner = pointFor(15, 'hour', 24);
    expect(inner.x).toBeLessThan(outer.x);
    expect(inner.y).toBeCloseTo(outer.y);
  });
});

describe('labels', () => {
  it('marks the minute face every five minutes, zero padded', () => {
    const labels = labelsFor('minute', 24);
    expect(labels).toHaveLength(12);
    expect(labels[0]).toMatchObject({ value: 0, text: '00' });
    expect(labels[1]).toMatchObject({ value: 5, text: '05' });
    expect(labels[11]).toMatchObject({ value: 55, text: '55' });
  });

  it('runs a twelve hour face from twelve clockwise to eleven', () => {
    const labels = labelsFor('hour', 12);
    expect(labels.map((l) => l.text)).toEqual([
      '12',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
    ]);
  });

  it('gives a 24 hour face two rings, with midnight on the inner one', () => {
    const labels = labelsFor('hour', 24);
    expect(labels).toHaveLength(24);
    const inner = labels.filter((l) => l.ring === 'inner');
    expect(inner.map((l) => l.value)).toEqual([0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
    expect(inner[0]?.text).toBe('00');
  });
});

describe('reading a point', () => {
  const centre = spec.dialSize / 2;
  const outer = radiusFor('outer');
  const inner = radiusFor('inner');

  it('reads the top as twelve and the right as three', () => {
    expect(valueAt(centre, centre - outer, 'hour', 12)).toBe(12);
    expect(valueAt(centre + outer, centre, 'hour', 12)).toBe(3);
    expect(valueAt(centre, centre + outer, 'hour', 12)).toBe(6);
    expect(valueAt(centre - outer, centre, 'hour', 12)).toBe(9);
  });

  it('snaps to the nearest hour rather than refusing an inexact press', () => {
    // A few degrees past three o'clock is still three o'clock.
    const radians = ((90 + 8) * Math.PI) / 180;
    const x = centre + outer * Math.sin(radians);
    const y = centre - outer * Math.cos(radians);
    expect(valueAt(x, y, 'hour', 12)).toBe(3);
  });

  it('reads any minute, not only the ones the face is marked with', () => {
    expect(valueAt(centre, centre - outer, 'minute', 12)).toBe(0);
    const radians = (7 * 6 * Math.PI) / 180;
    const x = centre + outer * Math.sin(radians);
    const y = centre - outer * Math.cos(radians);
    expect(valueAt(x, y, 'minute', 12)).toBe(7);
  });

  it('lets the distance from the middle pick the ring of a 24 hour face', () => {
    expect(valueAt(centre + outer, centre, 'hour', 24)).toBe(3);
    expect(valueAt(centre + inner, centre, 'hour', 24)).toBe(15);
    // Straight up on the inner ring is midnight, not twelve.
    expect(valueAt(centre, centre - inner, 'hour', 24)).toBe(0);
    expect(valueAt(centre, centre - outer, 'hour', 24)).toBe(12);
  });
});

describe('the two hour scales', () => {
  it('maps a face value onto the day, given the half of it', () => {
    expect(toHour24(12, 12, 'AM')).toBe(0);
    expect(toHour24(12, 12, 'PM')).toBe(12);
    expect(toHour24(1, 12, 'PM')).toBe(13);
    expect(toHour24(11, 12, 'AM')).toBe(11);
    // A 24 hour face already is the day, apart from the two ways of writing midnight.
    expect(toHour24(17, 24, 'AM')).toBe(17);
    expect(toHour24(24, 24, 'AM')).toBe(0);
  });

  it('maps the day back onto a face value', () => {
    expect(fromHour24(0, 12)).toBe(12);
    expect(fromHour24(12, 12)).toBe(12);
    expect(fromHour24(13, 12)).toBe(1);
    expect(fromHour24(23, 12)).toBe(11);
    expect(fromHour24(0, 24)).toBe(0);
    expect(fromHour24(23, 24)).toBe(23);
  });

  it('round trips every hour of the day', () => {
    for (let hour = 0; hour < 24; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      expect(toHour24(fromHour24(hour, 12), 12, period)).toBe(hour);
      expect(toHour24(fromHour24(hour, 24), 24, period)).toBe(hour);
    }
  });
});
