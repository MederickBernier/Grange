/** From Compose SwitchTokens. */
export const switchSpec = {
  trackWidth: 52,
  trackHeight: 32,
  /** Outline on the track while unselected, px. Selected has none. */
  trackOutlineWidth: 2,
  /** The handle grows as it goes: 16 off, 24 on, 28 while pressed. */
  handleOff: 16,
  handleOn: 24,
  handlePressed: 28,
  /** An icon inside the handle, px. */
  iconSize: 16,
  stateLayerSize: 40,
} as const;

/**
 * Where the handle sits for a given size.
 *
 * The tokens give the handle's three sizes but no insets. Every one of them divides the track
 * evenly, so the rule is a single one: equal padding all round, with the handle at the start
 * when off and the end when on. At 32px tall that puts the 16px handle 8px in, the 24px handle
 * 4px in and the 28px handle 2px in.
 */
export function handlePosition(size: number, selected: boolean): { inset: number; x: number } {
  const inset = (switchSpec.trackHeight - size) / 2;
  return { inset, x: selected ? switchSpec.trackWidth - size - inset : inset };
}

/** The handle size for the current interaction, px. */
export function handleSize(options: { selected: boolean; pressed: boolean; hasIcon: boolean }): number {
  if (options.pressed) return switchSpec.handlePressed;
  if (options.selected || options.hasIcon) return switchSpec.handleOn;
  return switchSpec.handleOff;
}
