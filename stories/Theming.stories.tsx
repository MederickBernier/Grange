import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ToggleButton } from '../src';
import { HeartFilledIcon, HeartIcon } from './icons';
import styles from './theming.module.scss';

/**
 * Theming is CSS custom properties all the way down, so an override is just a scoped rule.
 * The Sass API validates the role names at build time:
 *
 *   @use '@jyga/m3e-react/scss' as m3e;
 *   .brand { @include m3e.theme((primary: #005bbb)); }
 *
 * See stories/theming.module.scss for the override these panels use.
 */
const meta: Meta = {
  title: 'Foundations/Theming',
  parameters: { layout: 'padded' },
};
export default meta;

function Panel({ title, note, className }: { title: string; note: string; className?: string }) {
  return (
    <div className={`${styles.panel} ${className ?? ''}`}>
      <p className={styles.title}>{title}</p>
      <p className={styles.note}>{note}</p>
      <div className="sb-row">
        <Button variant="filled">Filled</Button>
        <Button variant="tonal">Tonal</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="elevated">Elevated</Button>
        <ToggleButton variant="filled" icon={<HeartIcon />} selectedIcon={<HeartFilledIcon />} defaultSelected>
          Toggle
        </ToggleButton>
      </div>
    </div>
  );
}

/** Side by side: the generated palette, and the same components under a brand override. */
export const Overrides: StoryObj = {
  render: () => (
    <div className="sb-col">
      <Panel title="Default" note="Seed #6750A4 from tokens/theme.json." />
      <Panel
        title="Brand override"
        note="Ten color roles and the large corner overridden in one scoped rule. Nothing else changed."
        className={styles.brand}
      />
    </div>
  ),
};

/**
 * Overrides compose with the light/dark switch. The container below forces dark while the brand
 * override still applies, because untouched roles keep resolving through data-theme.
 */
export const ScopedDark: StoryObj = {
  render: () => (
    <div className="sb-col">
      <Panel title="Brand, inherited theme" note="Follows the Theme toolbar." className={styles.brand} />
      <div data-theme="dark">
        <Panel title="Brand, forced dark" note='Same override inside data-theme="dark".' className={styles.brand} />
      </div>
    </div>
  ),
};
