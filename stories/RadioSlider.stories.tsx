import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider, Radio, RadioGroup, Slider } from '../src';

/**
 * Radio buttons and sliders. Geometry from Compose RadioButtonTokens and SliderTokens, the
 * latter restyled wholesale by M3 Expressive: a 16px track with a 4 by 44 bar for a handle,
 * sitting in a gap carved out of the track rather than on top of it.
 */
const meta: Meta = {
  title: 'Components/Radio and Slider',
  parameters: { layout: 'padded' },
};
export default meta;

/** The group is the control: Tab reaches it once, then the arrows move within it. */
export const Radios: StoryObj = {
  render: function Render() {
    const [value, setValue] = useState('standard');
    return (
      <div className="sb-col">
        <RadioGroup label="Delivery" value={value} onChange={setValue} name="delivery">
          <Radio value="standard">Standard, 3 to 5 days</Radio>
          <Radio value="express">Express, next day</Radio>
          <Radio value="courier" disabled>
            Courier, unavailable here
          </Radio>
        </RadioGroup>
        <Divider />
        <RadioGroup label="Horizontal" orientation="horizontal" defaultValue="s">
          <Radio value="s">Small</Radio>
          <Radio value="m">Medium</Radio>
          <Radio value="l">Large</Radio>
        </RadioGroup>
        <Divider />
        <RadioGroup label="Error" error defaultValue="no">
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </RadioGroup>
        <Divider />
        <RadioGroup label="Disabled group" disabled defaultValue="a">
          <Radio value="a">One</Radio>
          <Radio value="b">Two</Radio>
        </RadioGroup>
      </div>
    );
  },
};

/**
 * Drag a handle, or focus it and use the arrows. Watch the handle narrow from 4px to 2px while
 * you hold it, which is the Expressive behaviour: the other controls grow when pressed, the
 * slider handle thins so the value under it stays readable.
 */
export const Sliders: StoryObj = {
  render: function Render() {
    const [volume, setVolume] = useState<number | number[]>(40);
    const [price, setPrice] = useState<number | number[]>([20, 80]);
    return (
      <div className="sb-col" style={{ maxWidth: 420, gap: 32 }}>
        <Slider label="Volume" value={volume} onChange={setVolume} />
        <Slider label="Price range" value={price} onChange={setPrice} />
        <Slider label="Stepped, with stop indicators" defaultValue={50} step={25} stops />
        <Slider
          label="Budget"
          defaultValue={1500}
          maxValue={5000}
          step={100}
          formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
        />
        <Slider label="Disabled" defaultValue={30} disabled />
      </div>
    );
  },
};

/**
 * Stop indicators are opt in. A step of 1 over 0 to 100 would be 101 dots, so the spec's stops
 * are for a genuinely discrete slider rather than a fine-grained one.
 */
export const Stops: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ maxWidth: 420, gap: 32 }}>
      <Slider label="step 25, stops on" defaultValue={50} step={25} stops />
      <Slider label="step 25, stops off" defaultValue={50} step={25} />
      <Slider label="step 10, stops on" defaultValue={40} step={10} stops />
    </div>
  ),
};
