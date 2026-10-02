import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress, GrangeProvider, LinearProgress, circularProgress, linearProgress } from '../index';

const bar = () => screen.getByRole('progressbar');

describe('token geometry', () => {
  it('matches the Compose linear tokens', () => {
    expect(linearProgress).toMatchObject({
      thickness: 4,
      trackGap: 4,
      stopSize: 4,
      waveHeight: 10,
      waveAmplitude: 3,
      waveWavelength: 40,
      indeterminateWaveWavelength: 20,
    });
  });

  it('matches the Compose circular tokens', () => {
    expect(circularProgress).toMatchObject({
      size: 40,
      waveSize: 48,
      thickness: 4,
      trackGap: 4,
      waveAmplitude: 1.6,
      waveWavelength: 15,
    });
  });
});

describe('LinearProgress', () => {
  it('reports the value to assistive tech', () => {
    render(<LinearProgress value={0.35} aria-label="Uploading" />);
    expect(bar().getAttribute('aria-valuenow')).toBe('0.35');
    expect(bar().getAttribute('aria-valuemin')).toBe('0');
    expect(bar().getAttribute('aria-valuemax')).toBe('1');
  });

  it('omits the value entirely when indeterminate', () => {
    render(<LinearProgress aria-label="Working" />);
    expect(bar().getAttribute('aria-valuenow')).toBeNull();
    expect(bar().dataset.indeterminate).toBe('true');
  });

  it('clamps a value outside the range rather than drawing past the end', () => {
    const { rerender } = render(<LinearProgress value={5} aria-label="Over" />);
    expect(bar().getAttribute('aria-valuenow')).toBe('1');
    rerender(<LinearProgress value={-5} aria-label="Under" />);
    expect(bar().getAttribute('aria-valuenow')).toBe('0');
  });

  it('is only as tall as the bar until it goes wavy, which needs room to swing', () => {
    const { rerender } = render(<LinearProgress value={0.5} aria-label="Flat" />);
    expect(bar().style.getPropertyValue('--_height')).toBe('4px');
    rerender(<LinearProgress value={0.5} wavy aria-label="Wavy" />);
    expect(bar().style.getPropertyValue('--_height')).toBe('10px');
  });

  it('draws a wave only when asked, and a straight line otherwise', () => {
    const { rerender } = render(<LinearProgress value={0.5} aria-label="Flat" />);
    expect(bar().querySelector('path.grange-progress-active')).toBeNull();
    rerender(<LinearProgress value={0.5} wavy aria-label="Wavy" />);
    expect(bar().querySelector('path.grange-progress-active')).not.toBeNull();
  });

  it('uses the shorter indeterminate wavelength', () => {
    render(<LinearProgress wavy aria-label="Working" />);
    const path = bar().querySelector('path.grange-progress-active') as SVGPathElement;
    expect(path.style.getPropertyValue('--_wavelength')).toBe('20');
  });

  it('reveals the active portion in proportion to the value', () => {
    render(<LinearProgress value={0.25} aria-label="Quarter" />);
    // The viewBox is 100 units wide, so the clip is the value as a percentage.
    expect(bar().querySelector('clipPath rect')?.getAttribute('width')).toBe('25');
  });

  it('shows the stop dot for a determinate bar and never for an indeterminate one', () => {
    const { rerender } = render(<LinearProgress value={0.5} aria-label="Determinate" />);
    expect(bar().querySelector('circle')).not.toBeNull();

    rerender(<LinearProgress value={0.5} stopIndicator={false} aria-label="No stop" />);
    expect(bar().querySelector('circle')).toBeNull();

    rerender(<LinearProgress aria-label="Indeterminate" />);
    expect(bar().querySelector('circle')).toBeNull();
  });
});

describe('CircularProgress', () => {
  it('reports the value to assistive tech', () => {
    render(<CircularProgress value={0.6} aria-label="Loading" />);
    expect(bar().getAttribute('aria-valuenow')).toBe('0.6');
  });

  it('grows from 40 to 48px when wavy, so the wave stays inside the box', () => {
    const { rerender } = render(<CircularProgress value={0.5} aria-label="Flat" />);
    expect(bar().style.getPropertyValue('--_size')).toBe('40px');
    rerender(<CircularProgress value={0.5} wavy aria-label="Wavy" />);
    expect(bar().style.getPropertyValue('--_size')).toBe('48px');
  });

  it('takes an explicit size over either default', () => {
    render(<CircularProgress value={0.5} size={64} aria-label="Big" />);
    expect(bar().style.getPropertyValue('--_size')).toBe('64px');
  });

  it('draws the active arc in proportion to the value', () => {
    render(<CircularProgress value={0.5} aria-label="Half" />);
    const active = bar().querySelector('circle.grange-progress-active') as SVGCircleElement;
    const r = Number(active.getAttribute('r'));
    const [dash] = active.getAttribute('stroke-dasharray')!.split(' ').map(Number);
    expect(dash).toBeCloseTo(0.5 * 2 * Math.PI * r, 1);
  });

  it('keeps the whole stroke inside the viewBox', () => {
    render(<CircularProgress value={1} aria-label="Full" />);
    const active = bar().querySelector('circle.grange-progress-active') as SVGCircleElement;
    const r = Number(active.getAttribute('r'));
    // 40px box, 4px stroke, so the radius can be at most 18.
    expect(r).toBe(18);
  });

  it('leaves room for the wave swing as well when wavy', () => {
    render(<CircularProgress value={1} wavy aria-label="Full" />);
    const path = bar().querySelector('path.grange-progress-active') as SVGPathElement;
    expect(path).not.toBeNull();
    // 48px box, half the 4px stroke plus the 1.6px amplitude inset from the edge.
    expect(bar().style.getPropertyValue('--_size')).toBe('48px');
  });

  it('drops the remaining track at full, since there is none left', () => {
    render(<CircularProgress value={1} aria-label="Full" />);
    expect(bar().querySelector('.grange-progress-track')).toBeNull();
  });

  it('has no track while indeterminate, only the sweeping arc', () => {
    render(<CircularProgress aria-label="Working" />);
    expect(bar().querySelector('.grange-progress-track')).toBeNull();
    expect(bar().dataset.indeterminate).toBe('true');
  });
});

describe('config', () => {
  it('turns the wave on app-wide', () => {
    render(
      <GrangeProvider defaultProps={{ CircularProgress: { wavy: true } }}>
        <CircularProgress value={0.5} aria-label="Loading" />
      </GrangeProvider>,
    );
    expect(bar().dataset.wavy).toBe('true');
  });

  it('reaches the track and active slots', () => {
    render(
      <GrangeProvider classNames={{ LinearProgress: { track: 'my-track', active: 'my-active' } }}>
        <LinearProgress value={0.5} aria-label="Loading" />
      </GrangeProvider>,
    );
    expect(bar().querySelector('.grange-progress-track')?.getAttribute('class')).toContain('my-track');
    expect(bar().querySelector('.grange-progress-active')?.getAttribute('class')).toContain('my-active');
  });
});
