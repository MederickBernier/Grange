import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ArcGauge,
  CircularGauge,
  GrangeProvider,
  LinearGauge,
  RadialGauge,
  Sparkline,
  arcPath,
  areaPath,
  bars,
  circularProgress,
  fraction,
  gauge,
  linePath,
  pointOn,
  scalePoints,
  tickAngles,
  tickValues,
} from '../index';

describe('tokens', () => {
  it('agrees with the progress indicators, which are the nearest captured thing', () => {
    // Material has no gauge, so the track is CircularProgressIndicatorTokens' thickness.
    expect(gauge.thickness).toBe(circularProgress.thickness);
  });
});

describe('the arc geometry', () => {
  const centre = { x: 50, y: 50 };

  it("measures angles from twelve o'clock, not from three", () => {
    // SVG's own zero is three o'clock; a gauge is read from the top, so this is converted once.
    expect(pointOn(centre, 10, 0)).toEqual({ x: 50, y: 40 });
    expect(pointOn(centre, 10, 90)).toEqual({ x: 60, y: 50 });
    expect(pointOn(centre, 10, 180)).toEqual({ x: 50, y: 60 });
  });

  it('places a value on the scale as a fraction', () => {
    expect(fraction(50, 0, 100)).toBe(0.5);
    expect(fraction(5, 0, 10)).toBe(0.5);
  });

  it('pins a value outside the range rather than drawing past the end', () => {
    expect(fraction(-5, 0, 100)).toBe(0);
    expect(fraction(200, 0, 100)).toBe(1);
  });

  it('survives a range of no width, and a value that is not one', () => {
    expect(fraction(5, 5, 5)).toBe(0);
    expect(fraction(NaN, 0, 100)).toBe(0);
  });

  it('sets the large-arc flag past half a circle', () => {
    /*
     * The detail that bites: without it, anything over 180° is drawn as its own mirror image,
     * so a gauge reads correctly up to half and then collapses inwards.
     */
    expect(arcPath(centre, 40, 0, 90)).toContain('A 40 40 0 0 1');
    expect(arcPath(centre, 40, 0, 270)).toContain('A 40 40 0 1 1');
  });

  it('draws a full circle as two arcs, since one would start where it ends', () => {
    const path = arcPath(centre, 40, 0, 360);
    expect(path.match(/a /g)).toHaveLength(2);
  });

  it('draws nothing for no sweep at all', () => {
    expect(arcPath(centre, 40, 90, 90)).toBe('');
  });

  it('puts a tick at both ends as well as between', () => {
    // Four intervals is five marks, which is what anyone counting them expects.
    expect(tickAngles(-135, 135, 4)).toEqual([-135, -67.5, 0, 67.5, 135]);
    expect(tickValues(0, 100, 4)).toEqual([0, 25, 50, 75, 100]);
  });
});

describe('the sparkline geometry', () => {
  const scale = { width: 100, height: 20 };

  it('flips y, because SVG grows downwards and a chart does not', () => {
    const points = scalePoints([0, 10], scale);
    expect(points[0]!.y).toBe(20);
    expect(points[1]!.y).toBe(0);
  });

  it('spreads the points across the width', () => {
    expect(scalePoints([1, 2, 3], scale).map((p) => p.x)).toEqual([0, 50, 100]);
  });

  it('draws a flat series along the middle rather than at an edge', () => {
    // There is no "high" without a range, and a zero-height range would pin it to the top.
    expect(scalePoints([5, 5, 5], scale).every((p) => p.y === 10)).toBe(true);
  });

  it('puts a single point in the middle', () => {
    expect(scalePoints([7], scale)).toEqual([{ x: 50, y: 10 }]);
  });

  it('pins the scale when it is given one, so two sparklines can be compared', () => {
    const points = scalePoints([5], { ...scale, min: 0, max: 10 });
    expect(points[0]!.y).toBe(10);
  });

  it('draws one point as a dot rather than as nothing', () => {
    // A zero-length path with a butt cap renders nothing at all.
    expect(linePath([{ x: 5, y: 5 }])).toBe('M 5 5 L 5 5');
  });

  it('closes an area along the bottom', () => {
    const path = areaPath(scalePoints([0, 10], scale), 20);
    expect(path.endsWith('Z')).toBe(true);
    expect(path).toContain('L 100 20');
  });

  it('gives every bar at least a pixel, so a zero is still visible', () => {
    expect(bars([0, 5], scale).every((bar) => bar.height >= 1)).toBe(true);
  });

  it('counts bars from zero rather than from the lowest value', () => {
    // Otherwise the smallest bar in every series is always zero-height, whatever it is.
    const out = bars([5, 10], scale);
    expect(out[0]!.height).toBe(10);
  });

  it('draws nothing for nothing', () => {
    expect(scalePoints([], scale)).toEqual([]);
    expect(linePath([])).toBe('');
    expect(bars([], scale)).toEqual([]);
  });
});

