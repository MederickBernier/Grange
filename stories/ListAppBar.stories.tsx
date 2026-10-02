import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AppBar,
  Card,
  Checkbox,
  Divider,
  Icon,
  IconButton,
  List,
  ListItem,
  Radio,
  RadioGroup,
} from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * Lists and top app bars.
 *
 * A list row is content, not a control, so `List` renders semantic list markup rather than a
 * listbox. For a list of options use `Select`, for actions use `Menu`, and for a selectable list
 * put a `Checkbox` or a `Radio` in a row's slot, which is how the spec draws list selection.
 */
const meta: Meta = {
  title: 'Components/List and App bar',
  parameters: { layout: 'padded' },
};
export default meta;

/** One, two and three lines, which the tokens give 56, 72 and 88px. */
export const Lines: StoryObj = {
  render: () => (
    <Card variant="outlined" style={{ maxWidth: 400, padding: 0 }}>
      <List contained aria-label="Line counts">
        <ListItem leading={<Icon><HeartIcon /></Icon>}>One line</ListItem>
        <Divider inset="start" />
        <ListItem leading={<Icon><CheckIcon /></Icon>} supportingText="With a second line under it">
          Two lines
        </ListItem>
        <Divider inset="start" />
        <ListItem
          leading={<Icon><AddIcon /></Icon>}
          overline="Overline"
          supportingText="And a second line as well"
        >
          Three lines
        </ListItem>
      </List>
    </Card>
  ),
};

/** Rows carry a leading slot, a trailing slot and trailing text, such as a timestamp. */
export const Slots: StoryObj = {
  render: () => (
    <Card variant="outlined" style={{ maxWidth: 440, padding: 0 }}>
      <List contained aria-label="Inbox">
        {[
          { from: 'Ada Lovelace', about: 'Notes on the Analytical Engine', at: '09:12' },
          { from: 'Grace Hopper', about: 'About that compiler', at: '08:40' },
          { from: 'Alan Turing', about: 'Re: the imitation game', at: 'Yesterday' },
        ].map((mail) => (
          <ListItem
            key={mail.from}
            leading={<Icon><HeartIcon /></Icon>}
            trailingText={mail.at}
            trailing={
              <IconButton aria-label={`Flag ${mail.from}`}>
                <Icon>
                  <CheckIcon />
                </Icon>
              </IconButton>
            }
            supportingText={mail.about}
          >
            {mail.from}
          </ListItem>
        ))}
      </List>
    </Card>
  ),
};

/** Given an onClick or an href, the row becomes the control, which is what navigation wants. */
export const Navigation: StoryObj = {
  render: function Render() {
    const [current, setCurrent] = useState('inbox');
    return (
      <Card variant="filled" style={{ maxWidth: 320, padding: 0 }}>
        <List contained aria-label="Mailboxes">
          {[
            { id: 'inbox', label: 'Inbox', count: '24' },
            { id: 'starred', label: 'Starred', count: '3' },
            { id: 'sent', label: 'Sent', count: '' },
            { id: 'spam', label: 'Spam', count: '91' },
          ].map((box) => (
            <ListItem
              key={box.id}
              leading={<Icon><ArrowIcon /></Icon>}
              trailingText={box.count || undefined}
              selected={current === box.id}
              onClick={() => setCurrent(box.id)}
            >
              {box.label}
            </ListItem>
          ))}
        </List>
      </Card>
    );
  },
};

/**
 * Selection is composition: a checkbox or a radio in a slot. The row itself stays content, which
 * is why it is not also clickable here.
 */
