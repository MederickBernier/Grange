import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Dialog,
  FilledButton,
  GrangeProvider,
  Icon,
  IconButton,
  OutlinedButton,
  OutlinedTextField,
  TextButton,
  Tooltip,
} from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * The first components on the overlay layer. Both portal out of the tree and both lean on React
 * Aria for the parts that are easy to get wrong.
 *
 * Dialog: scroll locked behind it, the rest of the page hidden from assistive tech so a screen
 * reader cannot wander out, Escape and click-outside to close, focus contained and restored.
 *
 * Tooltip: a warmup delay so running the pointer across a row of icons does not flash a tooltip
 * under each one, immediate on keyboard focus, and never on touch.
 */
const meta: Meta = {
  title: 'Components/Dialog and Tooltip',
  parameters: { layout: 'padded' },
};
export default meta;

export const BasicDialog: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <FilledButton onClick={() => setOpen(true)}>Delete account</FilledButton>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          headline="Delete your account?"
          actions={
            <>
              <TextButton onClick={() => setOpen(false)}>Cancel</TextButton>
              <TextButton onClick={() => setOpen(false)}>Delete</TextButton>
            </>
          }
        >
          Everything you have saved will go with it. This cannot be undone.
        </Dialog>
      </>
    );
  },
};

/** With an icon, the spec centres the whole dialog on it. */
export const WithIcon: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <FilledButton onClick={() => setOpen(true)}>Reset settings</FilledButton>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          icon={
            <Icon>
              <HeartIcon />
            </Icon>
          }
          headline="Reset to defaults?"
          actions={
            <>
              <TextButton onClick={() => setOpen(false)}>Cancel</TextButton>
              <TextButton onClick={() => setOpen(false)}>Reset</TextButton>
            </>
          }
        >
          Your customisations will be lost.
        </Dialog>
      </>
    );
  },
};

/**
 * A dialog holding a form. Tab is trapped inside it, and focus returns to the button that opened
 * it when it closes. Try scrolling the page behind it as well.
 */
export const WithForm: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    return (
      <div className="sb-col">
        <p className="sb-label">A tall page, so the scroll lock is visible</p>
        <div
          style={{ height: 400, background: 'var(--md-sys-color-surface-container-low)', borderRadius: 16 }}
        />
        <FilledButton onClick={() => setOpen(true)}>Rename</FilledButton>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          headline="Rename this project"
          actions={
            <>
              <TextButton onClick={() => setOpen(false)}>Cancel</TextButton>
              <TextButton onClick={() => setOpen(false)}>Save</TextButton>
            </>
          }
        >
          <OutlinedTextField label="Project name" value={name} onChange={setName} />
        </Dialog>
      </div>
    );
  },
};

/** Not dismissable: no Escape, no click outside. For a question that has to be answered. */
export const MustAnswer: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <OutlinedButton onClick={() => setOpen(true)}>Open a dialog you must answer</OutlinedButton>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          dismissable={false}
          headline="Accept the terms?"
          actions={
            <>
              <TextButton onClick={() => setOpen(false)}>Decline</TextButton>
              <TextButton onClick={() => setOpen(false)}>Accept</TextButton>
            </>
          }
        >
          Escape and clicking outside are both off, so one of the buttons has to be used.
        </Dialog>
      </>
    );
  },
};

/**
 * Run the pointer across the row: only the one you settle on shows a tooltip. Then Tab through
 * them, where each shows at once.
 */
export const Tooltips: StoryObj = {
  render: () => (
    <div className="sb-row">
      <Tooltip content="Add something">
        <IconButton aria-label="Add">
          <Icon>
            <AddIcon />
          </Icon>
        </IconButton>
      </Tooltip>
      <Tooltip content="Mark as done">
        <IconButton aria-label="Confirm">
          <Icon>
            <CheckIcon />
          </Icon>
        </IconButton>
      </Tooltip>
      <Tooltip content="Add to favourites, a longer label that wraps onto two lines">
        <IconButton aria-label="Favourite">
          <Icon>
            <HeartIcon />
          </Icon>
        </IconButton>
      </Tooltip>
      <Tooltip content="Go forward" placement="bottom">
        <IconButton aria-label="Forward">
          <Icon>
            <ArrowIcon />
          </Icon>
        </IconButton>
      </Tooltip>
    </div>
  ),
};

/** Tooltips work on anything that forwards props and a ref, not just icon buttons. */
export const TooltipPlacements: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ alignItems: 'center', gap: 48, padding: 48 }}>
      {(['top', 'bottom', 'start', 'end'] as const).map((placement) => (
        <Tooltip key={placement} content={`Placed at ${placement}`} placement={placement}>
          <OutlinedButton>{placement}</OutlinedButton>
        </Tooltip>
      ))}
    </div>
  ),
};

/**
 * Overlays go to the body by default. `portalContainer` sends them somewhere else, which an
 * embedded widget needs so the overlay lands in the right stacking and style context.
 */
export const ScopedPortal: StoryObj = {
  render: function Render() {
    const host = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [ready, setReady] = useState(false);
    return (
      <div className="sb-col">
        <div
          ref={(node) => {
            host.current = node;
            if (node && !ready) setReady(true);
          }}
          style={{
            position: 'relative',
            minHeight: 240,
            padding: 16,
            borderRadius: 16,
            border: '2px dashed var(--md-sys-color-outline-variant)',
          }}
        >
          <p className="sb-label">Overlays land inside this box</p>
          {ready && (
            <GrangeProvider portalContainer={host.current}>
              <FilledButton onClick={() => setOpen(true)}>Open here</FilledButton>
              <Dialog
                open={open}
                onOpenChange={setOpen}
                headline="Portalled into the box"
                actions={<TextButton onClick={() => setOpen(false)}>Close</TextButton>}
              >
                Inspect the DOM: this sits inside the dashed container, not at the end of body.
              </Dialog>
            </GrangeProvider>
          )}
        </div>
      </div>
    );
  },
};
