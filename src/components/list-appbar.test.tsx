import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBar, Checkbox, GrangeProvider, IconButton, List, ListItem, appBarSizes, list, rowHeight } from '../index';

describe('tokens', () => {
  it('matches ListTokens', () => {
    expect(list).toMatchObject({
      oneLine: 56,
      twoLine: 72,
      threeLine: 88,
      leadingSpace: 16,
      trailingSpace: 16,
      betweenSpace: 12,
      leadingIcon: 24,
      avatar: 40,
      containerCorner: 16,
    });
  });

  it('picks the row height from the number of lines', () => {
    expect(rowHeight(1)).toBe(56);
    expect(rowHeight(2)).toBe(72);
    expect(rowHeight(3)).toBe(88);
  });

  it('matches the app bar heights and typescales', () => {
    expect(appBarSizes.small).toMatchObject({ height: 64, titleTypescale: 'title-large', stacked: false });
    expect(appBarSizes.medium).toMatchObject({ height: 112, titleTypescale: 'headline-small', stacked: true });
    expect(appBarSizes.large).toMatchObject({ height: 152, titleTypescale: 'headline-medium' });
  });

  it('gives the flexible sizes a taller height for a subtitle, which the others do not have', () => {
    expect(appBarSizes.mediumFlexible).toMatchObject({ height: 112, heightWithSubtitle: 136 });
    expect(appBarSizes.largeFlexible).toMatchObject({ height: 120, heightWithSubtitle: 152 });
    // The classic sizes publish one height only.
    expect(appBarSizes.medium.heightWithSubtitle).toBe(appBarSizes.medium.height);
  });
});

