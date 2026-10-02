import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonGroup, GrangeProvider, IconButton, type GrangeConfigInput } from '../src';
import { HeartIcon } from './icons';
import styles from './overrides.module.scss';

/**
 * Theming beyond color. GrangeProvider carries four things a product can change without forking
 * a component: the props it defaults to, the classes each slot carries, how it behaves, and its
 * size geometry. Providers nest and merge, so a subtree can change part of it.
 */
const meta: Meta = {
  title: 'Foundations/Overrides',
  parameters: { layout: 'padded' },
};
export default meta;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.panel}>
      <p className={styles.title}>{title}</p>
      <div className="sb-row">{children}</div>
    </div>
  );
}

const row = (
  <>
    <Button>Save</Button>
    <Button variant="outlined">Cancel</Button>
    <IconButton aria-label="Favourite">
      <HeartIcon />
    </IconButton>
  </>
);

/** A bare <Button> means whatever the app says it means. Call-site props still win. */
export const DefaultProps: StoryObj = {
  render: () => (
    <div className="sb-col">
      <Panel title="Built-in defaults: filled, s, round">{row}</Panel>
      <GrangeProvider defaultProps={{ Button: { variant: 'tonal', size: 'm' }, IconButton: { width: 'wide' } }}>
        <Panel title="defaultProps: Button tonal/m, IconButton wide — Cancel still overrides to outlined">
          {row}
        </Panel>
      </GrangeProvider>
    </div>
  ),
};

/**
 * Class overrides reach every slot, not just the root, and add by default so they cannot
 * accidentally break layout. `{ replace }` drops the library's own classes for a slot; the
 * stable hook class stays, because CSS and tests use it to find the element.
 */
export const ClassNames: StoryObj = {
  render: () => (
    <div className="sb-col">
      <GrangeProvider classNames={{ Button: { label: styles.loudLabel }, IconButton: { icon: styles.bigIcon } }}>
        <Panel title="classNames on the label and icon slots, added to the built-in classes">{row}</Panel>
      </GrangeProvider>
      <Panel title="{ replace } on the root slot: styled from scratch, still a real button">
        <Button classNames={{ root: { replace: styles.fromScratch } }} icon={<HeartIcon />}>
          Replaced
        </Button>
      </Panel>
    </div>
  ),
};

/**
 * Ripple timings and whether it runs at all, which spring each interaction uses, the
 * touch-target threshold and the connected-group inner corners. With the ripple off, a pointer
 * press falls back to the pressed state layer, the way a keyboard press already did.
 */
export const Behavior: StoryObj = {
  render: () => (
    <div className="sb-col">
      <Panel title="Default: ripple on, press on defaultEffects (no bounce)">{row}</Panel>
      <GrangeProvider behavior={{ ripple: { enabled: false } }}>
        <Panel title="ripple.enabled false — press and watch the state layer instead">{row}</Panel>
      </GrangeProvider>
      <GrangeProvider behavior={{ springs: { press: 'slowSpatial' } }}>
        <Panel title="springs.press reassigned to slowSpatial — the corner morph now overshoots">{row}</Panel>
      </GrangeProvider>
      <GrangeProvider behavior={{ ripple: { growMs: 1600, minimumPressMs: 800 } }}>
        <Panel title="ripple slowed to 1600ms so the wave is easy to see">{row}</Panel>
      </GrangeProvider>
    </div>
  ),
};

/**
 * Geometry flows from the config outward: the component resolves its spec and hands CSS the
 * height, gap and icon box, because the spring-animated radii and padding need the same numbers
 * in JS. Overriding height therefore keeps the pill radius correct.
 */
export const SizeGeometry: StoryObj = {
  render: () => (
    <div className="sb-col">
      <Panel title="Compose scale: s is 40px tall, 16px padding">{row}</Panel>
      <GrangeProvider sizes={{ button: { s: { height: 32, padding: 10, gap: 6 } } }}>
        <Panel title="Denser: s is 32px tall with 10px padding — the pill radius follows">{row}</Panel>
      </GrangeProvider>
      <GrangeProvider sizes={{ button: { s: { height: 64, padding: 28 } } }}>
        <Panel title="Roomier: s is 64px tall, and the touch target drops since it clears 48px">{row}</Panel>
      </GrangeProvider>
    </div>
  ),
};

/** Nested providers merge. The outer sets the app, the inner changes one part for a subtree. */
export const NestedProviders: StoryObj = {
  render: () => {
    const app: GrangeConfigInput = {
      defaultProps: { Button: { variant: 'tonal', size: 'm' } },
      classNames: { Button: { label: styles.loudLabel } },
    };
    return (
      <GrangeProvider {...app}>
        <div className="sb-col">
          <Panel title="App config: tonal, m, loud labels">{row}</Panel>
          <GrangeProvider defaultProps={{ Button: { size: 's' } }}>
            <Panel title="Subtree overrides size only — tonal and the loud label carry through">
              <ButtonGroup aria-label="Nested">
                <Button>One</Button>
                <Button>Two</Button>
                <Button>Three</Button>
              </ButtonGroup>
            </Panel>
          </GrangeProvider>
        </div>
      </GrangeProvider>
    );
  },
};
