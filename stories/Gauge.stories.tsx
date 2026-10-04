import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArcGauge, CircularGauge, LinearGauge, RadialGauge, Sparkline, Stack } from '../src';

/**
 * Gauges and sparklines: one SVG engine, five presentations.
 *
 * **They are meters, not progress bars**, which is the decision everything else follows from.
 * A progress bar says a task is partly done and will finish; a meter says a quantity sits
 * somewhere in a range. A disk that is 80% full is not 80% finished, and `useMeter` is what
 * says so — it gives the right role and a value text that reads as a measurement.
 *
 * Material has no gauge, so every value is chosen — and chosen to agree with the progress
 * indicators, which are the nearest thing the spec does publish: the 4px track from
 * `CircularProgressIndicatorTokens`, and the same primary-on-secondary-container pair.
 *
 * The geometry is pure and tested as arithmetic. SVG measures angles from three o'clock and a
 * gauge is read from twelve, so the conversion happens in one place rather than at each call
 * site — which is where a quarter-turn bug otherwise lives.
 */
const meta: Meta = {
  title: 'Components/Gauges and Sparklines',
  parameters: { layout: 'padded' },
};
export default meta;

const bands = [
  { from: 0, to: 60, color: 'var(--md-sys-color-primary)' },
  { from: 60, to: 85, color: 'var(--md-sys-color-tertiary)' },
  { from: 85, to: 100, color: 'var(--md-sys-color-error)' },
];

/** The four round and linear faces, all reading the same value. */
export const Faces: StoryObj = {
  render: () => (
    <Stack direction="row" gap="xl" align="center" wrap>
      <Stack gap="xs" align="center">
        <ArcGauge value={72} label="Arc" />
      </Stack>
      <Stack gap="xs" align="center">
        <CircularGauge value={72} label="Circular" />
      </Stack>
      <Stack gap="xs" align="center">
        <RadialGauge value={72} label="Radial" />
      </Stack>
      <Stack gap="xs" align="center">
        <LinearGauge value={72} label="Linear" />
      </Stack>
    </Stack>
  ),
};

/** Bands, which are the reason to draw a gauge rather than print a number. */
export const Bands: StoryObj = {
  render: () => (
    <Stack direction="row" gap="xl" align="center" wrap>
      <ArcGauge value={91} label="CPU" bands={bands} />
      <LinearGauge value={91} label="Memory" bands={bands} length={240} />
      <LinearGauge value={44} label="Swap" bands={bands} orientation="vertical" length={160} />
    </Stack>
  ),
};

/**
 * A scale a percentage would be nonsense on. The value text says what the number means, since
 * "21°C" is the measurement and "62%" is an arithmetic accident.
 */
export const RealUnits: StoryObj = {
  render: () => (
    <Stack direction="row" gap="xl" align="center" wrap>
      <RadialGauge value={21} min={-10} max={40} label="Temperature" valueLabel="21 degrees" />
      <ArcGauge
        value={1420}
        min={0}
        max={8000}
        label="Engine"
        valueLabel="1420 revolutions per minute"
        formatOptions={{ notation: 'compact' }}
      />
    </Stack>
  ),
};

/** Sparklines: a line of data the size of a line of text. */
export const Sparklines: StoryObj = {
  render: () => {
    const series = [3, 7, 4, 9, 6, 11, 8, 14];
    return (
      <Stack gap="lg" style={{ maxWidth: 420 }}>
        <Stack direction="row" gap="md" align="center">
          <strong style={{ fontSize: 24 }}>14</strong>
          <Sparkline values={series} />
          <span className="sb-label">beside the number it is about</span>
        </Stack>

        <Stack direction="row" gap="md" align="center">
          <Sparkline values={series} variant="area" />
          <Sparkline values={series} variant="bar" />
          <Sparkline values={[5, 5, 5, 5]} />
          <Sparkline values={[7]} />
        </Stack>

        <span className="sb-label">
          A flat series runs down the middle and a single point is a dot — neither is a special case in the
          component, only in the arithmetic.
        </span>
      </Stack>
    );
  },
};

/** Pinned scales, so several sparklines can honestly be compared with each other. */
export const Comparable: StoryObj = {
  render: () => (
    <Stack gap="sm" style={{ maxWidth: 320 }}>
      {[
        ['North', [2, 4, 3, 6, 5]],
        ['South', [12, 14, 11, 18, 16]],
        ['East', [7, 6, 9, 8, 10]],
      ].map(([name, values]) => (
        <Stack key={name as string} direction="row" gap="md" align="center">
          <span className="sb-label" style={{ width: 56 }}>
            {name}
          </span>
          <Sparkline values={values as number[]} min={0} max={20} />
          <span className="sb-label">{(values as number[])[(values as number[]).length - 1]}</span>
        </Stack>
      ))}
    </Stack>
  ),
};
