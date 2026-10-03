import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Autocomplete,
  ComboBoxItem,
  FilledButton,
  Form,
  MultiSelect,
  MultiSelectItem,
  OutlinedMultiSelect,
} from '../src';
import { HeartIcon } from './icons';

/**
 * Two more of phase 2. Neither has a hook of its own, and the two answers differ.
 *
 * `MultiSelect` is assembled: a multiple-selection `useListBox` in the popover, and a real
 * `useTagGroup` for the chips. `Autocomplete` is a wrapper over `ComboBox`, because that is
 * honestly all it is — the same hook with the selection taken out.
 */
const meta: Meta = {
  title: 'Components/Multi select and Autocomplete',
  parameters: { layout: 'padded' },
};
export default meta;

const column = { display: 'flex', flexDirection: 'column' as const, gap: 24, maxWidth: 400 };

const colours = [
  { key: 'red', name: 'Red' },
  { key: 'orange', name: 'Orange' },
  { key: 'yellow', name: 'Yellow' },
  { key: 'green', name: 'Green' },
  { key: 'blue', name: 'Blue' },
  { key: 'indigo', name: 'Indigo' },
  { key: 'violet', name: 'Violet' },
];

/**
 * The chips are a tag group, not a row of buttons — so they have their own arrow keys and a live
 * region that announces a removal. Tab reaches the chips, then the chevron.
 *
 * Escape closes the list. That needed opting out of React Aria's default, where Escape in a
 * multiple-selection listbox clears everything you have chosen instead.
 */
export const Choosing: StoryObj = {
  render: function Render() {
    const [keys, setKeys] = useState<Set<string>>(new Set(['red', 'blue']));
    return (
      <div style={column}>
        <MultiSelect
          label="Colours"
          placeholder="Pick some"
          selectedKeys={keys}
          onSelectionChange={(next) => setKeys(new Set(next as Set<string>))}
          supportingText="As many as you like"
        >
          {colours.map((colour) => (
            <MultiSelectItem key={colour.key}>{colour.name}</MultiSelectItem>
          ))}
        </MultiSelect>
        <p className="sb-label">chosen: {[...keys].join(', ') || 'nothing'}</p>
      </div>
    );
  },
};

/** The chips wrap, so the field grows rather than scrolling sideways. */
export const Many: StoryObj = {
  render: () => (
    <div style={column}>
      <OutlinedMultiSelect
        label="Colours"
        defaultSelectedKeys={colours.map((colour) => colour.key)}
        leadingIcon={<HeartIcon />}
      >
        {colours.map((colour) => (
          <MultiSelectItem key={colour.key}>{colour.name}</MultiSelectItem>
        ))}
      </OutlinedMultiSelect>
    </div>
  ),
};

export const MultiSelectStates: StoryObj = {
  render: () => (
    <div style={column}>
      <MultiSelect label="Disabled" defaultSelectedKeys={['red', 'green']} disabled>
        {colours.map((colour) => (
          <MultiSelectItem key={colour.key}>{colour.name}</MultiSelectItem>
        ))}
      </MultiSelect>
      <MultiSelect label="In error" error errorText="Pick at least two" defaultSelectedKeys={['red']}>
        {colours.map((colour) => (
          <MultiSelectItem key={colour.key}>{colour.name}</MultiSelectItem>
        ))}
      </MultiSelect>
      <MultiSelect label="With a disabled option" disabledKeys={['indigo']} placeholder="Pick some">
        {colours.map((colour) => (
          <MultiSelectItem key={colour.key}>{colour.name}</MultiSelectItem>
        ))}
      </MultiSelect>
    </div>
  ),
};

/** Each chosen key posts as its own value, so the form receives a list under one name. */
export const InAForm: StoryObj = {
  render: function Render() {
    const [submitted, setSubmitted] = useState<unknown>(null);
    return (
      <div style={column}>
        <Form
          aria-label="Paint"
          onSubmit={(values, event) => {
            event.preventDefault();
            setSubmitted(values);
          }}
          actions={<FilledButton type="submit">Save</FilledButton>}
        >
          <MultiSelect label="Colours" name="colours" defaultSelectedKeys={['red', 'blue']}>
            {colours.map((colour) => (
              <MultiSelectItem key={colour.key}>{colour.name}</MultiSelectItem>
            ))}
          </MultiSelect>
        </Form>
        {submitted != null && (
          <pre className="sb-label" style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </div>
    );
  },
};

/**
 * `Autocomplete` has no chevron and no chosen option: the text is the value, and whatever is
 * typed stands. The suggestions are still a real listbox with the arrows, Escape and
 * `aria-activedescendant` behind them — what is gone is the idea that one of them has to win.
 */
export const Suggesting: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState('');
    const [taken, setTaken] = useState<string | null>(null);
    return (
      <div style={column}>
        <Autocomplete
          label="City"
          value={value}
          onChange={setValue}
          onSuggestionTaken={setTaken}
          supportingText="Type anything; the suggestions are only suggestions"
        >
          {['Paris', 'Porto', 'Prague', 'Rome', 'Riga'].map((city) => (
            <ComboBoxItem key={city.toLowerCase()}>{city}</ComboBoxItem>
          ))}
        </Autocomplete>
        <p className="sb-label">
          value: “{value}”{taken ? `, last suggestion taken: ${taken}` : ''}
        </p>
      </div>
    );
  },
};
