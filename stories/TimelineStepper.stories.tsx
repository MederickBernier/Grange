import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilledButton, Icon, Step, Stepper, TextButton, Timeline, TimelineItem } from '../src';
import { CheckIcon, HeartIcon, PersonIcon } from './icons';

/**
 * A timeline and a stepper: a sequence you read, and a sequence you walk.
 *
 * Material names neither, and androidx has no `TimelineTokens` or `StepperTokens`, so every
 * number here is chosen — out of values that are captured elsewhere. The marker is `ListTokens`'
 * 24px leading-icon size, the rail is the divider's one pixel, and the spacing is the list's
 * between- and leading-space, so both sit on the same rhythm as a list row.
 *
 * Both are ordered lists, because in both the order *is* the content. The rails, dots and
 * connectors are `aria-hidden`: they draw an order the markup already carries, and reading them
 * would say the same thing twice. The stepper goes further and says each step's state out loud —
 * "Step 2 of 4, completed" — because a green tick that announces nothing is the usual failure.
 */
const meta: Meta = {
  title: 'Components/Timeline and Stepper',
  parameters: { layout: 'padded' },
};
export default meta;

/** A vertical timeline, the common one. The middle entry is the one it is about. */
export const Entries: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Timeline aria-label="Delivery">
        <TimelineItem title="Ordered" time="Mon 5 Oct" dateTime="2026-10-05">
          Paid by card.
        </TimelineItem>
        <TimelineItem title="Packed" time="Tue 6 Oct" dateTime="2026-10-06" />
        <TimelineItem
          title="Out for delivery"
          time="Wed 7 Oct"
          dateTime="2026-10-07"
          current
          marker={
            <Icon size={16}>
              <HeartIcon />
            </Icon>
          }
        >
          With the driver since 08:10.
        </TimelineItem>
        <TimelineItem title="Delivered" time="Expected today" />
      </Timeline>
    </div>
  ),
};

/** Alternating sides, which is a grid change rather than a different component. */
export const Alternating: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Timeline alternating aria-label="Releases">
        <TimelineItem title="0.1.0" time="March">
          Buttons and tokens.
        </TimelineItem>
        <TimelineItem title="0.2.0" time="May">
          Fields and overlays.
        </TimelineItem>
        <TimelineItem title="0.3.0" time="August" current>
          Dates and times.
        </TimelineItem>
      </Timeline>
    </div>
  ),
};

/** Horizontal, where the rail runs across instead of down. */
export const Horizontal: StoryObj = {
  render: () => (
    <Timeline orientation="horizontal" aria-label="Build">
      <TimelineItem title="Checkout" time="0:04" />
      <TimelineItem title="Install" time="0:21" />
      <TimelineItem title="Test" time="1:38" current />
      <TimelineItem title="Publish" />
    </Timeline>
  ),
};

/**
 * A linear stepper: you may go back, you may stay, you may not skip ahead to a step whose
 * predecessors have not been filled in. Unreachable steps are `aria-disabled` rather than
 * `disabled`, so the path ahead stays readable — which is most of what a stepper is for.
 */
export const Linear: StoryObj = {
  render: function Render() {
    const [at, setAt] = useState(1);
    return (
      <div className="sb-col" style={{ gap: 24 }}>
        <Stepper value={at} onChange={setAt}>
          <Step label="Account" supportingText="Signed in" />
          <Step label="Address" supportingText="Where it goes" />
          <Step label="Payment" optional />
          <Step label="Review" />
        </Stepper>
        <div className="sb-row" style={{ gap: 8 }}>
          <TextButton disabled={at === 0} onClick={() => setAt(at - 1)}>
            Back
          </TextButton>
          <FilledButton disabled={at === 3} onClick={() => setAt(at + 1)}>
            Next
          </FilledButton>
        </div>
      </div>
    );
  },
};

/** A failed step. Failure overrules position: a step behind the current one is not completed. */
export const Failed: StoryObj = {
  render: () => (
    <Stepper defaultValue={2}>
      <Step label="Account" />
      <Step label="Address" error supportingText="Postcode not recognised" />
      <Step label="Payment" />
      <Step label="Review" />
    </Stepper>
  ),
};

/**
 * Non-linear, where position says nothing about what is done — so `completedSteps` has to say
 * it. Any step can be reached.
 */
export const NonLinear: StoryObj = {
  render: function Render() {
    const [at, setAt] = useState(0);
    const [done, setDone] = useState<number[]>([1]);
    return (
      <div className="sb-col" style={{ gap: 24 }}>
        <Stepper value={at} onChange={setAt} linear={false} completedSteps={done}>
          <Step
            label="Profile"
            icon={
              <Icon size={18}>
                <PersonIcon />
              </Icon>
            }
          />
          <Step label="Preferences" />
          <Step label="Notifications" />
        </Stepper>
        <div>
          <TextButton
            onClick={() => setDone(done.includes(at) ? done.filter((i) => i !== at) : [...done, at])}
          >
            <Icon size={18}>
              <CheckIcon />
            </Icon>
            Toggle done
          </TextButton>
        </div>
      </div>
    );
  },
};

/** Vertical, for a form that walks down the page. */
export const Vertical: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Stepper orientation="vertical" defaultValue={1}>
        <Step label="Account" supportingText="Signed in as ada@example.com" />
        <Step label="Address" supportingText="Where it goes" />
        <Step label="Payment" optional supportingText="Can be added later" />
        <Step label="Review" />
      </Stepper>
    </div>
  ),
};
