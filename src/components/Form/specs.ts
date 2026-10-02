/**
 * No FormTokens upstream — a form is layout, not a surface — so the two numbers here are chosen.
 *
 * They are also the first place the missing spacing scale bites: the token file has colour,
 * shape, type, elevation, motion and state-layer opacity and nothing for spacing, so these are
 * literals on M3's 4dp grid until phase 4 introduces a named scale and they can move onto it.
 */
export const form = {
  /** Between fields, px. Enough that two fields' supporting text does not read as one block. */
  gap: 20,
  /** Between the fields and the actions under them, px. */
  actionGap: 24,
} as const;
