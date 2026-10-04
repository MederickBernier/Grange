import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BottomSheet,
  Divider,
  DrawerHeadline,
  FilledButton,
  Icon,
  List,
  ListItem,
  NavigationDrawer,
  NavigationItem,
  OutlinedButton,
  TextButton,
  bottomSheet,
} from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * The navigation drawer and the bottom sheet, both edge-anchored panels on the overlay layer.
 *
 * Modal ones sit over the content behind a scrim and bring the whole modal treatment: scroll
 * locked, the page behind hidden from assistive tech, Escape and outside-click, focus contained
 * and restored. Standard ones are part of the layout and have nothing to open or close, and the
 * tokens give them different colours and elevations, so it is not only behaviour.
 */
const meta: Meta = {
  title: 'Components/Drawer and Bottom sheet',
  parameters: { layout: 'padded' },
};
export default meta;

const destinations = [
  { id: 'inbox', label: 'Inbox', icon: <AddIcon /> },
  { id: 'starred', label: 'Starred', icon: <HeartIcon /> },
  { id: 'sent', label: 'Sent', icon: <ArrowIcon /> },
  { id: 'drafts', label: 'Drafts', icon: <CheckIcon /> },
];

/** Standard: in the layout, beside the content, always there. */
export const StandardDrawer: StoryObj = {
  render: function Render() {
    const [current, setCurrent] = useState('inbox');
    return (
      <div
        className="sb-row"
        style={{
          alignItems: 'stretch',
          minHeight: 400,
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <NavigationDrawer aria-label="Mailboxes">
          <DrawerHeadline>Mail</DrawerHeadline>
          {destinations.map((d) => (
            <NavigationItem
              key={d.id}
              icon={<Icon>{d.icon}</Icon>}
              selected={current === d.id}
              onClick={() => setCurrent(d.id)}
            >
              {d.label}
            </NavigationItem>
          ))}
          <Divider inset />
          <DrawerHeadline>Labels</DrawerHeadline>
          <NavigationItem
            icon={
              <Icon>
                <HeartIcon />
              </Icon>
            }
          >
            Personal
          </NavigationItem>
          <NavigationItem
            icon={
              <Icon>
                <HeartIcon />
              </Icon>
            }
          >
            Work
          </NavigationItem>
        </NavigationDrawer>
        <div style={{ flex: 1, padding: 16 }}>
          <p className="sb-label">Showing: {current}</p>
        </div>
      </div>
    );
  },
};

/**
 * Modal: over the content, dismissable, and a different colour and elevation. Open it and try
 * Escape, a click on the scrim, and tabbing around to see focus held inside.
 */
export const ModalDrawer: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState('inbox');
    return (
      <div className="sb-col">
        <FilledButton onClick={() => setOpen(true)}>Open the drawer</FilledButton>
        <p className="sb-label">Showing: {current}</p>
        <NavigationDrawer modal open={open} onOpenChange={setOpen} aria-label="Mailboxes">
          <DrawerHeadline>Mail</DrawerHeadline>
          {destinations.map((d) => (
            <NavigationItem
              key={d.id}
              icon={<Icon>{d.icon}</Icon>}
              selected={current === d.id}
              onClick={() => {
                setCurrent(d.id);
                setOpen(false);
              }}
            >
              {d.label}
            </NavigationItem>
          ))}
        </NavigationDrawer>
      </div>
    );
  },
};

/** It can come from either edge, rounded on whichever side faces the content. */
export const DrawerPlacement: StoryObj = {
  render: function Render() {
    const [placement, setPlacement] = useState<'start' | 'end'>('end');
    const [open, setOpen] = useState(false);
    return (
      <div className="sb-col">
        <div className="sb-row">
          {(['start', 'end'] as const).map((p) => (
            <OutlinedButton key={p} onClick={() => setPlacement(p)}>
              {p}
            </OutlinedButton>
          ))}
          <FilledButton onClick={() => setOpen(true)}>Open from {placement}</FilledButton>
        </div>
        <NavigationDrawer
          modal
          open={open}
          onOpenChange={setOpen}
          placement={placement}
          aria-label="Sections"
        >
          {destinations.map((d) => (
            <NavigationItem key={d.id} icon={<Icon>{d.icon}</Icon>} onClick={() => setOpen(false)}>
              {d.label}
            </NavigationItem>
          ))}
        </NavigationDrawer>
      </div>
    );
  },
};

/**
 * Drag the handle downwards to dismiss, or focus it and hold the down arrow.
 *
 * useMove reports a delta of 1 for an arrow key, which would have made a keyboard dismiss take
 * 120 presses, so the keyboard path is scaled to {bottomSheet.keyboardStep}px a press. Escape
 * works too.
 */
export const ModalSheet: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="sb-col">
        <FilledButton onClick={() => setOpen(true)}>Open the sheet</FilledButton>
        <p className="sb-label">
          Drag the handle down past {bottomSheet.dismissDistance}px, or press the down arrow on it
        </p>
        <BottomSheet open={open} onOpenChange={setOpen} aria-label="Share">
          <List aria-label="Share with">
            {['Copy link', 'Send by email', 'Share to chat', 'Save to files'].map((label) => (
              <ListItem
                key={label}
                leading={
                  <Icon>
                    <ArrowIcon />
                  </Icon>
                }
                onClick={() => setOpen(false)}
              >
                {label}
              </ListItem>
            ))}
          </List>
          <div className="sb-row" style={{ justifyContent: 'flex-end' }}>
            <TextButton onClick={() => setOpen(false)}>Cancel</TextButton>
          </div>
        </BottomSheet>
      </div>
    );
  },
};

/** Standard: part of the layout, no scrim, nothing to dismiss. */
export const StandardSheet: StoryObj = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        minHeight: 360,
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <BottomSheet modal={false} hideHandle aria-label="Now playing">
        <p className="sb-label">Now playing</p>
        <div className="sb-row">
          <FilledButton>Play</FilledButton>
          <OutlinedButton>Skip</OutlinedButton>
        </div>
      </BottomSheet>
    </div>
  ),
};
