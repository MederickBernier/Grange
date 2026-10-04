import type { ReactNode } from 'react';
import { ComboBox, type ComboBoxProps } from './ComboBox';

export interface AutocompleteProps extends Omit<
  ComboBoxProps,
  | 'selectedKey'
  | 'defaultSelectedKey'
  | 'onSelectionChange'
  | 'inputValue'
  | 'defaultInputValue'
  | 'onInputChange'
  | 'allowsCustomValue'
  | 'showOpenButton'
> {
  /** The text, which here is the value: there is no separate notion of a chosen option. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fired when one of the suggestions is taken, with its key. */
  onSuggestionTaken?: (key: string) => void;
  supportingText?: ReactNode;
}

/**
 * A text field that suggests, where the text itself is the value.
 *
 * This is a `ComboBox` with the selection taken out, and it is a wrapper rather than its own
 * component because that is honestly all it is: the same hook, the same chrome, the same list.
 * What changes is the API and therefore the meaning — a combo box has a chosen option and
 * reverts to it, while an autocomplete has only text and keeps whatever was typed.
 *
 * So it sets `allowsCustomValue`, hides the chevron, and reports a string. The suggestions are
 * still a real listbox with the arrows, Escape and `aria-activedescendant` behind them; what is
 * gone is the idea that one of them has to win.
 *
 * `useAutocomplete` is a different thing despite the name, and is deliberately not used here:
 * it is the hook for driving a *separate* collection — a searchable menu — from an input, not
 * for a field with a value.
 */
export function Autocomplete(props: AutocompleteProps) {
  const { value, defaultValue, onChange, onSuggestionTaken, ...rest } = props;

  return (
    <ComboBox
      {...rest}
      inputValue={value}
      defaultInputValue={defaultValue}
      onInputChange={onChange}
      // The text is the value, so anything typed is allowed to stand.
      allowsCustomValue
      showOpenButton={false}
      onSelectionChange={(key) => {
        if (key != null) onSuggestionTaken?.(String(key));
      }}
    />
  );
}
