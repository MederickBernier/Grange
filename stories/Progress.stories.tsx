import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircularProgress, LinearProgress } from '../src';

/**
 * Progress indicators, restyled by M3 Expressive with a wavy track. Compose ships the wavy
 * versions as separate composables; here it is a `wavy` prop, because the wave values live in
 * the same token object as the flat ones.
 *
 * Thickness, gaps, the stop dot, the wave amplitude and both wavelengths come from
 * LinearProgressIndicatorTokens and CircularProgressIndicatorTokens.
 */
const meta: Meta = {
  title: 'Components/Progress',
  parameters: { layout: 'padded' },
};
export default meta;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sb-row" style={{ alignItems: 'center' }}>
      <span className="sb-label" style={{ minWidth: 140 }}>
        {label}
      </span>
      <div style={{ flex: 1, maxWidth: 360 }}>{children}</div>
    </div>
  );
}

/** Drag the control to watch the active bar, the gap and the stop dot behave. */
export const Linear: StoryObj<{ value: number }> = {
  args: { value: 0.45 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } } },
  render: ({ value }) => (
    <div className="sb-col">
      <Row label="Flat">
        <LinearProgress value={value} aria-label="Flat determinate" />
      </Row>
      <Row label="Wavy">
        <LinearProgress value={value} wavy aria-label="Wavy determinate" />
      </Row>
      <Row label="No stop dot">
        <LinearProgress value={value} stopIndicator={false} aria-label="No stop indicator" />
      </Row>
    </div>
  ),
};

export const Circular: StoryObj<{ value: number }> = {
  args: { value: 0.45 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } } },
  render: ({ value }) => (
    <div className="sb-row">
      <CircularProgress value={value} aria-label="Flat determinate" />
      <CircularProgress value={value} wavy aria-label="Wavy determinate" />
      <CircularProgress value={value} size={72} wavy aria-label="Larger wavy" />
    </div>
  ),
};

/**
 * With no value, both go indeterminate: the bar sweeps and the ring spins. The wavy bar uses the
 * shorter 20px wavelength the tokens give indeterminate, against 40px for determinate.
 */
export const Indeterminate: StoryObj = {
  render: () => (
    <div className="sb-col">
      <Row label="Linear, flat">
        <LinearProgress aria-label="Working" />
      </Row>
      <Row label="Linear, wavy">
        <LinearProgress wavy aria-label="Working" />
      </Row>
      <Row label="Circular">
        <div className="sb-row">
          <CircularProgress aria-label="Working" />
          <CircularProgress wavy aria-label="Working" />
        </div>
      </Row>
    </div>
  ),
};

/** A real load, so the motion reads the way it would in an app. */
export const Loading: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState(0);
    useEffect(() => {
      const id = window.setInterval(() => setValue((v) => (v >= 1 ? 0 : +(v + 0.01).toFixed(2))), 60);
      return () => window.clearInterval(id);
    }, []);
    return (
      <div className="sb-col">
        <Row label={`${Math.round(value * 100)}%`}>
          <LinearProgress value={value} wavy aria-label="Uploading" />
        </Row>
        <Row label="Circular">
          <div className="sb-row">
            <CircularProgress value={value} aria-label="Uploading" />
            <CircularProgress value={value} wavy aria-label="Uploading" />
          </div>
        </Row>
      </div>
    );
  },
};
