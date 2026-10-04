/**
 * Colour controls.
 *
 * Material has no colour picker — `ColorPickerTokens` and the rest are 404 in androidx — which
 * is not surprising: a colour picker is a tool, not a surface, and M3 is about surfaces. So the
 * sizes here are chosen, out of values the library already draws: the thumb is the slider's
 * handle, the track is the slider's track, and the corners come off the shape scale.
 */
import { list } from '../List/specs';

export const color = {
  /** The saturation/brightness square, px. Chosen: a comfortable square for a pointer. */
  areaSize: 192,
  /** A channel slider's thickness, px. Chosen: the list's leading-icon size, so a thumb fits. */
  trackSize: list.leadingIcon,
  /** The thumb, px. Chosen: large enough to be a target, small enough to see the colour under it. */
  thumbSize: 20,
  /** The colour wheel's outer and inner radius, px. Chosen, from the area's size. */
  wheelOuterRadius: 96,
  wheelInnerRadius: 72,
  /** A swatch in a palette, px. Chosen: the list's leading avatar. */
  swatchSize: list.avatar,
} as const;
