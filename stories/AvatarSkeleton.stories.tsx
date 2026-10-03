import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, Card, FilledButton, Icon, Skeleton, avatar } from '../src';
import { PersonIcon } from './icons';

/**
 * Avatars and skeletons: the two pieces of furniture every list needs and the Material catalog
 * does not name.
 *
 * Neither has a token file — `AvatarTokens`, `SkeletonTokens`, `PlaceholderTokens` and
 * `ShimmerTokens` are all 404 in androidx — but the avatar is not therefore invented. Compose
 * draws one inside `ListTokens`, as a list item's leading element, and those values are used
 * verbatim: {avatar.sizes.md}px, fully round, primary container, title-medium initials. The
 * other two sizes are the icon and image sizes from the same file.
 *
 * The skeleton is chosen throughout, and chosen out of tokens that exist: the shimmer's period
 * is the extra-long4 duration on the linear easing, and its sweep is on-surface at the hover
 * state-layer opacity.
 */
const meta: Meta = {
  title: 'Components/Avatar and Skeleton',
  parameters: { layout: 'padded' },
};
export default meta;

/**
 * A fixed image, inline, so the story needs no network and shoots the same way every time.
 * Nothing about the avatar depends on it being a photograph.
 */
const PORTRAIT =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" fill="#7a5195"/>' +
      '<circle cx="32" cy="24" r="12" fill="#ffd9a0"/>' +
      '<circle cx="32" cy="62" r="22" fill="#ffd9a0"/>' +
      '</svg>',
  );

/** The three sizes, all of them real ListTokens values. */
export const Sizes: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 16, alignItems: 'center' }}>
      <Avatar size="sm" aria-label="Small">
        MB
      </Avatar>
      <Avatar size="md" aria-label="Medium">
        MB
      </Avatar>
      <Avatar size="lg" aria-label="Large">
        MB
      </Avatar>
      <span className="sb-label">
        {avatar.sizes.sm} · {avatar.sizes.md} · {avatar.sizes.lg}
      </span>
    </div>
  ),
};

/** Image, initials, icon — and the four colour pairs the initials can wear. */
export const Contents: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 24 }}>
      <div>
        <p className="sb-label">An image fills the shape rather than being letterboxed in it</p>
        <div className="sb-row" style={{ gap: 12, alignItems: 'center' }}>
          <Avatar size="lg" src={PORTRAIT} aria-label="Ada Lovelace" />
          <Avatar src={PORTRAIT} shape="rounded" aria-label="Ada Lovelace" />
          <Avatar size="sm" src={PORTRAIT} shape="square" aria-label="Ada Lovelace" />
        </div>
      </div>

      <div>
        <p className="sb-label">Initials, which the caller supplies — no name is split here</p>
        <div className="sb-row" style={{ gap: 12, alignItems: 'center' }}>
          <Avatar aria-label="Ada Lovelace">AL</Avatar>
          <Avatar color="secondary" aria-label="Grace Hopper">
            GH
          </Avatar>
          <Avatar color="tertiary" aria-label="Alan Turing">
            AT
          </Avatar>
          <Avatar color="surface" aria-label="Katherine Johnson">
            KJ
          </Avatar>
        </div>
      </div>

      <div>
        <p className="sb-label">An icon, for whoever has neither a picture nor a name yet</p>
        <Avatar color="surface" aria-label="Unknown person">
          <Icon size={20}>
            <PersonIcon />
          </Icon>
        </Avatar>
      </div>
    </div>
  ),
};

/** The three shapes. Only the circle is a token; the other two come off the corner scale. */
export const Shapes: StoryObj = {
  render: () => (
    <div className="sb-row" style={{ gap: 16, alignItems: 'center' }}>
      <Avatar size="lg" shape="circle" aria-label="Circle">
        ○
      </Avatar>
      <Avatar size="lg" shape="rounded" aria-label="Rounded">
        ▢
      </Avatar>
      <Avatar size="lg" shape="square" aria-label="Square">
        □
      </Avatar>
    </div>
  ),
};

/**
 * Skeletons. The shimmer holds still under reduced motion rather than slowing down — a loop with
 * no end state is the clearest case that setting is about, which is also why these shoot
 * identically every time.
 */
export const Skeletons: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 24, maxWidth: 420 }}>
      <div>
        <p className="sb-label">A paragraph, whose last line is short because real ones are</p>
        <Skeleton lines={3} />
      </div>
      <div>
        <p className="sb-label">A block, a disc, and the three animations</p>
        <div className="sb-row" style={{ gap: 16, alignItems: 'center' }}>
          <Skeleton shape="circle" height={56} />
          <Skeleton shape="rect" height={56} radius={16} style={{ flex: 1 }} />
        </div>
      </div>
      <div className="sb-row" style={{ gap: 16 }}>
        <Skeleton shape="rect" height={24} animation="shimmer" style={{ flex: 1 }} />
        <Skeleton shape="rect" height={24} animation="pulse" style={{ flex: 1 }} />
        <Skeleton shape="rect" height={24} animation="none" style={{ flex: 1 }} />
      </div>
    </div>
  ),
};

/**
 * What a skeleton is actually for: the shape of the thing, held, so the page does not jump when
 * the content lands. The region carries `aria-busy`, which is what a screen reader hears — the
 * skeletons themselves are hidden and cannot be labelled.
 */
export const WhileLoading: StoryObj = {
  render: function Render() {
    const [loaded, setLoaded] = useState(false);
    return (
      <div className="sb-col" style={{ gap: 16, maxWidth: 420 }}>
        <Card variant="outlined" style={{ padding: 16 }}>
          <div aria-busy={!loaded} aria-live="polite">
            <div className="sb-row" style={{ gap: 12, alignItems: 'center' }}>
              {loaded ? (
                <Avatar src={PORTRAIT} aria-label="Ada Lovelace" />
              ) : (
                <Skeleton shape="circle" height={40} />
              )}
              <div style={{ flex: 1 }}>
                {loaded ? <strong>Ada Lovelace</strong> : <Skeleton height={20} width="50%" />}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              {loaded ? (
                <p style={{ margin: 0 }}>
                  Wrote the first algorithm intended for a machine, for an engine that was never
                  built.
                </p>
              ) : (
                <Skeleton lines={2} />
              )}
            </div>
          </div>
        </Card>
        <div>
          <FilledButton onClick={() => setLoaded(!loaded)}>{loaded ? 'Reset' : 'Load'}</FilledButton>
        </div>
      </div>
    );
  },
};
