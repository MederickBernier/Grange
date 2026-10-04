import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import {
  Carousel,
  CarouselItem,
  Checkbox,
  Icon,
  List,
  ListItem,
  SelectableList,
  SelectableListItem,
} from '../src';
import { HeartIcon } from './icons';

/**
 * The two kinds of list, side by side.
 *
 * `List` is semantic markup and stays the default, because a list row is usually content and the
 * spec draws list selection as a `Checkbox` or a `Radio` in one of a row's slots.
 * `SelectableList` is for the case where picking a row *is* the interaction: one tab stop, arrow
 * keys, Home and End, typeahead, and a real `listbox` role that says how many rows there are and
 * which are selected.
 *
 * A row that carries its own buttons belongs in `List`. ARIA does not allow a control inside an
 * option, so React Aria will not make one reachable — that row wants `useGridList`, which is not
 * built and is recorded as such.
 */
const meta: Meta = {
  title: 'Components/Selectable list',
  parameters: { layout: 'padded' },
};
export default meta;

const people = [
  { key: 'ada', name: 'Ada Lovelace', note: 'Analytical engine', when: '1843' },
  { key: 'alan', name: 'Alan Turing', note: 'On computable numbers', when: '1936' },
  { key: 'grace', name: 'Grace Hopper', note: 'The first compiler', when: '1952' },
  { key: 'edsger', name: 'Edsger Dijkstra', note: 'Shortest paths', when: '1959' },
];

/** Tab to it once, then the arrows move and typing jumps. Try "gr". */
export const Single: StoryObj = {
  render: function Render() {
    const [keys, setKeys] = useState<Set<string>>(new Set(['alan']));
    return (
      <div className="sb-col" style={{ maxWidth: 420 }}>
        <SelectableList
          aria-label="People"
          contained
          selectedKeys={keys}
          onSelectionChange={(next) => setKeys(new Set(next as Set<string>))}
        >
          {people.map((person) => (
            <SelectableListItem key={person.key} supportingText={person.note} trailingText={person.when}>
              {person.name}
            </SelectableListItem>
          ))}
        </SelectableList>
        <p className="sb-label">chosen: {[...keys].join(', ') || 'nothing'}</p>
      </div>
    );
  },
};

/** Multiple selection, and a row disabled by key. */
export const Multiple: StoryObj = {
  render: function Render() {
    const [keys, setKeys] = useState<Set<string>>(new Set(['ada', 'grace']));
    return (
      <div className="sb-col" style={{ maxWidth: 420 }}>
        <SelectableList
          aria-label="People"
          contained
          selectionMode="multiple"
          disabledKeys={['edsger']}
          selectedKeys={keys}
          onSelectionChange={(next) => setKeys(new Set(next as Set<string>))}
        >
          {people.map((person) => (
            <SelectableListItem
              key={person.key}
              leading={
                <Icon>
                  <HeartIcon />
                </Icon>
              }
            >
              {person.name}
            </SelectableListItem>
          ))}
        </SelectableList>
        <p className="sb-label">chosen: {[...keys].join(', ') || 'nothing'}</p>
      </div>
    );
  },
};

/**
 * A list that navigates rather than selects: `onAction` fires on the row that was activated and
 * nothing is left looking chosen afterwards.
 */
export const Navigating: StoryObj = {
  render: function Render() {
    const [went, setWent] = useState<string | null>(null);
    return (
      <div className="sb-col" style={{ maxWidth: 420 }}>
        <SelectableList
          aria-label="Sections"
          contained
          selectionMode="single"
          onAction={(key) => setWent(String(key))}
        >
          <SelectableListItem key="inbox" trailingText="24">
            Inbox
          </SelectableListItem>
          <SelectableListItem key="sent">Sent</SelectableListItem>
          <SelectableListItem key="drafts" trailingText="3">
            Drafts
          </SelectableListItem>
        </SelectableList>
        <p className="sb-label">{went ? `went to ${went}` : 'nothing yet'}</p>
      </div>
    );
  },
};

/**
 * Turned on its side it is a snapping strip of options — the selectable counterpart to
 * `Carousel`, which is a scroll region for browsing and deliberately not a set of options.
 *
 * Shown with a carousel under it for the contrast: the carousel has one tab stop whose arrows
 * scroll the viewport, this has one whose arrows move between options and announce the selection.
 */
export const Horizontal: StoryObj = {
  render: function Render() {
    const colours = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];
    const [keys, setKeys] = useState<Set<string>>(new Set(['2']));
    return (
      <div className="sb-col" style={{ gap: 32 }}>
        <div className="sb-col">
          <p className="sb-label">SelectableList, horizontal — chosen: {[...keys].join(', ')}</p>
          <SelectableList
            aria-label="Covers"
            orientation="horizontal"
            selectedKeys={keys}
            onSelectionChange={(next) => setKeys(new Set(next as Set<string>))}
          >
            {colours.map((colour, index) => (
              <SelectableListItem key={String(index)} textValue={`Cover ${index + 1}`}>
                <span
                  style={{
                    display: 'block',
                    width: 140,
                    height: 96,
                    borderRadius: 12,
                    background: colour,
                  }}
                />
              </SelectableListItem>
            ))}
          </SelectableList>
        </div>

        <div className="sb-col">
          <p className="sb-label">Carousel — browsing, not choosing</p>
          <Carousel aria-label="Covers" variant="uncontained">
            {colours.map((colour) => (
              <CarouselItem key={colour}>
                <span style={{ display: 'block', height: 96, background: colour }} />
              </CarouselItem>
            ))}
          </Carousel>
        </div>
      </div>
    );
  },
};

/** The arrows follow the text direction, which is why the delegate is built with the locale. */
export const RightToLeft: StoryObj = {
  render: () => (
    <I18nProvider locale="ar-EG">
      <div dir="rtl" style={{ maxWidth: 420 }}>
        <SelectableList aria-label="أشخاص" orientation="horizontal" defaultSelectedKeys={['ada']}>
          {people.map((person) => (
            <SelectableListItem key={person.key}>{person.name}</SelectableListItem>
          ))}
        </SelectableList>
      </div>
    </I18nProvider>
  ),
};

/** The other kind, unchanged: rows that carry their own controls. */
export const TheMarkupKind: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <List aria-label="People" contained>
        {people.map((person) => (
          <ListItem
            key={person.key}
            leading={<Checkbox aria-label={`Pick ${person.name}`} />}
            supportingText={person.note}
          >
            {person.name}
          </ListItem>
        ))}
      </List>
    </div>
  ),
};
