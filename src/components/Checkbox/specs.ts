/**
 * From Compose CheckboxTokens. ContainerShape is published as `RoundedCornerShape(2.0.dp)`
 * rather than a shape key, so the 2px is read out of it here.
 */
export const checkbox = {
  /** The box itself, px. */
  size: 18,
  /** Corner radius of the box, px. */
  corner: 2,
  /** The tick, px. */
  icon: 18,
  /** Outline width while unselected, px. Selected drops it to 0 and fills instead. */
  outlineWidth: 2,
  /** The round hover and focus layer behind the box, px. */
  stateLayerSize: 40,
} as const;
