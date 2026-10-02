/**
 * No SignatureTokens upstream, and no M3 spec for a signature pad. Everything here is chosen,
 * and chosen to agree with the components it sits beside: the text field's container height
 * scaled up to something you can sign in, the text field's corner, and the outline colour the
 * outlined variant draws its border with.
 */
export const signature = {
  /** The pad, px. Chosen: wide enough for a name at a natural size on a phone. */
  width: 320,
  height: 140,
  /** Corner radius, px. The outlined text field's 4px would look wrong this large; CornerMedium. */
  corner: 12,
  /** The border, px. OutlinedTextFieldTokens.OutlineWidth. */
  outlineWidth: 1,
  /** The ink, px. Chosen: a pen rather than a marker. */
  strokeWidth: 2,
  /**
   * How far the pointer must move before a new sample is kept, px. A pointer can report every
   * pixel, which is more detail than a signature needs and makes the exported path large for
   * nothing.
   */
  sampleTolerance: 1.5,
} as const;
