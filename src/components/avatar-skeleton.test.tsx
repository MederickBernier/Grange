import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar, GrangeProvider, Skeleton, avatar, skeleton } from '../index';

describe('tokens', () => {
  it("takes the avatar's size, shape and colours from ListTokens", () => {
    // ItemLeadingAvatarSize 40dp; 24 and 56 are ItemLeadingIconSize and ItemLeadingImageWidth
    // from the same file, so none of the three sizes is invented.
    expect(avatar.sizes).toEqual({ sm: 24, md: 40, lg: 56 });
    // ItemLeadingAvatarShape: CornerFull.
    expect(avatar.corners.circle).toBe(9999);
    // ItemLeadingAvatarLabelFont: TitleMedium, on the captured size.
    expect(avatar.labelFonts.md).toBe('title-medium');
  });

  it("builds the skeleton's chosen values out of captured ones", () => {
    // Material has no skeleton, so the period is a real duration token rather than a number.
    expect(skeleton.period).toBe(1000); // motion duration extra-long4
    expect(skeleton.textHeight).toBe(24); // body-large's line-height
    expect(skeleton.lastLineWidth).toBeLessThan(1);
  });
});

describe('Avatar', () => {
  const el = (c: HTMLElement) => c.querySelector('.grange-avatar') as HTMLElement;

  it('shows the fallback when there is no image', () => {
    const { container } = render(<Avatar>MB</Avatar>);
    expect(el(container).textContent).toBe('MB');
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows the image when there is one', () => {
    const { container } = render(<Avatar src="/a.png">MB</Avatar>);
    expect(container.querySelector('img')).not.toBeNull();
    expect(el(container).textContent).toBe('');
  });

  it('falls back to the initials when the image fails', () => {
    const { container } = render(<Avatar src="/missing.png">MB</Avatar>);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(el(container).textContent).toBe('MB');
  });

  it('tries again when the src changes, so a failure is not permanent', () => {
    const { container, rerender } = render(<Avatar src="/missing.png">MB</Avatar>);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();

    rerender(<Avatar src="/works.png">MB</Avatar>);
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('defaults the alt to empty, because an avatar beside a name is decoration', () => {
    const { container } = render(<Avatar src="/a.png" aria-label="Mederick" />);
    expect(container.querySelector('img')!.getAttribute('alt')).toBe('');
  });

  it('is hidden unless it is labelled', () => {
    const { container, rerender } = render(<Avatar>MB</Avatar>);
    expect(el(container).getAttribute('aria-hidden')).toBe('true');
    expect(el(container).getAttribute('role')).toBeNull();

    rerender(<Avatar aria-label="Mederick Bernier">MB</Avatar>);
    expect(el(container).getAttribute('aria-hidden')).toBeNull();
    expect(screen.getByRole('img', { name: 'Mederick Bernier' })).toBe(el(container));
  });

  it('carries its size, shape and colour as data attributes', () => {
    const { container } = render(
      <Avatar size="lg" shape="rounded" color="tertiary">
        MB
      </Avatar>,
    );
    expect(el(container).dataset).toMatchObject({ size: 'lg', shape: 'rounded', color: 'tertiary' });
  });

  it('takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Avatar: { size: 'sm', color: 'surface' } }}>
        <Avatar>MB</Avatar>
      </GrangeProvider>,
    );
    expect(el(container).dataset).toMatchObject({ size: 'sm', color: 'surface' });
  });
});

describe('Skeleton', () => {
  const el = (c: HTMLElement) => c.querySelector('.grange-skeleton') as HTMLElement;
  const bars = (c: HTMLElement) => [...c.querySelectorAll('.grange-skeleton-bar')] as HTMLElement[];

  it('is one bar by default', () => {
    const { container } = render(<Skeleton />);
    expect(bars(container)).toHaveLength(1);
    expect(el(container).dataset.shape).toBe('text');
  });

  it('draws one bar per line, with a short last one', () => {
    const { container } = render(<Skeleton lines={3} />);
    const drawn = bars(container);
    expect(drawn).toHaveLength(3);
    expect(drawn[0]!.style.width).toBe('');
    expect(drawn[2]!.style.width).toBe('60%');
  });

  it('leaves a single line full width, because one line is not a paragraph', () => {
    const { container } = render(<Skeleton lines={1} />);
    expect(bars(container)[0]!.style.width).toBe('');
  });

  it('ignores lines for the shapes that are not text', () => {
    const { container } = render(<Skeleton shape="circle" lines={4} height={40} />);
    expect(bars(container)).toHaveLength(1);
  });

  it('ignores a width on a circle, which would only make it an ellipse', () => {
    const { container } = render(<Skeleton shape="circle" height={40} width={200} />);
    expect(el(container).style.width).toBe('');
  });

  it('takes numbers as px and strings as they are', () => {
    const { container } = render(<Skeleton shape="rect" width={200} height="3rem" radius={8} />);
    expect(el(container).style.width).toBe('200px');
    expect(bars(container)[0]!.style.height).toBe('3rem');
    expect(bars(container)[0]!.style.borderRadius).toBe('8px');
  });

  it('is hidden from assistive tech, with no way to label it', () => {
    const { container } = render(<Skeleton />);
    expect(el(container).getAttribute('aria-hidden')).toBe('true');
    // The region that is loading says so; the skeleton is the shape of what is missing.
    expect(el(container).getAttribute('aria-label')).toBeNull();
  });

  it('carries the animation it was asked for', () => {
    const { container, rerender } = render(<Skeleton />);
    expect(el(container).dataset.animation).toBe('shimmer');

    rerender(<Skeleton animation="none" />);
    expect(el(container).dataset.animation).toBe('none');
  });

  it('takes its defaults from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Skeleton: { shape: 'rect', animation: 'pulse' } }}>
        <Skeleton />
      </GrangeProvider>,
    );
    expect(el(container).dataset).toMatchObject({ shape: 'rect', animation: 'pulse' });
  });

  it('never draws fewer than one bar, whatever it is given', () => {
    const { container } = render(<Skeleton lines={0} />);
    expect(bars(container)).toHaveLength(1);
  });
});
