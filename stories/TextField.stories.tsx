import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilledTextField, Icon, OutlinedTextField, TextField } from '../src';
import { CheckIcon, HeartIcon } from './icons';

/**
 * Text fields, from Compose FilledTextFieldTokens and OutlinedTextFieldTokens.
 *
 * The label starts inside the field and floats to the top edge once there is a value or focus.
 * Outlined breaks its border for the floated label using a real fieldset and legend, so the gap
 * is exactly the label's width whatever surface the field sits on.
 */
const meta: Meta = {
  title: 'Components/Text field',
  parameters: { layout: 'padded' },
};
export default meta;

const column = { display: 'flex', flexDirection: 'column' as const, gap: 24, maxWidth: 360 };

export const Variants: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start' }}>
      <div style={column}>
        <p className="sb-label">Filled</p>
        <FilledTextField label="Empty" />
        <FilledTextField label="With a value" defaultValue="Hello" />
        <FilledTextField label="Supporting text" supportingText="We never share it" />
        <FilledTextField label="Disabled" defaultValue="Locked" disabled />
      </div>
      <div style={column}>
        <p className="sb-label">Outlined</p>
        <OutlinedTextField label="Empty" />
        <OutlinedTextField label="With a value" defaultValue="Hello" />
        <OutlinedTextField label="Supporting text" supportingText="We never share it" />
        <OutlinedTextField label="Disabled" defaultValue="Locked" disabled />
      </div>
    </div>
  ),
};

/** Click into an empty field and watch the label move out of the way before the text arrives. */
export const FloatingLabel: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start' }}>
      <div style={column}>
        <FilledTextField label="Click me" />
        <FilledTextField label="Already floated" defaultValue="Because there is a value" />
        <FilledTextField label="Placeholder shows through" placeholder="you@example.com" />
      </div>
      <div style={column}>
        <OutlinedTextField label="Click me" />
        <OutlinedTextField label="Already floated" defaultValue="Because there is a value" />
        <OutlinedTextField label="A much longer label, so the notch grows" />
      </div>
    </div>
  ),
};

/** The error text replaces the supporting text, and is announced in its place. */
export const Errors: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState('not-an-email');
    const invalid = !value.includes('@');
    return (
      <div style={column}>
        <FilledTextField
          label="Email"
          value={value}
          onChange={setValue}
          error={invalid}
          supportingText="We never share it"
          errorText="That is not an email address"
        />
        <OutlinedTextField
          label="Email"
          value={value}
          onChange={setValue}
          error={invalid}
          errorText="That is not an email address"
        />
        <p className="sb-label">Type an @ to clear the error</p>
      </div>
    );
  },
};

export const IconsAndAffixes: StoryObj = {
  render: () => (
    <div style={column}>
      <FilledTextField
        label="Search"
        leadingIcon={
          <Icon>
            <HeartIcon />
          </Icon>
        }
      />
      <OutlinedTextField
        label="Confirmed"
        defaultValue="Looks good"
        trailingIcon={
          <Icon>
            <CheckIcon />
          </Icon>
        }
      />
      <OutlinedTextField label="Amount" prefix="£" suffix=".00" defaultValue="42" />
    </div>
  ),
};

/** A counter appears as soon as there is a maxLength, and is announced with the field. */
export const Counter: StoryObj = {
  render: () => (
    <div style={column}>
      <FilledTextField label="Bio" maxLength={40} supportingText="Keep it short" />
      <OutlinedTextField label="Notes" multiline rows={4} maxLength={120} />
    </div>
  ),
};

export const Multiline: StoryObj = {
  render: () => (
    <div style={column}>
      <FilledTextField label="Notes" multiline rows={3} />
      <OutlinedTextField label="Notes" multiline rows={3} defaultValue={'Two\nlines'} />
    </div>
  ),
};

/**
 * Types pass straight through, so the right keyboard shows on a phone.
 *
 * A password field gets the reveal eye by default, as the spec draws it. While revealed the
 * input really is `type="text"`, because that is the only way a browser shows the characters,
 * and hiding it again puts the type back so autofill and password managers still recognise the
 * field. The button is `aria-pressed`, which is what says whether the password is showing.
 */
export const Types: StoryObj = {
  render: () => (
    <div style={column}>
      <OutlinedTextField label="Email" type="email" placeholder="you@example.com" />
      <OutlinedTextField label="Password" type="password" defaultValue="secret" />
      <FilledTextField
        label="Password, no reveal"
        type="password"
        defaultValue="secret"
        revealable={false}
        supportingText="revealable={false} for a value that should never be shown"
      />
      <OutlinedTextField label="Phone" type="tel" />
      <OutlinedTextField label="Quantity" type="number" defaultValue="1" />
      <TextField label="Required, aria only" required supportingText="No browser bubble" />
      <TextField label="Required, native" required validationBehavior="native" />
    </div>
  ),
};
