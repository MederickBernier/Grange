import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, IconButton, ToggleButton, type ButtonSize } from '../src';
import { AddIcon, ArrowIcon, HeartFilledIcon, HeartIcon } from './icons';

const sizes: ButtonSize[] = ['xs', 's', 'm', 'l', 'xl'];
const variants = ['filled', 'tonal', 'outlined', 'elevated', 'text'] as const;

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Label', variant: 'filled', size: 's', shape: 'round', disabled: false },
  argTypes: {
    variant: { control: 'inline-radio', options: variants },
    size: { control: 'inline-radio', options: sizes },
    shape: { control: 'inline-radio', options: ['round', 'square'] },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

/** Press and hold: the corners morph to the pressed radius. */
export const Playground: Story = {};

export const WithIcon: Story = { args: { icon: <AddIcon />, children: 'Create' } };

/** Every color style at every size. */
export const VariantsBySize: Story = {
  render: () => (
    <div className="sb-grid">
      <span />
      {sizes.map((s) => (
        <span key={s} className="sb-label">
          {s}
        </span>
      ))}
      {variants.map((v) => (
        <Row key={v} label={v}>
          {sizes.map((s) => (
            <Button key={s} variant={v} size={s} icon={s === 'xs' || s === 's' ? undefined : <ArrowIcon />}>
              {v[0]!.toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </Row>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="sb-col">
      {(['round', 'square'] as const).map((shape) => (
        <div key={shape} className="sb-row">
          <span className="sb-label">{shape}</span>
          {sizes.map((s) => (
            <Button key={s} size={s} shape={shape}>
              Label
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="sb-row">
      {variants.map((v) => (
        <Button key={v} variant={v} disabled>
          {v}
        </Button>
      ))}
    </div>
  ),
};

/** Click to toggle. Selected round buttons go square on the fast spatial spring (watch the overshoot). */
export const Toggle: StoryObj<typeof ToggleButton> = {
  render: () => (
    <div className="sb-col">
      {(['filled', 'tonal', 'outlined', 'elevated'] as const).map((v) => (
        <div key={v} className="sb-row">
          <span className="sb-label">{v}</span>
          <ToggleButton variant={v} icon={<HeartIcon />} selectedIcon={<HeartFilledIcon />}>
            Favorite
          </ToggleButton>
          <ToggleButton variant={v} defaultSelected icon={<HeartIcon />} selectedIcon={<HeartFilledIcon />}>
            Favorite
          </ToggleButton>
          <ToggleButton variant={v} size="m" shape="square">
            Square
          </ToggleButton>
          <ToggleButton variant={v} size="l">
            Large
          </ToggleButton>
        </div>
      ))}
    </div>
  ),
};

export const IconButtons: StoryObj<typeof IconButton> = {
  render: () => (
    <div className="sb-col">
      {(['standard', 'filled', 'tonal', 'outlined'] as const).map((v) => (
        <div key={v} className="sb-row">
          <span className="sb-label">{v}</span>
          {sizes.map((s) => (
            <IconButton key={s} variant={v} size={s} aria-label="Add">
              <AddIcon />
            </IconButton>
          ))}
          <IconButton variant={v} toggle aria-label="Favorite" selectedIcon={<HeartFilledIcon />}>
            <HeartIcon />
          </IconButton>
          <IconButton
            variant={v}
            toggle
            defaultSelected
            aria-label="Favorite"
            selectedIcon={<HeartFilledIcon />}
          >
            <HeartIcon />
          </IconButton>
        </div>
      ))}
      <div className="sb-row">
        <span className="sb-label">widths</span>
        {(['narrow', 'default', 'wide'] as const).map((w) => (
          <IconButton key={w} variant="filled" size="m" width={w} aria-label={`${w} add`}>
            <AddIcon />
          </IconButton>
        ))}
      </div>
    </div>
  ),
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="sb-label">{label}</span>
      {children}
    </>
  );
}
