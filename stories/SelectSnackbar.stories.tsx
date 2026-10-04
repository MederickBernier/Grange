import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FilledButton,
  Icon,
  OutlinedButton,
  Select,
  SelectItem,
  SnackbarRegion,
  TextButton,
  createSnackbarQueue,
  snackbar,
} from '../src';
import { CheckIcon, HeartIcon } from './icons';

/**
 * Select and Snackbar, the last two on the overlay layer.
 *
 * Select wears the text field's clothes and reuses the menu's rows, so it lines up with both
 * rather than nearly lining up. There is a real hidden `<select>` underneath, so it posts in a
 * form and the browser's own autofill can see it.
 *
 * Snackbar drains a queue that lives outside React, so anything can post to it, including code
 * with no component to hang a hook off.
 */
const meta: Meta = {
  title: 'Components/Select and Snackbar',
  parameters: { layout: 'padded' },
};
export default meta;

const column = { display: 'flex', flexDirection: 'column' as const, gap: 24, maxWidth: 360 };

export const Selects: StoryObj = {
  render: function Render() {
    const [country, setCountry] = useState<string | null>('gb');
    return (
      <div className="sb-row" style={{ gap: 32, alignItems: 'flex-start' }}>
        <div style={column}>
          <p className="sb-label">Filled</p>
          <Select
            label="Country"
            placeholder="Pick one"
            selectedKey={country}
            onSelectionChange={(key) => setCountry(key as string | null)}
          >
            <SelectItem key="gb">United Kingdom</SelectItem>
            <SelectItem key="fr">France</SelectItem>
            <SelectItem key="de">Germany</SelectItem>
            <SelectItem key="es">Spain</SelectItem>
          </Select>
          <Select label="Empty" placeholder="Nothing chosen">
            <SelectItem key="a">Option A</SelectItem>
            <SelectItem key="b">Option B</SelectItem>
          </Select>
          <Select label="Disabled" placeholder="Cannot open" disabled>
            <SelectItem key="a">Option A</SelectItem>
          </Select>
        </div>
        <div style={column}>
          <p className="sb-label">Outlined</p>
          <Select label="Country" variant="outlined" placeholder="Pick one" defaultSelectedKey="fr">
            <SelectItem key="gb">United Kingdom</SelectItem>
            <SelectItem key="fr">France</SelectItem>
            <SelectItem key="de">Germany</SelectItem>
          </Select>
          <Select
            label="With supporting text"
            variant="outlined"
            placeholder="Pick one"
            supportingText="Where the invoice is sent"
          >
            <SelectItem key="gb">United Kingdom</SelectItem>
            <SelectItem key="fr">France</SelectItem>
          </Select>
          <Select label="Error" variant="outlined" error errorText="Choose a country" placeholder="Pick one">
            <SelectItem key="gb">United Kingdom</SelectItem>
          </Select>
        </div>
      </div>
    );
  },
};

/** Options can carry an icon and a second line, the same as a menu's rows. */
export const RichOptions: StoryObj = {
  render: () => (
    <div style={column}>
      <Select label="Plan" placeholder="Pick a plan" variant="outlined">
        <SelectItem
          key="free"
          icon={
            <Icon>
              <HeartIcon />
            </Icon>
          }
          supportingText="No card needed"
        >
          Free
        </SelectItem>
        <SelectItem
          key="pro"
          icon={
            <Icon>
              <CheckIcon />
            </Icon>
          }
          supportingText="Billed yearly"
        >
          Pro
        </SelectItem>
        <SelectItem key="team" supportingText="Five seats or more">
          Team
        </SelectItem>
      </Select>
    </div>
  ),
};

/** It is a real select underneath, so this submits like any other field. */
export const InAForm: StoryObj = {
  render: function Render() {
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <form
        style={column}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmitted(
            [...data.entries()].map(([k, v]) => `${k}=${typeof v === 'string' ? v : v.name}`).join(', ') ||
              'nothing chosen',
          );
        }}
      >
        <Select label="Country" name="country" placeholder="Pick one" variant="outlined">
          <SelectItem key="gb">United Kingdom</SelectItem>
          <SelectItem key="fr">France</SelectItem>
        </Select>
        <FilledButton type="submit">Submit</FilledButton>
        <output className="sb-label">{submitted ?? 'not submitted'}</output>
      </form>
    );
  },
};

/**
 * Hover a snackbar before it expires and it waits: useToastRegion holds one open while it is
 * pointed at or focused, so it cannot vanish part-read.
 */
export const Snackbars: StoryObj = {
  render: function Render() {
    const [queue] = useState(() => createSnackbarQueue());
    return (
      <div className="sb-col">
        <div className="sb-row">
          <FilledButton onClick={() => queue.add({ message: 'Message sent' }, { timeout: snackbar.timeout })}>
            Plain
          </FilledButton>
          <OutlinedButton
            onClick={() =>
              queue.add(
                {
                  message: 'Conversation archived',
                  actionLabel: 'Undo',
                  onAction: () => queue.add({ message: 'Restored' }),
                },
                { timeout: snackbar.timeout },
              )
            }
          >
            With an action
          </OutlinedButton>
          <TextButton
            onClick={() =>
              queue.add(
                {
                  message: 'Could not reach the server. Check your connection and try again.',
                  closeable: true,
                },
                { timeout: snackbar.timeout },
              )
            }
          >
            Two lines, dismissable
          </TextButton>
        </div>
        <p className="sb-label">
          One at a time by default, which is what the spec allows. Hover one to hold it open.
        </p>
        <SnackbarRegion queue={queue} />
      </div>
    );
  },
};

/** The queue decides how many are visible, and the region decides where they sit. */
export const SnackbarPlacement: StoryObj = {
  render: function Render() {
    const [queue] = useState(() => createSnackbarQueue({ maxVisibleToasts: 3 }));
    const [placement, setPlacement] = useState<'bottom' | 'bottom-start' | 'bottom-end'>('bottom');
    return (
      <div className="sb-col">
        <div className="sb-row">
          {(['bottom', 'bottom-start', 'bottom-end'] as const).map((p) => (
            <OutlinedButton key={p} onClick={() => setPlacement(p)}>
              {p}
            </OutlinedButton>
          ))}
        </div>
        <FilledButton onClick={() => queue.add({ message: `Queued at ${new Date().toLocaleTimeString()}` })}>
          Add one
        </FilledButton>
        <p className="sb-label">Up to three at once, placed {placement}</p>
        <SnackbarRegion queue={queue} placement={placement} />
      </div>
    );
  },
};
