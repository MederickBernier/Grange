import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatchPicker,
  ColorWheel,
  FlatColorPicker,
  Stack,
  parseColor,
  type Color,
} from '../src';

/**
 * The colour controls: a saturation/brightness square, a channel slider, a hue ring and a text
 * field.
 *
 * Material has no colour picker — none of the token files exist, and that is no surprise, since
 * a picker is a tool rather than a surface. So the sizes are chosen, out of values the library
 * already draws: the track is `ListTokens`' leading-icon size and the swatch its avatar.
 *
 * **None of these is a canvas, and that is the whole point.** Every one is a range input under
 * the paint, so it is reachable by keyboard and described in words. The square exposes a single
 * control with `aria-roledescription="2D slider"` and a value text that reads "Saturation: 50%,
 * Brightness: 60%, Hue: 220°, dark grayish cyan blue" — the colour named, not just numbered,
 * which is something a canvas picker can never offer.
 *
 * The square's axes follow the **value's own colour space** rather than defaulting to
 * saturation and brightness: asking an `rgb()` or hex value for its saturation throws, so a
 * forced default would be a crash waiting for a hex.
 */
const meta: Meta = {
  title: 'Components/Colour',
  parameters: { layout: 'padded' },
};
export default meta;

/** The square and a hue slider, which is the usual pair. */
export const AreaAndHue: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<Color>(parseColor('hsb(220, 60%, 80%)'));
    return (
      <Stack gap="md" style={{ width: 240 }}>
        <ColorArea value={value} onChange={setValue} xChannel="saturation" yChannel="brightness" />
        <ColorSlider channel="hue" value={value} onChange={setValue} />
        <ColorSlider channel="alpha" value={value} onChange={setValue} />
        <code className="sb-label">{value.toString('hsl')}</code>
      </Stack>
    );
  },
};

/** The ring, which is hue drawn round. The hole is where a square goes. */
export const Wheel: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<Color>(parseColor('hsl(210, 100%, 50%)'));
    return (
      <Stack gap="md" align="start">
        <ColorWheel value={value} onChange={setValue} />
        <code className="sb-label">{value.toString('hsl')}</code>
      </Stack>
    );
  },
};

/** Channels, one slider each. An alpha track shows the colour fading, not a grey ramp. */
export const Channels: StoryObj = {
  render: () => (
    <Stack gap="lg" style={{ width: 280 }}>
      <ColorSlider channel="red" defaultValue="rgb(120, 80, 200)" />
      <ColorSlider channel="green" defaultValue="rgb(120, 80, 200)" />
      <ColorSlider channel="blue" defaultValue="rgb(120, 80, 200)" />
      <ColorSlider channel="alpha" defaultValue="rgba(120, 80, 200, 0.5)" />
    </Stack>
  ),
};

/** The field, wearing the same chrome as every other field here. */
export const Fields: StoryObj = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: 280 }}>
      <ColorField label="Brand" defaultValue="#6750A4" supportingText="Arrow keys nudge the hex" />
      <ColorField variant="outlined" label="Accent" defaultValue="#7D5260" />
      <ColorField label="Surface" defaultValue="#FFFBFE" showSwatch={false} />
      <ColorField label="Danger" defaultValue="#FFFFFF" error errorText="Pick something darker" />
    </Stack>
  ),
};

/** The whole set wired to one value, which is what a picker is. */
export const Together: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<Color>(parseColor('hsb(280, 55%, 70%)'));
    return (
      <Stack direction="row" gap="xl" align="start">
        <Stack gap="md" style={{ width: 200 }}>
          <ColorArea
            value={value}
            onChange={setValue}
            xChannel="saturation"
            yChannel="brightness"
            size={200}
          />
          <ColorSlider channel="hue" value={value} onChange={setValue} />
        </Stack>
        <Stack gap="md" style={{ width: 200 }}>
          <ColorField
            label="Hex"
            value={value.toFormat('rgb')}
            onChange={(next) => next && setValue(next.toFormat('hsb'))}
          />
          <code className="sb-label">{value.toString('hex')}</code>
        </Stack>
      </Stack>
    );
  },
};

const palette = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#009688',
  '#4caf50',
  '#ffeb3b',
  '#ff9800',
  '#795548',
  '#607d8b',
];

/**
 * A palette. Each swatch is **named** — "vivid red", not "#f44336" — because a grid that reads
 * out hex codes is a grid nobody can use by ear. The arrow keys move across the rows rather
 * than along a list, which needs a keyboard delegate of its own.
 */
export const Swatches: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<Color>(parseColor('#9c27b0'));
    return (
      <Stack gap="md" align="start">
        <ColorSwatchPicker
          colors={palette}
          value={value}
          onChange={setValue}
          columns={6}
          aria-label="Palette"
        />
        <code className="sb-label">{value.toString('hex')}</code>
      </Stack>
    );
  },
};

/** The whole thing behind a swatch: the catalog's ColorPicker. */
export const Picker: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState<Color>(parseColor('#6750A4'));
    return (
      <Stack direction="row" gap="lg" align="center">
        <ColorPicker
          label="Brand"
          value={value}
          onChange={setValue}
          showAlpha
          presets={palette.slice(0, 6)}
        />
        <code className="sb-label">{value.toString('hex')}</code>
      </Stack>
    );
  },
};

/** The same panel on the page rather than in a popover — the catalog's FlatColorPicker. */
export const Flat: StoryObj = {
  render: () => <FlatColorPicker label="Brand" defaultValue="#386A20" presets={palette.slice(0, 6)} />,
};
