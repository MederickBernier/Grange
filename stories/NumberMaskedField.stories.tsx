import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import { FilledNumberField, MaskedTextField, NumberField, OutlinedNumberField, maskCapacity } from '../src';
import { HeartIcon } from './icons';

/**
 * The first two of the KendoReact catalog's inputs: a number field and a masked one.
 *
 * Both sit in the text field's chrome — `FieldShell`, extracted from `TextField` for exactly
 * this — so the label, the supporting text, the error wiring and both variants come for free and
 * cannot drift from the original.
 */
const meta: Meta = {
  title: 'Components/Number and masked fields',
  parameters: { layout: 'padded' },
};
export default meta;

const column = { display: 'flex', flexDirection: 'column' as const, gap: 24, maxWidth: 360 };

/**
 * It is not `<input type="number">`, and that is the point: a native number input cannot be
 * given a currency or a percent format, disagrees with itself across browsers about the spinner,
 * and reads a decimal comma as nothing at all.
 */
export const Numbers: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState(4);
    return (
      <div style={column}>
        <NumberField label="Quantity" value={value} onChange={setValue} minValue={0} maxValue={10} />
        <p className="sb-label">
          {value} — the steppers stop at 0 and 10, and the button disables itself at the end
        </p>
        <OutlinedNumberField label="Outlined" defaultValue={2} />
        <FilledNumberField label="Stepped by a quarter" defaultValue={0} step={0.25} />
        <NumberField label="No stepper" defaultValue={42} hideStepper supportingText="Typing only" />
        <NumberField
          label="With icons and a suffix"
          defaultValue={70}
          leadingIcon={<HeartIcon />}
          suffix="bpm"
        />
      </div>
    );
  },
};

/** Formats go straight to `Intl.NumberFormat`, which decides both how it reads and what it takes. */
export const Formats: StoryObj = {
  render: () => (
    <div style={column}>
      <NumberField
        label="Price"
        defaultValue={1234.5}
        formatOptions={{ style: 'currency', currency: 'EUR' }}
        step={0.5}
      />
      <NumberField
        label="Rate"
        defaultValue={0.075}
        formatOptions={{ style: 'percent', maximumFractionDigits: 2 }}
        step={0.005}
        supportingText="The value is 0.075; the field says 7.5%"
      />
      <NumberField
        label="Distance"
        defaultValue={5}
        formatOptions={{ style: 'unit', unit: 'kilometer', unitDisplay: 'short' }}
      />
    </div>
  ),
};

/**
 * The same component in two locales. A German user types "1.234,56" and an English one types
 * "1,234.56" — into the same field, with no format string anywhere.
 */
export const Locales: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {['en-US', 'de-DE', 'ar-EG'].map((locale) => (
        <div key={locale} className="sb-col" style={{ maxWidth: 240 }}>
          <p className="sb-label">{locale}</p>
          <I18nProvider locale={locale}>
            <NumberField label="Amount" defaultValue={1234.56} formatOptions={{ maximumFractionDigits: 2 }} />
          </I18nProvider>
        </div>
      ))}
    </div>
  ),
};

export const States: StoryObj = {
  render: () => (
    <div style={column}>
      <NumberField label="Disabled" defaultValue={3} disabled />
      <NumberField label="Read only" defaultValue={3} readOnly />
      <NumberField label="Required" required supportingText="Native validation off by default" />
      <NumberField label="In error" defaultValue={99} error errorText="Must be under 50" />
    </div>
  ),
};

/**
 * The masked field is the one input here with no React Aria hook behind it, because masking is a
 * string problem rather than an accessibility one. The pattern logic is in `mask.ts` and is
 * tested on its own; the field is an ordinary `TextField`.
 *
 * Try pasting "555-123-4567" into the phone field: the dashes fit nowhere, so they are dropped
 * rather than shifting the digits along.
 */
export const Masks: StoryObj = {
  render: function Render() {
    const [phone, setPhone] = useState('');
    const [complete, setComplete] = useState(false);
    return (
      <div style={column}>
        <MaskedTextField
          label="Phone"
          mask="(000) 000-0000"
          value={phone}
          onChange={setPhone}
          onCompleteChange={setComplete}
          supportingText={`${phone.length} of ${maskCapacity('(000) 000-0000')} digits`}
          error={phone.length > 0 && !complete}
          errorText="Needs all ten digits"
        />
        <MaskedTextField label="Card" mask="0000 0000 0000 0000" variant="outlined" />
        <MaskedTextField label="Expiry" mask="00/00" prompt="M" />
        <MaskedTextField label="Licence key" mask="AAAA-AAAA-AAAA" supportingText="Letters or digits" />
        <MaskedTextField label="Postcode" mask="LL0 0LL" supportingText="Letters where L is" />
        <MaskedTextField label="Disabled" mask="(000) 000-0000" defaultValue="5551234567" disabled />
      </div>
    );
  },
};
