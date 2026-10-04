import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import {
  ConnectedButtonGroup,
  ConnectedButtonGroupItem,
  Divider,
  FilledButton,
  FilledTonalButton,
  Icon,
  IconButton,
  OutlinedButton,
  TextButton,
} from '../src';
import { ArrowIcon, HeartFilledIcon, HeartIcon } from './icons';

/**
 * The pieces every other component is built on: `Icon`, `Divider`, buttons that can render as
 * links, and right-to-left support.
 */
const meta: Meta = {
  title: 'Foundations/Primitives',
  parameters: { layout: 'padded' },
};
export default meta;

/**
 * `Icon` sizes itself to whatever control it sits in, because the buttons publish their icon box
 * as `--grange-icon-size`. Standalone it falls back to the M3 default of 24px.
 *
 * It takes an inline SVG, or a Material Symbols ligature name as text if the app loads that font.
 */
export const Icons: StoryObj = {
  render: () => (
    <div className="sb-col">
      <div className="sb-row">
        <span className="sb-label">Sizes</span>
        {[16, 24, 32, 48].map((size) => (
          <Icon key={size} size={size}>
            <HeartIcon />
          </Icon>
        ))}
      </div>
      <div className="sb-row">
        <span className="sb-label">In context</span>
        {(['xs', 's', 'm', 'l'] as const).map((size) => (
          <IconButton key={size} size={size} aria-label={`Favourite ${size}`}>
            <Icon>
              <HeartIcon />
            </Icon>
          </IconButton>
        ))}
      </div>
      <div className="sb-row">
        <span className="sb-label">Colour</span>
        <FilledButton
          icon={
            <Icon>
              <HeartFilledIcon />
            </Icon>
          }
        >
          Inherits currentColor
        </FilledButton>
        <OutlinedButton
          disabled
          icon={
            <Icon>
              <HeartIcon />
            </Icon>
          }
        >
          And the disabled state
        </OutlinedButton>
      </div>
    </div>
  ),
};

/** Full-width, or inset by 16px so it lines up with the content beside it. */
export const Dividers: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ maxWidth: 420 }}>
      <div>
        <p className="sb-label">Full width</p>
        <Divider />
      </div>
      <div>
        <p className="sb-label">Inset both ends</p>
        <Divider inset />
      </div>
      <div>
        <p className="sb-label">Inset start</p>
        <Divider inset="start" />
      </div>
      <div className="sb-row" style={{ height: 40 }}>
        <span className="sb-label">Vertical</span>
        <TextButton>One</TextButton>
        <Divider orientation="vertical" />
        <TextButton>Two</TextButton>
      </div>
    </div>
  ),
};

/**
 * An `href` makes a button render an `<a>`, as Material Web's buttons do, so it gets the
 * browser's own affordances: middle-click, open in new tab, a visible target on hover. It keeps
 * the button role and Space-to-activate, so what assistive tech announces matches how it
 * behaves. A disabled one drops the href and cannot navigate.
 */
export const AsLinks: StoryObj = {
  render: () => (
    <div className="sb-row">
      <FilledButton
        href="https://m3.material.io"
        target="_blank"
        rel="noreferrer"
        icon={
          <Icon>
            <ArrowIcon />
          </Icon>
        }
        trailingIcon
      >
        Open the spec
      </FilledButton>
      <OutlinedButton href="#somewhere">Same tab</OutlinedButton>
      <FilledTonalButton href="#nope" disabled>
        Disabled, no href
      </FilledTonalButton>
    </div>
  ),
};

/**
 * In a right-to-left locale the row reverses, so leading icons move to the right and the
 * connected group's outer corners mirror. Motion animates the physical corner radii, so that
 * swap is done in JS rather than by the cascade.
 */
export const RightToLeft: StoryObj = {
  render: () => (
    <div className="sb-col">
      {(['en-US', 'ar-EG'] as const).map((locale) => (
        <I18nProvider key={locale} locale={locale}>
          <div dir={locale === 'ar-EG' ? 'rtl' : 'ltr'} className="sb-col">
            <span className="sb-label">{locale}</span>
            <div className="sb-row">
              <FilledButton
                icon={
                  <Icon flipInRtl>
                    <ArrowIcon />
                  </Icon>
                }
              >
                Leading icon, flipped
              </FilledButton>
              <ConnectedButtonGroup aria-label="View" defaultSelectedKeys={['a']}>
                <ConnectedButtonGroupItem id="a">First</ConnectedButtonGroupItem>
                <ConnectedButtonGroupItem id="b">Middle</ConnectedButtonGroupItem>
                <ConnectedButtonGroupItem id="c">Last</ConnectedButtonGroupItem>
              </ConnectedButtonGroup>
            </div>
          </div>
        </I18nProvider>
      ))}
    </div>
  ),
};
