/**
 * Gauges and sparklines.
 *
 * Material has none of these — `GaugeTokens`, `SparklineTokens` and the rest are 404 — which is
 * expected: a gauge is a chart, and M3 stops at components. So the values are chosen, and
 * chosen to agree with the progress indicators, which are the closest thing the spec does
 * publish: the track is `CircularProgressIndicatorTokens`' 4px, and the colours are the same
 * primary-on-secondary-container pair.
 */
import { circularProgress } from '../Progress/specs';

export const gauge = {
  /** The arc's thickness, px. CircularProgressIndicatorTokens: Thickness. */
  thickness: circularProgress.thickness,
  /** A gauge's drawing box, px. Chosen. */
  size: 160,
  /** How far round an arc gauge sweeps, degrees. Chosen: a dial you read like a speedometer. */
  arcSweep: 270,
  /** The needle on a radial gauge, px. Chosen, from the size. */
  needleWidth: 4,
  /** How many intervals the ticks divide the scale into, when none is given. Chosen. */
  ticks: 5,
  /** A linear gauge's bar, px. Chosen: thick enough to read a colour band in. */
  barThickness: 12,
} as const;

export const sparkline = {
  /** The default drawing box, px. Chosen: a line of text and a little more. */
  width: 96,
  height: 24,
  /** The line, px. Chosen: thin enough not to swamp 24 pixels of height. */
  strokeWidth: 1.5,
} as const;
