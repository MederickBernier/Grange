import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Divider, Icon, Tab, Tabs, TextButton } from '../src';
import { AddIcon, ArrowIcon, CheckIcon, HeartIcon } from './icons';

/**
 * Tabs and cards.
 *
 * Primary tabs stack an icon above the label, colour the active tab with the primary role, and
 * their indicator hugs the label. Secondary tabs keep the icon inline, colour the active tab
 * on-surface, span the indicator across the whole tab and sit above a divider. That is the whole
 * difference, and the tokens agree: only primary publishes an indicator.
 */
const meta: Meta = {
  title: 'Components/Tabs and Card',
  parameters: { layout: 'padded' },
};
export default meta;

export const PrimaryTabs: StoryObj = {
  render: () => (
    <Tabs aria-label="Cities">
      <Tab key="rome" title="Rome">
        <p>Founded on seven hills, and a good deal of myth.</p>
      </Tab>
      <Tab key="athens" title="Athens">
        <p>Older than Rome, and keen that you know it.</p>
      </Tab>
      <Tab key="cairo" title="Cairo">
        <p>Older than both, by a comfortable margin.</p>
      </Tab>
    </Tabs>
  ),
};

/** With icons, primary tabs stack them above the label and the strip takes the taller height. */
export const PrimaryWithIcons: StoryObj = {
  render: () => (
    <Tabs aria-label="Sections">
      <Tab
        key="home"
        title="Home"
        icon={
          <Icon>
            <AddIcon />
          </Icon>
        }
      >
        <p>The home panel.</p>
      </Tab>
      <Tab
        key="saved"
        title="Saved"
        icon={
          <Icon>
            <HeartIcon />
          </Icon>
        }
      >
        <p>Things you kept.</p>
      </Tab>
      <Tab
        key="done"
        title="Done"
        icon={
          <Icon>
            <CheckIcon />
          </Icon>
        }
      >
        <p>Things you finished.</p>
      </Tab>
    </Tabs>
  ),
};

/** Secondary tabs keep the icon inline and sit above a rule. */
export const SecondaryTabs: StoryObj = {
  render: () => (
    <Tabs aria-label="Sections" variant="secondary">
      <Tab
        key="all"
        title="All"
        icon={
          <Icon>
            <AddIcon />
          </Icon>
        }
      >
        <p>Everything.</p>
      </Tab>
      <Tab key="unread" title="Unread">
        <p>Only the unread ones.</p>
      </Tab>
      <Tab key="flagged" title="Flagged">
        <p>Only the flagged ones.</p>
      </Tab>
    </Tabs>
  ),
};

/** A disabled tab stays visible and cannot be reached by click or by arrow. */
export const DisabledAndScrolling: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 32, maxWidth: 420 }}>
      <Tabs aria-label="With a disabled tab" disabledKeys={['archived']}>
        <Tab key="active" title="Active">
          <p>The active ones.</p>
        </Tab>
        <Tab key="archived" title="Archived">
          <p>Not reachable.</p>
        </Tab>
        <Tab key="all" title="All">
          <p>Everything.</p>
        </Tab>
      </Tabs>

      <Tabs aria-label="Many tabs" variant="secondary" scrollable>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
          <Tab key={day} title={day}>
            <p>{day}</p>
          </Tab>
        ))}
      </Tabs>
    </div>
  ),
};

/** All three share the 12px corner; what differs is how they lift off the surface. */
export const Cards: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 16, alignItems: 'stretch' }}>
      {(['elevated', 'filled', 'outlined'] as const).map((variant) => (
        <Card key={variant} variant={variant} style={{ width: 200, gap: 8 }}>
          <strong>{variant}</strong>
          <span>Plain content, with no click target of its own.</span>
        </Card>
      ))}
    </div>
  ),
};

/**
 * Given an onClick, the whole card becomes the target and goes through ButtonBase, so it gets
 * the state layer, the ripple and a focus ring. Hover one: each variant lifts by one level.
 */
export const Interactive: StoryObj = {
  render: function Render() {
    const [chosen, setChosen] = useState<string | null>(null);
    return (
      <div className="sb-col">
        <div className="sb-row" style={{ gap: 16, alignItems: 'stretch' }}>
          {(['elevated', 'filled', 'outlined'] as const).map((variant) => (
            <Card
              key={variant}
              variant={variant}
              onClick={() => setChosen(variant)}
              style={{ width: 200, gap: 8 }}
            >
              <strong>{variant}</strong>
              <span>Press me.</span>
            </Card>
          ))}
        </div>
        <p className="sb-label">{chosen ? `Chose: ${chosen}` : 'Nothing chosen yet'}</p>
      </div>
    );
  },
};

/**
 * A card holding its own actions should not itself be clickable: the spec says pick one, and
 * nesting a control inside a control is ambiguous to use and invalid markup besides.
 */
export const WithActions: StoryObj = {
  render: () => (
    <Card variant="outlined" style={{ maxWidth: 320, gap: 12 }}>
      <strong>Weekly digest</strong>
      <span>Five new items since you last looked.</span>
      <Divider />
      <div className="sb-row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <TextButton>Dismiss</TextButton>
        <TextButton
          icon={
            <Icon>
              <ArrowIcon />
            </Icon>
          }
          trailingIcon
        >
          Open
        </TextButton>
      </div>
    </Card>
  ),
};

/** An href makes it a link, so middle-click and open-in-new-tab work. */
export const AsALink: StoryObj = {
  render: () => (
    <Card
      variant="filled"
      href="https://m3.material.io/components/cards"
      target="_blank"
      rel="noreferrer"
      style={{ maxWidth: 320, gap: 8 }}
    >
      <strong>The spec</strong>
      <span>Opens m3.material.io in a new tab.</span>
    </Card>
  ),
};
