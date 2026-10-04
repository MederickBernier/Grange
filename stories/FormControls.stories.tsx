import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, Divider, Switch } from '../src';
import { CheckIcon } from './icons';

/**
 * The first form controls. Both are real inputs underneath, from React Aria's useCheckbox and
 * useSwitch, so they take part in forms and answer the keyboard rather than only looking right.
 *
 * Geometry from Compose CheckboxTokens and SwitchTokens.
 */
const meta: Meta = {
  title: 'Components/Form controls',
  parameters: { layout: 'padded' },
};
export default meta;

export const Checkboxes: StoryObj = {
  render: () => (
    <div className="sb-col">
      <Checkbox>Unchecked</Checkbox>
      <Checkbox defaultChecked>Checked</Checkbox>
      <Checkbox indeterminate>Indeterminate</Checkbox>
      <Divider />
      <Checkbox error>Error, unchecked</Checkbox>
      <Checkbox error defaultChecked>
        Error, checked
      </Checkbox>
      <Divider />
      <Checkbox disabled>Disabled</Checkbox>
      <Checkbox disabled defaultChecked>
        Disabled, checked
      </Checkbox>
      <Checkbox disabled indeterminate>
        Disabled, indeterminate
      </Checkbox>
    </div>
  ),
};

/**
 * The classic use for indeterminate: a parent that is neither on nor off because only some of
 * its children are. Tick one child and watch the parent go mixed.
 */
export const Indeterminate: StoryObj = {
  render: function Render() {
    const [items, setItems] = useState([true, false, false]);
    const checkedCount = items.filter(Boolean).length;
    const all = checkedCount === items.length;
    const some = checkedCount > 0 && !all;

    return (
      <div className="sb-col">
        <Checkbox checked={all} indeterminate={some} onChange={(next) => setItems(items.map(() => next))}>
          Select all
        </Checkbox>
        <div className="sb-col" style={{ paddingInlineStart: 36, gap: 8 }}>
          {items.map((checked, index) => (
            <Checkbox
              key={index}
              checked={checked}
              onChange={(next) => setItems(items.map((v, i) => (i === index ? next : v)))}
            >
              Item {index + 1}
            </Checkbox>
          ))}
        </div>
      </div>
    );
  },
};

/**
 * The handle slides and grows on the selection spring: 16px off, 24px on, and 28px while held
 * down. Press and hold one to see the largest size.
 */
export const Switches: StoryObj = {
  render: () => (
    <div className="sb-col">
      <Switch>Off</Switch>
      <Switch defaultSelected>On</Switch>
      <Divider />
      <Switch selectedIcon={<CheckIcon />} defaultSelected>
        With an icon on
      </Switch>
      <Switch selectedIcon={<CheckIcon />}>Icon given, so the off handle is the larger size</Switch>
      <Divider />
      <Switch disabled>Disabled, off</Switch>
      <Switch disabled defaultSelected>
        Disabled, on
      </Switch>
    </div>
  ),
};

/** Both work in a real form, so this submits and reports what the browser collected. */
export const InAForm: StoryObj = {
  render: function Render() {
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <form
        className="sb-col"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmitted(
            [...data.entries()].map(([k, v]) => `${k}=${typeof v === 'string' ? v : v.name}`).join(', ') ||
              'nothing checked',
          );
        }}
      >
        <Checkbox name="terms" value="accepted">
          Accept the terms
        </Checkbox>
        <Switch name="newsletter" value="yes">
          Send me the newsletter
        </Switch>
        <button type="submit" style={{ alignSelf: 'flex-start' }}>
          Submit
        </button>
        <output className="sb-label">{submitted ?? 'not submitted'}</output>
      </form>
    );
  },
};
