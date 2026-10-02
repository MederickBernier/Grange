import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  ElevatedButton,
  FilledButton,
  FilledIconButton,
  FilledTonalButton,
  FilledTonalIconButton,
  IconButton,
  OutlinedButton,
  OutlinedIconButton,
  TextButton,
  type ButtonVariant,
} from '../src';
import { ArrowIcon, HeartIcon } from './icons';

/**
 * One component per variant, the way Material Web ships one element per variant. There is no
 * variant prop to misspell and no way to ask for two at once.
 *
 *   <FilledButton>Save</FilledButton>        ~  <md-filled-button>
 *   <FilledTonalButton>Save</FilledTonalButton>  ~  <md-filled-tonal-button>
 *
 * `Button` and `IconButton` keep their variant prop for the one case these cannot cover: a
 * variant chosen at runtime. Size and shape stay props, since Material Web has no size scale.
 */
const meta: Meta = {
  title: 'Components/Variants',
  parameters: { layout: 'padded' },
};
export default meta;

export const Buttons: StoryObj = {
  render: () => (
    <div className="sb-row">
      <FilledButton>Filled</FilledButton>
      <FilledTonalButton>Filled tonal</FilledTonalButton>
      <OutlinedButton>Outlined</OutlinedButton>
      <ElevatedButton>Elevated</ElevatedButton>
      <TextButton>Text</TextButton>
    </div>
  ),
};

export const IconButtons: StoryObj = {
  render: () => (
    <div className="sb-row">
      <IconButton aria-label="Standard">
        <HeartIcon />
      </IconButton>
      <FilledIconButton aria-label="Filled">
        <HeartIcon />
      </FilledIconButton>
      <FilledTonalIconButton aria-label="Filled tonal">
        <HeartIcon />
      </FilledTonalIconButton>
      <OutlinedIconButton aria-label="Outlined">
        <HeartIcon />
      </OutlinedIconButton>
    </div>
  ),
};

/**
 * One icon, placed before the label or after it with `trailingIcon`, matching Material Web's
 * single `slot="icon"` plus its `trailing-icon` attribute.
 */
export const IconPlacement: StoryObj = {
  render: () => (
    <div className="sb-row">
      <FilledButton icon={<HeartIcon />}>Leading</FilledButton>
      <TextButton icon={<ArrowIcon />} trailingIcon>
        Trailing
      </TextButton>
    </div>
  ),
};

/** Sizes and shapes still come from props, since M3 Expressive's scale is not in Material Web. */
export const SizesAndShapes: StoryObj = {
  render: () => (
    <div className="sb-col">
      <div className="sb-row">
        {(['xs', 's', 'm', 'l', 'xl'] as const).map((size) => (
          <FilledButton key={size} size={size}>
            {size}
          </FilledButton>
        ))}
      </div>
      <div className="sb-row">
        <OutlinedButton shape="square">Square</OutlinedButton>
        <OutlinedButton shape="round">Round</OutlinedButton>
      </div>
    </div>
  ),
};

/** The escape hatch: a variant that is only known at runtime. */
export const DynamicVariant: StoryObj<{ variant: ButtonVariant }> = {
  args: { variant: 'tonal' },
  argTypes: {
    variant: { control: 'select', options: ['filled', 'tonal', 'outlined', 'elevated', 'text'] },
  },
  render: ({ variant }: { variant: ButtonVariant }) => <Button variant={variant}>From config</Button>,
};
