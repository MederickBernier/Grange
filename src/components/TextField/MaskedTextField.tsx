import { forwardRef, useCallback, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useObjectRef } from 'react-aria';
import { useControlledState } from '../../utils';
import { TextField, type TextFieldProps } from './TextField';
import { applyMask, maskCapacity, unmask } from './mask';

export interface MaskedTextFieldProps extends Omit<
  TextFieldProps,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'multiline' | 'rows' | 'maxLength'
> {
  /**
   * The pattern. `0` takes a digit, `L` a letter, `A` either, `*` anything; every other
   * character is a literal that types itself. So `(000) 000-0000`, `0000 0000 0000 0000`, or
   * `AAAA-AAAA-AAAA`.
   */
  mask: string;
  /** What an unfilled position shows. */
  prompt?: string;
  value?: string;
  defaultValue?: string;
  /**
   * Fired with the typed characters only — "5551234567" for a phone mask, not "(555) 123-4567".
   * `includeLiterals` gives you what the field shows instead.
   */
  onChange?: (value: string) => void;
  /** Reports the masked string rather than the raw characters. */
  includeLiterals?: boolean;
  /** Fired when every position in the mask is filled, or stops being. */
  onCompleteChange?: (complete: boolean) => void;
  supportingText?: ReactNode;
}

/**
 * A text field with a pattern mask.
 *
 * This is the one input here with no React Aria hook behind it, because masking is not an
 * accessibility problem — it is a string problem, and it is in `mask.ts`, tested on its own. The
 * field is an ordinary `TextField`, so it keeps the label, the supporting text, the error
 * wiring and both variants without reproducing any of it.
 *
 * Two things worth knowing about how it behaves.
 *
 * The value is laid into the mask as a *stream*, not positionally: every edit strips the field
 * back to the characters that matter and refills the pattern. That is what makes typing, pasting
 * and deleting the same operation, and it is why pasting "555-123-4567" into `(000) 000-0000`
 * works — the dashes do not fit anywhere, so they are dropped rather than shifting the digits.
 *
 * The caret is placed by hand after every edit, because refilling the pattern rewrites the whole
 * string and the browser would otherwise drop the caret at the end. It lands after the last
 * filled position, which is where the next character will go.
 */
export const MaskedTextField = forwardRef<HTMLInputElement, MaskedTextFieldProps>(
  function MaskedTextField(props, forwardedRef) {
    const {
      mask,
      prompt = '_',
      value,
      defaultValue,
      onChange,
      includeLiterals = false,
      onCompleteChange,
      ...rest
    } = props;

    const ref = useObjectRef(forwardedRef);
    const [raw, setRaw] = useControlledState<string>(
      value === undefined ? undefined : unmask(value, mask, prompt),
      unmask(defaultValue ?? '', mask, prompt),
    );
    const applied = applyMask(raw, mask, prompt);
    const complete = useRef(applied.complete);
    const caret = useRef<number | null>(null);

    // Set after the render that changed the value, since the DOM node's value is rewritten by
    // then and setting the caret before it would place it in the old string.
    useLayoutEffect(() => {
      const at = caret.current;
      caret.current = null;
      if (at === null || !ref.current) return;
      ref.current.setSelectionRange(at, at);
    });

    const report = useCallback(
      (next: string) => {
        const nextApplied = applyMask(next, mask, prompt);
        setRaw(next);
        caret.current = nextApplied.caret;
        onChange?.(includeLiterals ? nextApplied.display : nextApplied.raw);
        if (nextApplied.complete !== complete.current) {
          complete.current = nextApplied.complete;
          onCompleteChange?.(nextApplied.complete);
        }
      },
      [includeLiterals, mask, onChange, onCompleteChange, prompt, setRaw],
    );

    return (
      <TextField
        {...rest}
        ref={ref}
        value={applied.display}
        onChange={(shown) => report(unmask(shown, mask, prompt))}
        /*
         * Deliberately no maxLength. The obvious cap is the mask's own length, and it is a trap:
         * the prompt characters already fill the field to exactly that length, so the browser
         * refuses every keystroke and the field silently cannot be typed into. The mask is the
         * cap — applyMask writes no more than the pattern holds.
         */
      />
    );
  },
);

/** How many characters a mask will take, for a caller that wants to say so in its own UI. */
export { maskCapacity };