describe('List', () => {
  it('is semantic list markup, not a listbox', () => {
    render(
      <List aria-label="Inbox">
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </List>,
    );
    expect(screen.getByRole('list', { name: 'Inbox' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('counts its lines, which decides the row height', () => {
    const { container } = render(
      <List>
        <ListItem>One line</ListItem>
        <ListItem supportingText="Second line">Two lines</ListItem>
        <ListItem overline="Overline" supportingText="Second line">
          Three lines
        </ListItem>
      </List>,
    );
    const rows = [...container.querySelectorAll('.grange-list-item')] as HTMLElement[];
    expect(rows.map((r) => r.dataset.lines)).toEqual(['1', '2', '3']);
  });

  it('renders the leading, trailing and trailing text slots', () => {
    render(
      <List>
        <ListItem
          leading={<svg data-testid="lead" />}
          trailing={<svg data-testid="trail" />}
          trailingText="12:04"
        >
          With slots
        </ListItem>
      </List>,
    );
    expect(screen.getByTestId('lead')).toBeTruthy();
    expect(screen.getByTestId('trail')).toBeTruthy();
    expect(screen.getByText('12:04')).toBeTruthy();
  });

  it('stays a plain row until given a handler', () => {
    const { container } = render(
      <List>
        <ListItem>Content</ListItem>
      </List>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect((container.querySelector('.grange-list-item') as HTMLElement).dataset.interactive).toBeUndefined();
  });

  it('becomes a button when given an onClick, and still a list item', async () => {
    const onClick = vi.fn();
    render(
      <List>
        <ListItem onClick={onClick}>Press me</ListItem>
      </List>,
    );
    // The button sits inside the li, so the list is still a list of list items.
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    const button = screen.getByRole('button', { name: 'Press me' });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('becomes a link when given an href', () => {
    render(
      <List>
        <ListItem href="/inbox">Inbox</ListItem>
      </List>,
    );
    expect(screen.getByRole('button', { name: 'Inbox' }).tagName).toBe('A');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('does not fire while disabled', async () => {
    const onClick = vi.fn();
    render(
      <List>
        <ListItem onClick={onClick} disabled>
          Press me
        </ListItem>
      </List>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('marks a selected row, for the current page in a navigation list', () => {
    const { container } = render(
      <List>
        <ListItem selected onClick={() => {}}>
          Current
        </ListItem>
      </List>,
    );
    expect((container.querySelector('.grange-list-item') as HTMLElement).dataset.selected).toBe('true');
  });

  it('takes selection by composition, which is how the spec draws it', async () => {
    const onChange = vi.fn();
    render(
      <List>
        <ListItem leading={<Checkbox aria-label="Pick One" onChange={onChange} />}>One</ListItem>
      </List>,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Pick One' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reaches the item and label slots', () => {
    const { container } = render(
      <GrangeProvider classNames={{ ListItem: { item: 'my-item', label: 'my-label' } }}>
        <List>
          <ListItem>One</ListItem>
        </List>
      </GrangeProvider>,
    );
    expect(container.querySelector('.grange-list-item')?.className).toContain('my-item');
    expect(container.querySelector('.grange-list-item-label')?.className).toContain('my-label');
  });
});

describe('AppBar', () => {
  const bar = (c: HTMLElement) => c.querySelector('.grange-app-bar') as HTMLElement;

  it('is a banner with its title', () => {
    render(<AppBar title="Inbox" />);
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByText('Inbox')).toBeTruthy();
  });

  it('defaults to the small size, with the title in the row', () => {
    const { container } = render(<AppBar title="Inbox" />);
    expect(bar(container).dataset.size).toBe('small');
    expect(bar(container).dataset.stacked).toBeUndefined();
  });

  it.each(['medium', 'large', 'mediumFlexible', 'largeFlexible'] as const)(
    'drops the title onto its own line at %s',
    (size) => {
      const { container } = render(<AppBar title="Inbox" size={size} />);
      expect(bar(container).dataset.stacked).toBe('true');
    },
  );

  it('publishes its height, and grows for a subtitle only where the tokens do', () => {
    const { container, unmount } = render(<AppBar title="Inbox" size="mediumFlexible" />);
    expect(bar(container).style.getPropertyValue('--_height')).toBe('112px');
    unmount();

    render(<AppBar title="Inbox" subtitle="12 unread" size="mediumFlexible" />);
    expect((document.querySelector('.grange-app-bar') as HTMLElement).style.getPropertyValue('--_height')).toBe(
      '136px',
    );
  });

  it('keeps one height at the classic sizes, which publish only one', () => {
    const { unmount } = render(<AppBar title="Inbox" size="medium" />);
    expect((document.querySelector('.grange-app-bar') as HTMLElement).style.getPropertyValue('--_height')).toBe(
      '112px',
    );
    unmount();

    render(<AppBar title="Inbox" subtitle="12 unread" size="medium" />);
    expect((document.querySelector('.grange-app-bar') as HTMLElement).style.getPropertyValue('--_height')).toBe(
      '112px',
    );
  });

  it('renders the leading control and the actions', () => {
    render(
      <AppBar
        title="Inbox"
        leading={
          <IconButton aria-label="Back">
            <svg />
          </IconButton>
        }
        actions={
          <IconButton aria-label="Search">
            <svg />
          </IconButton>
        }
      />,
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
  });

  it('switches to the on-scroll treatment when told to', () => {
    const { container, unmount } = render(<AppBar title="Inbox" />);
    expect(bar(container).dataset.scrolled).toBeUndefined();
    unmount();

    render(<AppBar title="Inbox" scrolled />);
    expect((document.querySelector('.grange-app-bar') as HTMLElement).dataset.scrolled).toBe('true');
  });

  it('centres only at the small size, which is all the spec allows', () => {
    const { container, unmount } = render(<AppBar title="Inbox" centered />);
    expect(bar(container).dataset.centered).toBe('true');
    unmount();

    render(<AppBar title="Inbox" centered size="large" />);
    expect((document.querySelector('.grange-app-bar') as HTMLElement).dataset.centered).toBeUndefined();
  });

  it('takes app-wide defaults', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ AppBar: { size: 'largeFlexible' } }}>
        <AppBar title="Inbox" />
      </GrangeProvider>,
    );
    expect(bar(container).dataset.size).toBe('largeFlexible');
  });
});
