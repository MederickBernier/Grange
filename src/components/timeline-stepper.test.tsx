import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GrangeProvider, Step, Stepper, Timeline, TimelineItem, list, stepper, timeline } from '../index';

describe('tokens', () => {
  it('borrows the timeline metrics from ListTokens and the divider', () => {
    expect(timeline.marker).toBe(list.leadingIcon); // 24
    expect(timeline.gap).toBe(list.betweenSpace); // 12
    expect(timeline.rail).toBe(1); // the divider's thickness
  });

  it('gives the stepper a larger marker, because it carries a numeral', () => {
    expect(stepper.marker).toBeGreaterThan(timeline.marker);
    expect(stepper.rail).toBe(timeline.rail);
    expect(stepper.gap).toBe(timeline.gap);
  });
});

describe('Timeline', () => {
  const entries = (
    <>
      <TimelineItem title="Ordered" time="Monday" dateTime="2026-10-05">
        Paid for.
      </TimelineItem>
      <TimelineItem title="Shipped" time="Tuesday" current />
      <TimelineItem title="Delivered" />
    </>
  );

  it('is an ordered list, because the order is the content', () => {
    render(<Timeline aria-label="Delivery">{entries}</Timeline>);
    const olist = screen.getByRole('list', { name: 'Delivery' });
    expect(olist.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders a machine-readable time when it is given one', () => {
    const { container } = render(<Timeline>{entries}</Timeline>);
    const time = container.querySelector('time')!;
    expect(time.getAttribute('datetime')).toBe('2026-10-05');
    expect(time.textContent).toBe('Monday');
    // The entry without a dateTime does not get a <time> it cannot fill in.
    expect(container.querySelectorAll('time')).toHaveLength(1);
  });

  it('hides the rail and the markers, which only draw the order the list already carries', () => {
    const { container } = render(<Timeline>{entries}</Timeline>);
    const rails = container.querySelectorAll('[aria-hidden="true"]');
    expect(rails.length).toBe(3);
  });

  it('marks the current entry and the last one', () => {
    const { container } = render(<Timeline>{entries}</Timeline>);
    const items = [...container.querySelectorAll('.grange-timeline-item')] as HTMLElement[];
    expect(items[1]!.dataset.current).toBe('true');
    expect(items[2]!.dataset.last).toBe('true');
    expect(items[0]!.dataset.last).toBeUndefined();
  });

  it('alternates sides only when it is vertical', () => {
    const { container, rerender } = render(<Timeline alternating>{entries}</Timeline>);
    const sides = () =>
      [...container.querySelectorAll('.grange-timeline-item')].map((el) => (el as HTMLElement).dataset.side);
    expect(sides()).toEqual(['start', 'end', 'start']);

    // A horizontal rail has one side, so asking for both would only mean a second row.
    rerender(
      <Timeline alternating orientation="horizontal">
        {entries}
      </Timeline>,
    );
    expect(sides()).toEqual([undefined, undefined, undefined]);
  });

  it('takes its orientation from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Timeline: { orientation: 'horizontal' } }}>
        <Timeline>{entries}</Timeline>
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-timeline') as HTMLElement).dataset.orientation).toBe('horizontal');
  });
});

describe('Stepper', () => {
  const steps = (
    <>
      <Step label="Account" />
      <Step label="Address" />
      <Step label="Payment" optional />
      <Step label="Review" />
    </>
  );
  const step = (name: string | RegExp) => screen.getByRole('button', { name });

  it('is an ordered list of buttons, and marks the current step', () => {
    render(<Stepper defaultValue={1}>{steps}</Stepper>);
    expect(screen.getByRole('list', { name: 'Progress' }).tagName).toBe('OL');
    expect(step(/^Address/).getAttribute('aria-current')).toBe('step');
    expect(step(/^Account/).getAttribute('aria-current')).toBeNull();
  });

  it('says what state each step is in, rather than only drawing it', () => {
    render(<Stepper defaultValue={1}>{steps}</Stepper>);
    expect(step(/^Account/).textContent).toContain('Step 1 of 4, completed');
    expect(step(/^Address/).textContent).toContain('Step 2 of 4, current');
    expect(step(/^Payment/).textContent).toContain('Step 3 of 4, not started, optional');
  });

  it('goes back to a finished step', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Stepper defaultValue={2} onChange={onChange}>
        {steps}
      </Stepper>,
    );
    await user.click(step(/^Account/));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('refuses to skip ahead while it is linear', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Stepper defaultValue={0} onChange={onChange}>
        {steps}
      </Stepper>,
    );
    const ahead = step(/^Review/);
    expect(ahead.getAttribute('aria-disabled')).toBe('true');
    await user.click(ahead);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves an unreachable step readable rather than disabled', () => {
    render(<Stepper defaultValue={0}>{steps}</Stepper>);
    // aria-disabled, not disabled: the path ahead is most of what a stepper is for.
    expect(step(/^Review/).hasAttribute('disabled')).toBe(false);
  });

  it('lets any step be reached when it is not linear', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Stepper defaultValue={0} linear={false} onChange={onChange}>
        {steps}
      </Stepper>,
    );
    await user.click(step(/^Review/));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('needs completedSteps to know what is done when it is not linear', () => {
    const { container, rerender } = render(
      <Stepper defaultValue={2} linear={false}>
        {steps}
      </Stepper>,
    );
    const done = () =>
      [...container.querySelectorAll('.grange-step')].map((el) => Boolean((el as HTMLElement).dataset.completed));
    // Nothing is implied by position when the steps are independent.
    expect(done()).toEqual([false, false, false, false]);

    rerender(
      <Stepper defaultValue={2} linear={false} completedSteps={[0, 3]}>
        {steps}
      </Stepper>,
    );
    expect(done()).toEqual([true, false, false, true]);
  });

  it('reports a failed step as failed, not as completed', () => {
    render(
      <Stepper defaultValue={2}>
        <Step label="Account" />
        <Step label="Address" error />
        <Step label="Payment" />
      </Stepper>,
    );
    // It is behind the current step, so position says completed; the error overrules it.
    expect(step(/^Address/).textContent).toContain('Step 2 of 3, failed');
  });

  it('does not reach a disabled step even when it is behind', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Stepper defaultValue={2} onChange={onChange}>
        <Step label="Account" disabled />
        <Step label="Address" />
        <Step label="Payment" />
      </Stepper>,
    );
    await user.click(step(/^Account/));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [at, setAt] = useState(0);
      return (
        <>
          <Stepper value={at} onChange={setAt} linear={false}>
            {steps}
          </Stepper>
          <p>at: {at}</p>
        </>
      );
    }
    render(<Controlled />);
    await user.click(step(/^Payment/));
    expect(screen.getByText('at: 2')).not.toBeNull();
  });

  it('takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Stepper: { orientation: 'vertical', linear: false } }}>
        <Stepper>{steps}</Stepper>
      </GrangeProvider>,
    );
    expect((container.querySelector('.grange-stepper') as HTMLElement).dataset.orientation).toBe('vertical');
    expect(screen.getByRole('button', { name: /^Review/ }).getAttribute('aria-disabled')).toBeNull();
  });
});
