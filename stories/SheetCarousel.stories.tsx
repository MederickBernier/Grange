import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { I18nProvider } from 'react-aria';
import {
  Carousel,
  CarouselItem,
  FilledButton,
  List,
  ListItem,
  SideSheet,
  TextButton,
  sideSheet,
} from '../src';

/**
 * The last two components in the catalog, and the only two with neither a React Aria hook nor a
 * Compose token file. Their geometry comes from the spec pages instead of from androidx, which is
 * recorded in each `specs.ts`: the side sheet borrows NavigationDrawerTokens, since it is the same
 * panel on the same edge, and the carousel's one tokenised value is its 28px corner.
 */
const meta: Meta = {
  title: 'Components/Side sheet and Carousel',
  parameters: { layout: 'padded' },
};
export default meta;

const frame = { height: 360, border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex' };

const details = (
  <List aria-label="Details">
    <ListItem trailingText="Ada">Owner</ListItem>
    <ListItem trailingText="Today">Created</ListItem>
    <ListItem trailingText="2.4 MB">Size</ListItem>
  </List>
);

/** Standard: part of the layout, on either edge, flat with a divider rather than a shadow. */
export const Standard: StoryObj = {
  render: () => (
    <div className="sb-col">
      <div style={frame}>
        <div style={{ flex: 1, padding: 16 }}>Page content</div>
        <SideSheet headline="Details" actions={<TextButton>Share</TextButton>}>
          {details}
        </SideSheet>
      </div>
      <p className="sb-label">placement=“start”, and in RTL, where the rounded edge swaps sides</p>
      <div style={frame}>
        <SideSheet headline="Details" placement="start">
          {details}
        </SideSheet>
        <div style={{ flex: 1, padding: 16 }}>Page content</div>
      </div>
      <I18nProvider locale="ar-EG">
        <div style={frame} dir="rtl">
          <SideSheet headline="تفاصيل" placement="start">
            {details}
          </SideSheet>
          <div style={{ flex: 1, padding: 16 }}>محتوى</div>
        </div>
      </I18nProvider>
    </div>
  ),
};

/** Modal: over the page behind a scrim, scroll locked, Escape and outside-click to close. */
export const Modal: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="sb-col">
        <FilledButton onClick={() => setOpen(true)}>Open details</FilledButton>
        <SideSheet
          modal
          open={open}
          onOpenChange={setOpen}
          headline="Details"
          showClose
          actions={<TextButton onClick={() => setOpen(false)}>Done</TextButton>}
        >
          {details}
        </SideSheet>
      </div>
    );
  },
};

/**
 * Resizable: drag the inner edge, or focus it and use the arrow keys. It is a `separator` with
 * `aria-valuenow`, so what a screen reader announces is the width it actually has, and it clamps
 * to the spec's {sideSheet.minWidth} to {sideSheet.maxWidth} range.
 */
export const Resizable: StoryObj = {
  render: function Render() {
    const [width, setWidth] = useState<number>(sideSheet.width);
    return (
      <div className="sb-col">
        <p className="sb-label">{width}px — drag the left edge, or Tab to it and press the arrows</p>
        <div style={frame}>
          <div style={{ flex: 1, padding: 16 }}>Page content</div>
          <SideSheet headline="Details" resizable width={width} onWidthChange={setWidth}>
            {details}
          </SideSheet>
        </div>
      </div>
    );
  },
};

const photos = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1'];

function Photo({ color, index }: { color: string; index: number }) {
  return (
    <CarouselItem>
      <div
        style={{
          height: 200,
          background: color,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 12,
          color: 'white',
          font: 'var(--md-sys-typescale-label-large)',
        }}
      >
        {index + 1}
      </div>
    </CarouselItem>
  );
}

/**
 * The four layouts. Scrolling is the platform's: touch dragging, the wheel, the trackpad and the
 * scrollbar all work because the strip is a real scroll container with CSS snapping. On top of
 * that it is a tab stop whose arrow keys move a whole item, Home and End go to the ends, and a
 * mouse can drag it, which a scroll container does not otherwise allow.
 */
export const CarouselLayouts: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ gap: 24 }}>
      {(['multi-browse', 'uncontained', 'hero'] as const).map((variant) => (
        <div key={variant} className="sb-col">
          <p className="sb-label">{variant}</p>
          <Carousel aria-label={`Photos, ${variant}`} variant={variant}>
            {photos.map((color, index) => (
              <Photo key={color} color={color} index={index} />
            ))}
          </Carousel>
        </div>
      ))}
    </div>
  ),
};

/** Full-screen is the vertical one: a page at a time, with the up and down arrows. */
export const FullScreen: StoryObj = {
  render: function Render() {
    const [index, setIndex] = useState(0);
    return (
      <div className="sb-col">
        <p className="sb-label">
          Item {index + 1} of {photos.length}
        </p>
        <div style={{ height: 320, maxWidth: 420 }}>
          <Carousel
            aria-label="Photos"
            variant="full-screen"
            onIndexChange={setIndex}
            style={{ height: '100%' }}
          >
            {photos.map((color, i) => (
              <CarouselItem key={color}>
                <div
                  style={{
                    height: '100%',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    font: 'var(--md-sys-typescale-display-small)',
                  }}
                >
                  {i + 1}
                </div>
              </CarouselItem>
            ))}
          </Carousel>
        </div>
      </div>
    );
  },
};
