import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria';
import {
  ConnectedButtonGroup,
  ConnectedButtonGroupItem,
  Divider,
  FilledButton,
  GrangeProvider,
  Icon,
  IconButton,
} from '../index';

describe('Icon', () => {
  it('is decorative by default, since the control carries the name', () => {
    const { container } = render(<Icon>favorite</Icon>);
    const icon = container.querySelector('.grange-icon')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.getAttribute('role')).toBeNull();
  });

  it('becomes an image with a name when given one', () => {
    render(<Icon aria-label="Favourite">favorite</Icon>);
    const icon = screen.getByRole('img', { name: 'Favourite' });
    expect(icon.getAttribute('aria-hidden')).toBeNull();
  });

  it('publishes an explicit size', () => {
    const { container } = render(<Icon size={40}>favorite</Icon>);
    const icon = container.querySelector('.grange-icon') as HTMLElement;
    expect(icon.style.getPropertyValue('--grange-icon-size')).toBe('40px');
  });

  it('inherits the control size when given none, by leaving the property alone', () => {
    const { container } = render(<Icon>favorite</Icon>);
    const icon = container.querySelector('.grange-icon') as HTMLElement;
    expect(icon.style.getPropertyValue('--grange-icon-size')).toBe('');
  });

  it('takes an app-wide default size from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ Icon: { size: 32 } }}>
        <Icon>favorite</Icon>
      </GrangeProvider>,
    );
    const icon = container.querySelector('.grange-icon') as HTMLElement;
    expect(icon.style.getPropertyValue('--grange-icon-size')).toBe('32px');
  });

  it('marks the filled axis', () => {
    const { container } = render(<Icon filled>favorite</Icon>);
    expect((container.querySelector('.grange-icon') as HTMLElement).dataset.filled).toBe('true');
  });

  it('flips only in an RTL locale, and only when asked', () => {
    const { container: ltr } = render(
      <I18nProvider locale="en-US">
        <Icon flipInRtl>arrow_forward</Icon>
      </I18nProvider>,
    );
    expect((ltr.querySelector('.grange-icon') as HTMLElement).dataset.flip).toBeUndefined();

    const { container: rtl } = render(
      <I18nProvider locale="ar-EG">
        <Icon flipInRtl>arrow_forward</Icon>
      </I18nProvider>,
    );
    expect((rtl.querySelector('.grange-icon') as HTMLElement).dataset.flip).toBe('rtl');

    const { container: notAsked } = render(
      <I18nProvider locale="ar-EG">
        <Icon>arrow_forward</Icon>
      </I18nProvider>,
    );
    expect((notAsked.querySelector('.grange-icon') as HTMLElement).dataset.flip).toBeUndefined();
  });

  it('sizes itself inside a button, which publishes the size', () => {
    render(
      <IconButton aria-label="Favourite" size="l">
        <Icon>favorite</Icon>
      </IconButton>,
    );
    // The button publishes the contract the icon reads.
    expect(screen.getByRole('button').style.getPropertyValue('--grange-icon-size')).toBe('32px');
  });
});

describe('Divider', () => {
  it('is announced as a separator', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toBeTruthy();
  });

  it('carries its orientation, so a vertical one is not a silent box', () => {
    render(<Divider orientation="vertical" />);
    const el = screen.getByRole('separator');
    expect(el.dataset.orientation).toBe('vertical');
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('a horizontal separator leaves aria-orientation implicit', () => {
    render(<Divider />);
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBeNull();
  });

  it.each([
    [true, 'both'],
    ['start', 'start'],
    ['end', 'end'],
  ] as const)('maps inset %s', (inset, expected) => {
    render(<Divider inset={inset} />);
    expect(screen.getByRole('separator').dataset.inset).toBe(expected);
  });

  it('is not inset by default', () => {
    render(<Divider />);
    expect(screen.getByRole('separator').dataset.inset).toBeUndefined();
  });
});

describe('link rendering', () => {
  it('renders an anchor once given an href', () => {
    render(<FilledButton href="/save">Save</FilledButton>);
    const el = screen.getByRole('button', { name: 'Save' });
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('/save');
  });

  it('keeps the button role, matching how it actually behaves', () => {
    render(<FilledButton href="/save">Save</FilledButton>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('forwards target and rel', () => {
    render(
      <FilledButton href="https://example.com" target="_blank" rel="noreferrer">
        Out
      </FilledButton>,
    );
    const el = screen.getByRole('button');
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.getAttribute('rel')).toBe('noreferrer');
  });

  it('drops the href when disabled, so it cannot navigate', () => {
    render(
      <FilledButton href="/save" disabled>
        Save
      </FilledButton>,
    );
    expect(screen.getByRole('button').getAttribute('href')).toBeNull();
  });

  it('stays a button element with no href', () => {
    render(<FilledButton>Save</FilledButton>);
    expect(screen.getByRole('button').tagName).toBe('BUTTON');
  });

  it('still ripples and presses as a link', async () => {
    const onPress = vi.fn();
    render(
      <FilledButton href="#x" onPress={onPress}>
        Save
      </FilledButton>,
    );
    expect(document.querySelector('.grange-ripple')).not.toBeNull();
    await userEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('form integration', () => {
  it('passes type, name and value through to the button', () => {
    render(
      <FilledButton type="submit" name="action" value="save">
        Save
      </FilledButton>,
    );
    const el = screen.getByRole('button') as HTMLButtonElement;
    expect(el.type).toBe('submit');
    expect(el.name).toBe('action');
    expect(el.value).toBe('save');
  });

  it('defaults to type button, so it cannot submit a form by accident', () => {
    render(<FilledButton>Save</FilledButton>);
    expect((screen.getByRole('button') as HTMLButtonElement).type).toBe('button');
  });

  it('submits the form it is associated with', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <>
        <form id="f" onSubmit={onSubmit} />
        <FilledButton type="submit" form="f">
          Save
        </FilledButton>
      </>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('RTL', () => {
  const corners = (el: HTMLElement) => {
    const s = el.style;
    return {
      tl: s.borderTopLeftRadius,
      tr: s.borderTopRightRadius,
      bl: s.borderBottomLeftRadius,
      br: s.borderBottomRightRadius,
    };
  };

  const group = (locale: string) => (
    <I18nProvider locale={locale}>
      <ConnectedButtonGroup size="s">
        <ConnectedButtonGroupItem id="a">A</ConnectedButtonGroupItem>
        <ConnectedButtonGroupItem id="b">B</ConnectedButtonGroupItem>
      </ConnectedButtonGroup>
    </I18nProvider>
  );

  it('puts the first item\'s full corners on the left in LTR', () => {
    render(group('en-US'));
    const first = screen.getAllByRole('radio')[0]!;
    const c = corners(first);
    // Full is height / 2 = 20px at size s; the inner corner is 8px.
    expect(c.tl).toBe('20px');
    expect(c.bl).toBe('20px');
    expect(c.tr).toBe('8px');
  });

  it('mirrors them to the right in RTL, where the first item sits', () => {
    render(group('ar-EG'));
    const first = screen.getAllByRole('radio')[0]!;
    const c = corners(first);
    expect(c.tr).toBe('20px');
    expect(c.br).toBe('20px');
    expect(c.tl).toBe('8px');
  });
});