describe('the gauges', () => {
  it('are meters, not progress bars', () => {
    render(<ArcGauge value={40} label="Disk" />);
    /*
     * A progress bar says a task is partly done; a meter says a quantity sits in a range. A
     * disk that is 80% full is not 80% finished.
     */
    const meter = screen.getByRole('meter', { name: 'Disk' });
    expect(meter.getAttribute('aria-valuenow')).toBe('40');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
  });

  it('take a value label for a scale a percentage would be nonsense on', () => {
    render(<ArcGauge value={21} min={-10} max={40} label="Temperature" valueLabel="21°C" />);
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe('21°C');
  });

  it('draw the number in the middle, and can be told not to', () => {
    const { rerender } = render(<CircularGauge value={62} aria-label="Quota" />);
    expect(screen.getByText('62')).not.toBeNull();

    rerender(<CircularGauge value={62} aria-label="Quota" showValue={false} />);
    expect(screen.queryByText('62')).toBeNull();
  });

  it('hide the drawing, which only repeats what the meter already reports', () => {
    const { container } = render(<ArcGauge value={40} aria-label="Disk" />);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('draw a needle on the radial one and an arc on the others', () => {
    const { container: radial } = render(<RadialGauge value={40} aria-label="Speed" />);
    expect(radial.querySelector('line')).not.toBeNull();

    const { container: arc } = render(<ArcGauge value={40} aria-label="Disk" />);
    expect(arc.querySelector('line')).toBeNull();
  });

  it('draw the bands they are given', () => {
    const { container } = render(
      <ArcGauge
        value={40}
        aria-label="Load"
        bands={[
          { from: 0, to: 60, color: 'green' },
          { from: 60, to: 100, color: 'red' },
        ]}
      />,
    );
    const stroked = [...container.querySelectorAll('path[stroke]')].map((p) => p.getAttribute('stroke'));
    expect(stroked).toContain('green');
    expect(stroked).toContain('red');
  });

  it('report the same way when linear', () => {
    render(<LinearGauge value={30} min={0} max={60} label="Pressure" />);
    const meter = screen.getByRole('meter', { name: 'Pressure' });
    expect(meter.getAttribute('aria-valuenow')).toBe('30');
  });

  it('take their size from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ ArcGauge: { size: 80, showValue: false } }}>
        <ArcGauge value={40} aria-label="Disk" />
      </GrangeProvider>,
    );
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('80');
    expect(screen.queryByText('40')).toBeNull();
  });
});

describe('Sparkline', () => {
  const values = [3, 7, 4, 9, 6];

  it('is hidden unless it is given something to say', () => {
    const { container } = render(<Sparkline values={values} />);
    /*
     * It nearly always sits beside the number it illustrates, and reading the shape out after
     * the number says the same thing twice, worse.
     */
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('announces itself when it is the only thing carrying the information', () => {
    render(<Sparkline values={values} aria-label="Sales, rising from 3 to 6 over five months" />);
    expect(screen.getByRole('img', { name: /rising from 3 to 6/ })).not.toBeNull();
  });

  it('draws a line, an area or bars', () => {
    const { container: line } = render(<Sparkline values={values} />);
    expect(line.querySelectorAll('path')).toHaveLength(1);

    const { container: area } = render(<Sparkline values={values} variant="area" />);
    expect(area.querySelectorAll('path')).toHaveLength(2);

    const { container: bar } = render(<Sparkline values={values} variant="bar" />);
    expect(bar.querySelectorAll('rect')).toHaveLength(5);
  });

  it('marks the last value, and can be told not to', () => {
    const { container, rerender } = render(<Sparkline values={values} />);
    expect(container.querySelector('circle')).not.toBeNull();

    rerender(<Sparkline values={values} showLast={false} />);
    expect(container.querySelector('circle')).toBeNull();
  });

  it('draws an empty series without throwing', () => {
    const { container } = render(<Sparkline values={[]} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('takes its shape from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Sparkline: { variant: 'bar', width: 48, height: 12 } }}>
        <Sparkline values={values} />
      </GrangeProvider>,
    );
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('48');
    expect(container.querySelectorAll('rect')).toHaveLength(5);
  });
});
