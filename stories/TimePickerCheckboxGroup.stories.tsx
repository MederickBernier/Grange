import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import { Time } from '@internationalized/date';
import { Checkbox, CheckboxGroup, Dialog, FilledButton, TextButton, TimePicker } from '../src';

/**
 * Two of the gaps the roadmap recorded, now closed: the clock dial the time picker was missing,
 * and the checkbox group a single `Checkbox` cannot express.
 *
 * The dial is a 256px face with a 48px handle, straight
 * from TimePickerTokens. It is a circular slider and says so — `role="slider"` with an
 * `aria-valuetext` that reads the hour or minute out — which is what lets a keyboard set 9:07,
 * something a ring of twelve buttons cannot do.
 */
const meta: Meta = {
  title: 'Components/Time picker and Checkbox group',
  parameters: { layout: 'padded' },
};
export default meta;

/** Press or drag the face. Or Tab to it: the arrows move a unit, Page Up and Down five. */
export const Dial: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState(new Time(9, 30));
    return (
      <div className="sb-col">
        <TimePicker aria-label="Select time" headline="Select time" value={value} onChange={setValue} />
        <p className="sb-label">{value.toString()}</p>
      </div>
    );
  },
};

/**
 * A 24-hour face has two rings, and on a pointer the distance from the middle picks between
 * them, so dragging inwards goes from the afternoon into the small hours. There is no AM and PM
 * to make room for, so the boxes take the wider token.
 */
export const TwentyFourHour: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState(new Time(17, 5));
    return (
      <div className="sb-col">
        <TimePicker
          aria-label="Select time"
          headline="Select time"
          hourCycle={24}
          value={value}
          onChange={setValue}
        />
        <p className="sb-label">{value.toString()}</p>
      </div>
    );
  },
};

/** The AM/PM selector stands beside the boxes or sits under them. */
export const PeriodLayouts: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {(['vertical', 'horizontal'] as const).map((orientation) => (
        <div key={orientation} className="sb-col">
          <p className="sb-label">{orientation}</p>
          <TimePicker
            aria-label="Select time"
            defaultValue={new Time(9, 30)}
            periodOrientation={orientation}
          />
        </div>
      ))}
    </div>
  ),
};

/** The hour cycle follows the locale when it is not given one. */
export const Locales: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {['en-US', 'en-GB'].map((locale) => (
        <div key={locale} className="sb-col">
          <p className="sb-label">{locale}</p>
          <I18nProvider locale={locale}>
            <TimePicker aria-label="Select time" defaultValue={new Time(17, 5)} />
          </I18nProvider>
        </div>
      ))}
    </div>
  ),
};

/**
 * The spec's two modes behind one value, with a button that swaps them. Give
 * `onModeChange` and the toggle appears; leave it out and the picker stays on whichever mode it
 * was given.
 */
export const BothModes: StoryObj = {
  render: function Render() {
    const [mode, setMode] = useState<'dial' | 'input'>('dial');
    const [value, setValue] = useState(new Time(9, 30));
    return (
      <div className="sb-col">
        <TimePicker
          aria-label="Select time"
          headline="Select time"
          mode={mode}
          onModeChange={setMode}
          value={value}
          onChange={setValue}
        />
        <p className="sb-label">{value.toString()}</p>
      </div>
    );
  },
};

/** The spec's time picker is this inside a modal, which `Dialog` already provides. */
export const InADialog: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(new Time(9, 30));
    const [draft, setDraft] = useState(value);
    return (
      <div className="sb-col">
        <FilledButton
          onClick={() => {
            setDraft(value);
            setOpen(true);
          }}
        >
          {value.toString()}
        </FilledButton>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          headline="Select time"
          actions={
            <>
              <TextButton onClick={() => setOpen(false)}>Cancel</TextButton>
              <TextButton
                onClick={() => {
                  setValue(draft);
                  setOpen(false);
                }}
              >
                OK
              </TextButton>
            </>
          }
        >
          <TimePicker aria-label="Select time" value={draft} onChange={setDraft} />
        </Dialog>
      </div>
    );
  },
};

/**
 * The checkbox group. A lone `Checkbox` is still a complete control; this is for what one box
 * cannot say — "choose at least one" — where the validity and the message belong to the set.
 * Every box in the group points at the same message, which is what `useCheckboxGroup` is for.
 */
export const Group: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<string[]>(['mail']);
    const empty = value.length === 0;
    return (
      <div className="sb-col" style={{ gap: 32 }}>
        <CheckboxGroup
          label="Notify me by"
          value={value}
          onChange={setValue}
          required
          error={empty}
          supportingText="Pick any that suit you"
          errorText="Choose at least one"
        >
          <Checkbox value="mail">Email</Checkbox>
          <Checkbox value="sms">Text message</Checkbox>
          <Checkbox value="push">Push notification</Checkbox>
        </CheckboxGroup>

        <CheckboxGroup label="Horizontal" orientation="horizontal" defaultValue={['b']}>
          <Checkbox value="a">One</Checkbox>
          <Checkbox value="b">Two</Checkbox>
          <Checkbox value="c">Three</Checkbox>
        </CheckboxGroup>

        <CheckboxGroup label="Disabled" disabled defaultValue={['a']}>
          <Checkbox value="a">One</Checkbox>
          <Checkbox value="b">Two</Checkbox>
        </CheckboxGroup>
      </div>
    );
  },
};
