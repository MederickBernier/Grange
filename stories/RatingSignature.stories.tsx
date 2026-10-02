import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilledTextField, Rating, Signature } from '../src';
import { HeartFilledIcon, HeartIcon } from './icons';

/**
 * Two more of phase 1's inputs, and neither has a React Aria hook — so for both the question is
 * which existing pattern they actually are.
 *
 * A rating is a radio group: a set of options where exactly one can be chosen. Building it on
 * `useRadioGroup` buys the whole keyboard and real inputs that post in a form, and means a
 * screen reader says "3 stars out of 5, radio button, 3 of 5" instead of reading five graphics.
 *
 * A signature is not a control at all — there is no keyboard way to draw — so it reports itself
 * as a labelled image and says whether anything has been signed.
 */
const meta: Meta = {
  title: 'Components/Rating and Signature',
  parameters: { layout: 'padded' },
};
export default meta;

const column = { display: 'flex', flexDirection: 'column' as const, gap: 24, maxWidth: 420 };

/** Tab to it once, then the arrows move and select. Hover to see what pressing would give. */
export const Ratings: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState(3);
    return (
      <div style={column}>
        <Rating label="How was it?" value={value} onChange={setValue} />
        <p className="sb-label">{value === 0 ? 'not rated' : `${value} of 5`}</p>

        <Rating label="Half stars" precision={0.5} defaultValue={3.5} />
        <Rating label="Out of three" max={3} defaultValue={2} />
        <Rating label="Press the chosen star to clear it" defaultValue={4} allowClear />
      </div>
    );
  },
};

/** Any glyph works the same way, and the option labels are yours to write. */
export const OtherGlyphs: StoryObj = {
  render: () => (
    <div style={column}>
      <Rating
        label="Favourite"
        max={5}
        defaultValue={2}
        icon={<HeartFilledIcon />}
        emptyIcon={<HeartIcon />}
        optionLabel={(value, max) => `${value} of ${max} hearts`}
      />
    </div>
  ),
};

/**
 * Read-only is a different thing from disabled and renders differently. A disabled control is
 * still a control; a read-only rating is a statement, so it becomes one labelled image rather
 * than a group of options nobody can choose from.
 */
export const RatingStates: StoryObj = {
  render: () => (
    <div style={column}>
      <Rating label="Read only" value={4} readOnly />
      <Rating label="Read only, half" value={2.5} precision={0.5} readOnly />
      <Rating label="Disabled" defaultValue={3} disabled />
      <Rating label="Nothing chosen yet" />
    </div>
  ),
};

/**
 * The pad draws into an `<svg>`, not a `<canvas>`. A canvas signature is a bitmap: it blurs when
 * the box is resized, undo means replaying every stroke into a fresh context, and none of it can
 * be tested without a canvas implementation. The same strokes as paths stay crisp at any size,
 * export as readable text, and undo is dropping the last array.
 *
 * Each sample becomes the control point of a quadratic curve through the midpoint between it and
 * the next, which is what stops a coarsely sampled pointer looking like a seismograph.
 */
export const Signatures: StoryObj = {
  render: function Render() {
    const [svg, setSvg] = useState<string | null>(null);
    return (
      <div style={column}>
        <Signature
          label="Sign here"
          onChange={setSvg}
          supportingText="Or type your name below instead"
        />
        <FilledTextField label="Full name" supportingText="The alternative to signing" />
        <p className="sb-label">{svg ? `${svg.length} characters of SVG` : 'nothing signed'}</p>
        {svg && (
          <div className="sb-col">
            <p className="sb-label">What the value renders as, at a different size:</p>
            <div
              style={{ width: 160, border: '1px dashed var(--md-sys-color-outline-variant)' }}
              // The value is a standalone document, so it can be dropped straight into a page.
              dangerouslySetInnerHTML={{ __html: svg.replace('width="320" height="140"', 'width="160"') }}
            />
          </div>
        )}
      </div>
    );
  },
};

export const SignatureStates: StoryObj = {
  render: () => (
    <div style={column}>
      <Signature label="Smaller, thicker ink" width={240} height={100} strokeWidth={4} />
      <Signature label="No controls" hideControls supportingText="The form clears it elsewhere" />
      <Signature label="In error" error supportingText="A signature is required" />
      <Signature label="Disabled" disabled />
      <Signature label="Read only" readOnly />
    </div>
  ),
};
