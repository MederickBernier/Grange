/**
 * Pattern masking for `MaskedTextField`.
 *
 * Kept out of the component and free of React so it can be tested as what it is: a pair of pure
 * functions over a string. Masking is the kind of thing that looks finished until someone pastes
 * into the middle of a field, so the edge cases are worth being able to state.
 *
 * The rules are a deliberately small subset of the ones Kendo's MaskedTextBox uses — enough to
 * express a phone number, a date, a card number or a licence key — and everything that is not a
 * rule is a literal that types itself.
 */

/** What each placeholder in a mask will accept. */
export const MASK_RULES: Record<string, (char: string) => boolean> = {
  /** A digit. */
  '0': (c) => /[0-9]/.test(c),
  /** A letter, in any alphabet. */
  L: (c) => /\p{L}/u.test(c),
  /** A letter or a digit. */
  A: (c) => /[\p{L}\p{N}]/u.test(c),
  /** Anything at all, which is how a mask takes a free segment. */
  '*': () => true,
};

export const isRule = (char: string): boolean => Object.hasOwn(MASK_RULES, char);

/** How many of a mask's positions take input, which is the most a value can hold. */
export function maskCapacity(mask: string): number {
  let count = 0;
  for (const char of mask) if (isRule(char)) count += 1;
  return count;
}

export interface MaskApplication {
  /** What the field shows, with the literals in place and the rest filled with the prompt. */
  display: string;
  /** Only the characters the person typed, in order, with no literals and no prompts. */
  raw: string;
  /** Where the caret belongs: just after the last position that was filled. */
  caret: number;
  /** Whether every position in the mask is filled. */
  complete: boolean;
}

/**
 * Lays a run of input characters into a mask.
 *
 * The input is treated as a stream rather than positionally, which is what makes paste and
 * typing the same operation: each character is tried against the next position that takes input,
 * and one that does not fit is dropped rather than shifting everything after it. A literal in
 * the mask is written for you, and a typed character that happens to equal the next literal is
 * swallowed so that typing a phone number with its own dashes does not double them.
 */
export function applyMask(input: string, mask: string, prompt = '_'): MaskApplication {
  const out: string[] = [];
  const raw: string[] = [];
  let caret = 0;
  let cursor = 0;

  for (const slot of mask) {
    if (!isRule(slot)) {
      out.push(slot);
      // A typed copy of the literal is consumed, not written twice.
      if (input[cursor] === slot) cursor += 1;
      // The caret only advances past a literal once something after it has been filled, which
      // this loop decides on the next filled position.
      continue;
    }

    // Skip over anything that cannot go here, rather than stopping at it.
    while (cursor < input.length && !MASK_RULES[slot]!(input[cursor]!)) cursor += 1;

    if (cursor < input.length) {
      out.push(input[cursor]!);
      raw.push(input[cursor]!);
      cursor += 1;
      caret = out.length;
    } else {
      out.push(prompt);
    }
  }

  return { display: out.join(''), raw: raw.join(''), caret, complete: raw.length === maskCapacity(mask) };
}

/**
 * Pulls the typed characters back out of what the field is showing.
 *
 * Used on every edit: the input's value is whatever the browser made of the keystroke, so it is
 * stripped back to the characters that matter and laid into the mask again. That is why
 * backspacing a literal deletes the character before it — the literal was never part of the
 * value to begin with.
 *
 * It asks whether a character could be typed *anywhere* in this mask rather than whether it
 * fits where it currently sits, and that is deliberate: after a delete the browser hands back a
 * string whose characters have all shifted left, so their positions mean nothing. Reading
 * "(55) 123-4567" positionally finds a space sitting where a bracket should be and keeps it;
 * asking "is a space something this mask ever accepts" correctly says no.
 */
export function unmask(display: string, mask: string, prompt = '_'): string {
  const accepts = [...new Set([...mask].filter(isRule))].map((rule) => MASK_RULES[rule]!);
  const out: string[] = [];
  for (const char of display) {
    if (char === prompt) continue;
    if (accepts.some((fits) => fits(char))) out.push(char);
  }
  return out.join('');
}
