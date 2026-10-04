import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fab, Icon, NavigationBar, NavigationItem, NavigationRail } from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartFilledIcon, HeartIcon } from './icons';

/**
 * The navigation bar and rail, for the same top-level destinations at different widths.
 *
 * Both are navigation landmarks holding links or buttons, with the current destination marked by
 * `aria-current`. They are deliberately not tablists: these lead somewhere rather than swapping a
 * panel in place, and a screen reader should say so.
 *
 * The state layer and the ripple sit on the indicator pill rather than the whole item, which is
 * how the spec draws it.
 */
const meta: Meta = {
  title: 'Components/Navigation',
  parameters: { layout: 'padded' },
};
export default meta;

const destinations = [
  { id: 'home', label: 'Home', icon: <AddIcon />, badge: undefined },
  { id: 'search', label: 'Search', icon: <CheckIcon />, badge: undefined },
  { id: 'saved', label: 'Saved', icon: <HeartIcon />, selectedIcon: <HeartFilledIcon />, badge: '9' },
  { id: 'profile', label: 'Profile', icon: <ArrowIcon />, badge: undefined },
];

/** Three to five destinations, dividing the width between them. */
export const Bar: StoryObj = {
  render: function Render() {
    const [current, setCurrent] = useState('home');
    return (
      <div className="sb-col" style={{ maxWidth: 420 }}>
        <NavigationBar aria-label="Main">
          {destinations.map((d) => (
            <NavigationItem
              key={d.id}
              icon={<Icon>{d.icon}</Icon>}
              selectedIcon={d.selectedIcon ? <Icon>{d.selectedIcon}</Icon> : undefined}
              badge={d.badge}
              selected={current === d.id}
              onClick={() => setCurrent(d.id)}
            >
              {d.label}
            </NavigationItem>
          ))}
        </NavigationBar>
        <p className="sb-label">Current: {current}</p>
      </div>
    );
  },
};

/**
 * The inline arrangement is M3 Expressive's: the icon sits beside the label and the indicator
 * spans the pair, which also gives the taller 80px bar somewhere to go.
 */
export const BarArrangements: StoryObj = {
  render: function Render() {
    const [current, setCurrent] = useState('home');
    return (
      <div className="sb-col" style={{ maxWidth: 480, gap: 32 }}>
        {(
          [
            { arrangement: 'vertical', tall: false, label: 'Stacked, 64px' },
            { arrangement: 'vertical', tall: true, label: 'Stacked, tall 80px' },
            { arrangement: 'horizontal', tall: true, label: 'Inline, tall 80px' },
          ] as const
        ).map((variant) => (
          <div key={variant.label}>
            <p className="sb-label">{variant.label}</p>
            <NavigationBar aria-label={variant.label} arrangement={variant.arrangement} tall={variant.tall}>
              {destinations.slice(0, 3).map((d) => (
                <NavigationItem
                  key={d.id}
                  icon={<Icon>{d.icon}</Icon>}
                  selected={current === d.id}
                  onClick={() => setCurrent(d.id)}
                >
                  {d.label}
                </NavigationItem>
              ))}
            </NavigationBar>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Collapsed the rail is a 96px column of stacked items. Expanded it widens and lays them out
 * inline, which M3 Expressive added. The expanded width is a range in the tokens rather than a
 * number, so the layout picks within 220 to 360px.
 */
export const Rail: StoryObj = {
  render: function Render() {
    const [current, setCurrent] = useState('home');
    const [expanded, setExpanded] = useState(false);

    const items = destinations.map((d) => (
      <NavigationItem
        key={d.id}
        icon={<Icon>{d.icon}</Icon>}
        selectedIcon={d.selectedIcon ? <Icon>{d.selectedIcon}</Icon> : undefined}
        badge={d.badge}
        selected={current === d.id}
        onClick={() => setCurrent(d.id)}
      >
        {d.label}
      </NavigationItem>
    ));

    return (
      <div className="sb-col">
        <div className="sb-row">
          <button type="button" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <div
          className="sb-row"
          style={{
            alignItems: 'stretch',
            minHeight: 360,
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <NavigationRail
            aria-label="Sections"
            expanded={expanded}
            header={
              <Fab size="small" aria-label="Compose">
                <Icon>
                  <AddIcon />
                </Icon>
              </Fab>
            }
          >
            {items}
          </NavigationRail>
          <div style={{ flex: 1, padding: 16 }}>
            <p className="sb-label">Content for: {current}</p>
          </div>
        </div>
      </div>
    );
  },
};

/** The narrow 80px rail, for when 96 is more than the layout can spare. */
export const RailWidths: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ alignItems: 'stretch', minHeight: 280, gap: 24 }}>
      {(
        [
          { narrow: false, label: '96px' },
          { narrow: true, label: 'narrow, 80px' },
        ] as const
      ).map((variant) => (
        <div key={variant.label} className="sb-col">
          <p className="sb-label">{variant.label}</p>
          <NavigationRail
            aria-label={variant.label}
            narrow={variant.narrow}
            style={{ border: '1px solid var(--md-sys-color-outline-variant)' }}
          >
            {destinations.slice(0, 3).map((d, i) => (
              <NavigationItem key={d.id} icon={<Icon>{d.icon}</Icon>} selected={i === 0}>
                {d.label}
              </NavigationItem>
            ))}
          </NavigationRail>
        </div>
      ))}
    </div>
  ),
};

/** Items can be real links, which is what navigation usually wants. */
export const AsLinks: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <NavigationBar aria-label="Main">
        <NavigationItem
          icon={
            <Icon>
              <AddIcon />
            </Icon>
          }
          href="#home"
          selected
        >
          Home
        </NavigationItem>
        <NavigationItem
          icon={
            <Icon>
              <CheckIcon />
            </Icon>
          }
          href="#search"
        >
          Search
        </NavigationItem>
        <NavigationItem
          icon={
            <Icon>
              <HeartIcon />
            </Icon>
          }
          href="#saved"
          disabled
        >
          Saved
        </NavigationItem>
      </NavigationBar>
    </div>
  ),
};
