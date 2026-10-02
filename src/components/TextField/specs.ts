/**
 * From Compose FilledTextFieldTokens and OutlinedTextFieldTokens.
 *
 * Two values are not published and are noted where they are used: the filled variant gives no
 * ContainerHeight, so it takes the outlined one's 56px, which is what the spec draws; and
 * neither gives a horizontal padding, so both use the spec's 16px.
 */

export type TextFieldVariant = 'filled' | 'outlined';

export const textField = {
  /** Container height for a single line, px. Outlined publishes it; filled does not. */
  height: 56,
  /** Leading and trailing space inside the container, px. Not tokenised. */
  padding: 16,
  /** Leading and trailing icon box, px. */
  iconSize: 24,
  /** The filled variant's bottom line, px, at rest and focused. */
  indicatorHeight: 1,
  indicatorHeightFocused: 2,
  /** The outlined variant's border, px, at rest and focused. */
  outlineWidth: 1,
  outlineWidthFocused: 2,
  /** Filled rounds its top corners only; outlined rounds all four. */
  filledCorner: 4,
  outlinedCorner: 4,
} as const;

/** `maxLength` turns the counter on, so this is the text it shows. */
export function counterText(length: number, maxLength: number): string {
  return `${length}/${maxLength}`;
}

/**
 * `aria-describedby` for a field that shows one message at a time.
 *
 * The M3 spec replaces the supporting text with the error rather than showing both, so only one
 * of the two elements is in the DOM. The hook links both unconditionally, which would leave the
 * input described by an element that was never rendered — a dangling reference that announces
 * nothing and looks fine. So the ids are assembled from what is actually on screen.
 */
export function describedBy(
  parts: Array<{ id?: string; shown: boolean }>,
): string | undefined {
  const ids = parts.filter((part) => part.shown && part.id).map((part) => part.id!);
  return ids.length > 0 ? ids.join(' ') : undefined;
}
