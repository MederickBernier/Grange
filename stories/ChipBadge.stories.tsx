import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Chip, ChipGroup, Icon, IconButton, NavigationBar, NavigationItem } from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartFilledIcon, HeartIcon } from './icons';

/**
 * Chips and badges.
 *
 * The M3 Expressive detail in `ChipsTokens` is that selection changes a chip's **shape**, not
 * only its colour: medium corners unselected, fully round selected. That radius rides the
 * selection spring, so toggling a filter chip is worth watching.
 */
const meta: Meta = {
  title: 'Components/Chip and Badge',
  parameters: { layout: 'padded' },
};
export default meta;

/** The four kinds the catalog lists. */
export const Kinds: StoryObj = {
  render: function Render() {
    const [selected, setSelected] = useState(false);
    const [tags, setTags] = useState(['Ada', 'Grace', 'Alan']);
    return (
      <div className="sb-col" style={{ gap: 24 }}>
        <div>
          <p className="sb-label">Assist, which colours its icon with the primary role</p>
          <ChipGroup aria-label="Assist">
            <Chip
              variant="assist"
              icon={
                <Icon>
                  <AddIcon />
                </Icon>
              }
              onClick={() => {}}
            >
              Add to calendar
            </Chip>
            <Chip
              variant="assist"
              icon={
                <Icon>
                  <ArrowIcon />
                </Icon>
              }
              onClick={() => {}}
            >
              Get directions
            </Chip>
          </ChipGroup>
        </div>

        <div>
          <p className="sb-label">Filter, selectable. Toggle it and watch the corners round</p>
          <ChipGroup aria-label="Filter">
            <Chip
              variant="filter"
              selected={selected}
              icon={
                selected ? (
                  <Icon>
                    <CheckIcon />
                  </Icon>
                ) : undefined
              }
              onClick={() => setSelected(!selected)}
            >
              Unread
            </Chip>
          </ChipGroup>
        </div>

        <div>
          <p className="sb-label">Input, removable</p>
          <ChipGroup aria-label="Recipients">
            {tags.map((tag) => (
              <Chip
                key={tag}
                variant="input"
                avatar={
                  <Icon>
                    <HeartIcon />
                  </Icon>
                }
                onRemove={() => setTags(tags.filter((t) => t !== tag))}
                removeLabel={`Remove ${tag}`}
              >
                {tag}
              </Chip>
            ))}
            {tags.length === 0 && <p className="sb-label">All removed</p>}
          </ChipGroup>
        </div>

        <div>
          <p className="sb-label">Suggestion</p>
          <ChipGroup aria-label="Suggestions">
            {['Sounds good', 'On my way', 'Later today'].map((s) => (
              <Chip key={s} variant="suggestion" onClick={() => {}}>
                {s}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      </div>
    );
  },
};

/** A working filter set, which is what filter chips are for. */
export const Filters: StoryObj = {
  render: function Render() {
    const [active, setActive] = useState<string[]>(['unread']);
    const toggle = (id: string) =>
      setActive(active.includes(id) ? active.filter((a) => a !== id) : [...active, id]);

    return (
      <div className="sb-col">
        <ChipGroup aria-label="Filters">
          {[
            { id: 'unread', label: 'Unread' },
            { id: 'flagged', label: 'Flagged' },
            { id: 'attachments', label: 'Has attachments' },
            { id: 'today', label: 'Today' },
          ].map((f) => (
            <Chip
              key={f.id}
              variant="filter"
              selected={active.includes(f.id)}
              icon={
                active.includes(f.id) ? (
                  <Icon>
                    <CheckIcon />
                  </Icon>
                ) : undefined
              }
              onClick={() => toggle(f.id)}
            >
              {f.label}
            </Chip>
          ))}
        </ChipGroup>
        <p className="sb-label">{active.length ? `Active: ${active.join(', ')}` : 'No filters'}</p>
      </div>
    );
  },
};

/** Elevated chips drop the outline and lift instead. Disabled flattens either shape. */
export const ElevatedAndDisabled: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 16 }}>
      <ChipGroup aria-label="Elevated">
        <Chip onClick={() => {}}>Flat, outlined</Chip>
        <Chip elevated onClick={() => {}}>
          Elevated
        </Chip>
      </ChipGroup>
      <ChipGroup aria-label="Disabled">
        <Chip disabled>Disabled</Chip>
        <Chip variant="filter" selected disabled>
          Disabled, selected
        </Chip>
        <Chip elevated disabled>
          Disabled, elevated
        </Chip>
        <Chip variant="input" disabled onRemove={() => {}}>
          Disabled, removable
        </Chip>
      </ChipGroup>
    </div>
  ),
};

/**
 * A badge is a 6px dot, or 16px once it carries a count.
 *
 * It is hidden from assistive tech unless labelled, because a "9" floating beside an
 * already-named icon reads as noise. Label it only when the badge is the only thing carrying
 * the information.
 */
export const Badges: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 24 }}>
      <div className="sb-row" style={{ alignItems: 'center', gap: 16 }}>
        <span className="sb-label">On their own</span>
        <Badge />
        <Badge>1</Badge>
        <Badge>9</Badge>
        <Badge>99+</Badge>
      </div>

      <div className="sb-row" style={{ alignItems: 'center', gap: 16 }}>
        <span className="sb-label">On a control</span>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton aria-label="Notifications, 3 unread">
            <Icon>
              <HeartIcon />
            </Icon>
          </IconButton>
          <span style={{ position: 'absolute', top: 4, right: 4 }}>
            <Badge>3</Badge>
          </span>
        </span>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton aria-label="Messages, some unread">
            <Icon>
              <HeartFilledIcon />
            </Icon>
          </IconButton>
          <span style={{ position: 'absolute', top: 8, right: 8 }}>
            <Badge />
          </span>
        </span>
      </div>

      <div style={{ maxWidth: 420 }}>
        <p className="sb-label">In a navigation bar, which takes badges directly</p>
        <NavigationBar aria-label="Main">
          <NavigationItem
            icon={
              <Icon>
                <AddIcon />
              </Icon>
            }
            selected
          >
            Home
          </NavigationItem>
          <NavigationItem
            icon={
              <Icon>
                <HeartIcon />
              </Icon>
            }
            badge="9"
          >
            Saved
          </NavigationItem>
          <NavigationItem
            icon={
              <Icon>
                <CheckIcon />
              </Icon>
            }
            badge=""
          >
            Done
          </NavigationItem>
        </NavigationBar>
      </div>
    </div>
  ),
};
