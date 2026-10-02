import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import {
  Checkbox,
  ComboBox,
  ComboBoxItem,
  FilledButton,
  FilledTextField,
  OutlinedComboBox,
  PopoverTrigger,
  Select,
  SelectItem,
  TextButton,
} from '../src';
import { HeartIcon } from './icons';

/**
 * The start of phase 2: the anchored surface, and the first thing that needs it.
 *
 * `ComboBox` is the field half of `Select` with typing added, and it shares both halves rather
 * than reproducing them — the chrome is `FieldShell`, which `TextField` uses, and the list is
 * `OptionList`, which `Select` now uses too. So all three look identical and cannot drift.
 */
const meta: Meta = {
  title: 'Components/Combo box and Popover',
  parameters: { layout: 'padded' },
};
export default meta;

const column = { display: 'flex', flexDirection: 'column' as const, gap: 24, maxWidth: 360 };

const cities = [
  { key: 'par', name: 'Paris', note: 'France' },
  { key: 'rom', name: 'Rome', note: 'Italy' },
  { key: 'osl', name: 'Oslo', note: 'Norway' },
  { key: 'zur', name: 'Zürich', note: 'Switzerland' },
  { key: 'ath', name: 'Athens', note: 'Greece' },
  { key: 'por', name: 'Porto', note: 'Portugal' },
];

/**
 * Type to filter. Focus never leaves the field: the list is read through
 * `aria-activedescendant`, which is what lets a screen reader announce options while typing
 * still works.
 *
 * Try "zur" — it finds Zürich, which a `toLowerCase().includes()` filter would miss.
 */
export const Filtering: StoryObj = {
  render: function Render() {
    const [key, setKey] = useState<string | null>('rom');
    return (
      <div style={column}>
        <ComboBox
          label="City"
          selectedKey={key}
          onSelectionChange={(next) => setKey(next as string | null)}
          supportingText="Starts filtering as you type"
        >
          {cities.map((city) => (
            <ComboBoxItem key={city.key} supportingText={city.note}>
              {city.name}
            </ComboBoxItem>
          ))}
        </ComboBox>
        <p className="sb-label">chosen: {key ?? 'nothing'}</p>
      </div>
    );
  },
};

/**
 * With a fixed list the field will not keep text that matches nothing — that is what makes it a
 * picker rather than a text field with suggestions. `allowsCustomValue` turns it into the latter.
 */
export const CustomValues: StoryObj = {
  render: () => (
    <div style={column}>
      <ComboBox label="Fixed list" supportingText="Type nonsense and tab away">
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </ComboBox>
      <ComboBox label="Custom values allowed" allowsCustomValue supportingText="Keeps what you typed">
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </ComboBox>
    </div>
  ),
};

/** When the list opens, and what it says when nothing matches. */
export const Behaviour: StoryObj = {
  render: () => (
    <div style={column}>
      <ComboBox label="Opens on focus" menuTrigger="focus">
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </ComboBox>
      <ComboBox label="Only on the chevron" menuTrigger="manual">
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </ComboBox>
      <ComboBox label="Nothing matches" emptyState="No city by that name" defaultInputValue="zzz">
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </ComboBox>
    </div>
  ),
};

/**
 * The filter follows the locale, which is not the same as lowercasing. Turkish has two distinct
 * letters where English has one — a dotted i and a dotless ı — so typing "ist" finds Istanbul in
 * English and correctly does not in Turkish.
 */
export const Locales: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {['en-US', 'tr-TR'].map((locale) => (
        <div key={locale} className="sb-col" style={{ maxWidth: 260 }}>
          <p className="sb-label">{locale} — try “ist”</p>
          <I18nProvider locale={locale}>
            <ComboBox label="City">
              <ComboBoxItem key="ist">Istanbul</ComboBoxItem>
              <ComboBoxItem key="ank">Ankara</ComboBoxItem>
              <ComboBoxItem key="izm">Izmir</ComboBoxItem>
            </ComboBox>
          </I18nProvider>
        </div>
      ))}
    </div>
  ),
};

export const States: StoryObj = {
  render: () => (
    <div style={column}>
      <OutlinedComboBox label="Outlined" leadingIcon={<HeartIcon />}>
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </OutlinedComboBox>
      <ComboBox label="Disabled" disabled defaultSelectedKey="par">
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </ComboBox>
      <ComboBox label="In error" error errorText="Pick somewhere we fly to">
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </ComboBox>
      <ComboBox label="With a disabled option" disabledKeys={['por']}>
        {cities.map((city) => (
          <ComboBoxItem key={city.key}>{city.name}</ComboBoxItem>
        ))}
      </ComboBox>
    </div>
  ),
};

/**
 * `PopoverTrigger` is the catalog's Popup: a button and the anchored surface it opens, for
 * content that is not a list.
 *
 * It is a dialog rather than a tooltip, and that is why it exists separately. The moment there is
 * something to interact with inside, a tooltip is the wrong markup: assistive tech cannot reach
 * into one, and it closes on pointer-leave, so its controls can never be pressed.
 */
export const Popovers: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="sb-row" style={{ gap: 16, flexWrap: 'wrap' }}>
        <PopoverTrigger aria-label="Filters">
          <FilledButton>Filters</FilledButton>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 220 }}>
            <FilledTextField label="Contains" />
            <Select label="Status" defaultSelectedKey="any">
              <SelectItem key="any">Any</SelectItem>
              <SelectItem key="open">Open</SelectItem>
            </Select>
            <Checkbox>Only mine</Checkbox>
          </div>
        </PopoverTrigger>

        <PopoverTrigger aria-label="About" placement="end">
          <TextButton>Beside it</TextButton>
          <p style={{ margin: 0, maxWidth: 240 }}>
            Placement flips on its own when there is no room, as the tooltip's does.
          </p>
        </PopoverTrigger>

        <PopoverTrigger aria-label="Controlled" open={open} onOpenChange={setOpen}>
          <FilledButton>{open ? 'Open' : 'Closed'}</FilledButton>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0 }}>Escape and a press outside both close it.</p>
            <TextButton onClick={() => setOpen(false)}>Done</TextButton>
          </div>
        </PopoverTrigger>

        <PopoverTrigger aria-label="Non modal" nonModal>
          <TextButton>Non-modal</TextButton>
          <p style={{ margin: 0, maxWidth: 240 }}>
            The page behind stays usable and is not hidden from assistive tech.
          </p>
        </PopoverTrigger>
      </div>
    );
  },
};