export const Selection: StoryObj = {
  render: function Render() {
    const [picked, setPicked] = useState<string[]>(['a']);
    const toggle = (id: string) =>
      setPicked(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);

    return (
      <div className="sb-row" style={{ gap: 24, alignItems: 'flex-start' }}>
        <Card variant="outlined" style={{ width: 300, padding: 0 }}>
          <List contained aria-label="Multiple choice">
            {[
              { id: 'a', label: 'Attachments' },
              { id: 'b', label: 'Calendar invites' },
              { id: 'c', label: 'Newsletters' },
            ].map((row) => (
              <ListItem
                key={row.id}
                leading={
                  <Checkbox
                    aria-label={row.label}
                    checked={picked.includes(row.id)}
                    onChange={() => toggle(row.id)}
                  />
                }
              >
                {row.label}
              </ListItem>
            ))}
          </List>
        </Card>

        <Card variant="outlined" style={{ width: 300, padding: 0 }}>
          <RadioGroup aria-label="Single choice" defaultValue="daily">
            <List contained>
              {[
                { id: 'instant', label: 'Instantly' },
                { id: 'daily', label: 'Once a day' },
                { id: 'weekly', label: 'Once a week' },
              ].map((row) => (
                <ListItem key={row.id} leading={<Radio value={row.id} aria-label={row.label} />}>
                  {row.label}
                </ListItem>
              ))}
            </List>
          </RadioGroup>
        </Card>
      </div>
    );
  },
};

/**
 * The five sizes. Small keeps the title in the row with the icons; the taller sizes drop it onto
 * a line of its own. The two flexible sizes are M3 Expressive's, and each grows when a subtitle
 * is present, which the classic medium and large do not.
 */
export const AppBarSizes: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 24 }}>
      {(['small', 'medium', 'large', 'mediumFlexible', 'largeFlexible'] as const).map((size) => (
        <div key={size}>
          <p className="sb-label">{size}</p>
          <AppBar
            size={size}
            title="Inbox"
            leading={
              <IconButton aria-label="Open the menu">
                <Icon>
                  <AddIcon />
                </Icon>
              </IconButton>
            }
            actions={
              <IconButton aria-label="Search">
                <Icon>
                  <CheckIcon />
                </Icon>
              </IconButton>
            }
          />
        </div>
      ))}
    </div>
  ),
};

/** A subtitle makes a flexible bar taller. The classic sizes keep their one height. */
export const AppBarSubtitles: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 24 }}>
      {(['medium', 'mediumFlexible', 'largeFlexible'] as const).map((size) => (
        <div key={size}>
          <p className="sb-label">{size}, with a subtitle</p>
          <AppBar size={size} title="Inbox" subtitle="24 unread" />
        </div>
      ))}
    </div>
  ),
};

/**
 * Scroll the panel: the bar switches to the on-scroll colour and elevation the tokens publish
 * separately. Which container scrolls is the app's to know, so the bar takes it as a prop rather
 * than assuming it is the window.
 */
export const OnScroll: StoryObj = {
  render: function Render() {
    const [scrolled, setScrolled] = useState(false);
    return (
      <div style={{ maxWidth: 420, border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
        <AppBar
          title="Inbox"
          subtitle={scrolled ? 'Scrolled' : 'At the top'}
          size="mediumFlexible"
          scrolled={scrolled}
          leading={
            <IconButton aria-label="Back">
              <Icon>
                <ArrowIcon />
              </Icon>
            </IconButton>
          }
        />
        <div
          style={{ height: 240, overflowY: 'auto' }}
          onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
        >
          <List aria-label="Messages">
            {Array.from({ length: 20 }, (_, i) => (
              <ListItem key={i} supportingText={`Message body ${i + 1}`} onClick={() => {}}>
                Message {i + 1}
              </ListItem>
            ))}
          </List>
        </div>
      </div>
    );
  },
};

/** Small bars may centre their title, which the taller sizes may not. */
export const Centered: StoryObj = {
  render: () => (
    <AppBar
      centered
      title="Settings"
      leading={
        <IconButton aria-label="Back">
          <Icon>
            <ArrowIcon />
          </Icon>
        </IconButton>
      }
      actions={
        <IconButton aria-label="Help">
          <Icon>
            <HeartIcon />
          </Icon>
        </IconButton>
      }
    />
  ),
};
