/**
 * From Compose LinearProgressIndicatorTokens, CircularProgressIndicatorTokens and the shared
 * ProgressIndicatorTokens. The wave values are what M3 Expressive added; Compose exposes them
 * through separate wavy composables, and here they are the `wavy` prop on the same component
 * because they come out of the same token object.
 */

export const linearProgress = {
  /** Track and active bar thickness, px. */
  thickness: 4,
  /** Gap between the active bar and the remaining track, px. */
  trackGap: 4,
  /** The dot at the far end of the track, px. */
  stopSize: 4,
  /** Height the container needs for the wave to fit, px. */
  waveHeight: 10,
  waveAmplitude: 3,
  /** Determinate and indeterminate use different wavelengths, px. */
  waveWavelength: 40,
  indeterminateWaveWavelength: 20,
} as const;

export const circularProgress = {
  /** Diameter without a wave, px. */
  size: 40,
  /** Diameter with one, since the wave needs room to swing outwards, px. */
  waveSize: 48,
  thickness: 4,
  trackGap: 4,
  waveAmplitude: 1.6,
  waveWavelength: 15,
} as const;
