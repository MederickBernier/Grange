import { isValidElement, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { useBreadcrumbItem, useBreadcrumbs } from 'react-aria';
import { MenuButton, type MenuButtonProps } from '../Menu/MenuButton';
import { MenuItem } from '../Menu/Menu';
import { flattenChildren } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type BreadcrumbsSlot,
  type SlotOverrides,
} from '../../config/config';
import { breadcrumbs as spec } from './specs';
import styles from './Breadcrumbs.module.scss';

/*
 * The key type the menu speaks, which is React Aria's rather than React 19's — React's own Key
 * includes bigint and the library's does not. Taken from the menu because that is where a
 * folded crumb's id actually ends up.
 */
type Key = Parameters<NonNullable<MenuButtonProps['onAction']>>[0];

export interface BreadcrumbProps {
  /** The label. */
  children: ReactNode;
  /** Identifies the crumb to `onAction`, and to the menu the middle collapses into. */
  id: Key;
  /** Renders the crumb as a real link. Without one it is a button, for a client-side router. */
  href?: string;
  target?: string;
  disabled?: boolean;
}

/**
 * One crumb. Described rather than rendered: `Breadcrumbs` reads these to decide which ones fit
 * and which fold into the menu, so it needs the props before anything is drawn.
 */
export function Breadcrumb(_props: BreadcrumbProps): ReactElement | null {
  return null;
}

export interface BreadcrumbsProps {
  /** Breadcrumb children, root first. */
  children?: ReactNode;
  /** Fired with the crumb's id, whether it was pressed in the trail or in the collapse menu. */
  onAction?: (id: Key) => void;
  /**
   * How many crumbs to show before the middle folds into a menu. The first and the last two are
   * always kept, because those are the ones a trail is read for.
   */
  maxVisible?: number;
  /** What the navigation landmark is called. Defaults to "Breadcrumb". */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<BreadcrumbsSlot>;
}

const isCrumb = (child: ReactNode): child is ReactElement<BreadcrumbProps> =>
  isValidElement(child) && child.type === Breadcrumb;

/**
 * A trail, on React Aria's `useBreadcrumbs`.
 *
 * The last crumb is the current page, and it is not a link. That is the whole accessibility
 * point of the pattern: `aria-current="page"` on a plain element, so a screen reader says where
 * you are rather than offering to take you where you already are. The hook puts the landmark and
 * the current marker in the right places; `useBreadcrumbItem` makes every other crumb a link
 * that works with a keyboard whether or not it has an `href`.
 *
 * When the trail is longer than it has room for, the middle folds into a menu rather than
 * wrapping or scrolling. The first crumb and the last two survive, because those are the ones a
 * trail is read for: where this sits, and what it is inside. The menu is the library's own
 * `MenuButton`, so the folded crumbs keep typeahead and arrow keys instead of becoming a
 * second, lesser list.
 */
export function Breadcrumbs(props: BreadcrumbsProps) {
  const { defaults, slots } = useComponentConfig('Breadcrumbs');
  const {
    children,
    onAction,
    maxVisible = defaults?.maxVisible ?? spec.maxVisible,
    'aria-label': ariaLabel = 'Breadcrumb',
    className,
    classNames,
    style,
  } = props;

  const { navProps } = useBreadcrumbs({ 'aria-label': ariaLabel });
  // flattenChildren, not Children.toArray: a trail written as a fragment would otherwise be
  // one crumb long.
  const items = flattenChildren(children).filter(isCrumb).map((child) => child.props);

  const slot = (name: BreadcrumbsSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  /*
   * Keep the first and the last two, fold everything between them. Below the limit nothing is
   * folded: a menu holding one crumb is more work to open than the crumb was to read.
   */
  const folded = items.length > maxVisible ? items.slice(1, items.length - 2) : [];
  const shown = folded.length > 0 ? [items[0]!, ...items.slice(items.length - 2)] : items;
  const insertMenuAfter = folded.length > 0 ? 0 : -1;

  return (
    <nav
      {...navProps}
      className={slot('root', 'grange-breadcrumbs', styles.breadcrumbs)}
      style={style}
    >
      <ol className={styles.list}>
        {shown.map((item, i) => (
          <li key={String(item.id)} className={styles.item}>
            <Crumb
              {...item}
              className={slot('crumb', 'grange-breadcrumb', styles.crumb)}
              isCurrent={i === shown.length - 1}
              onAction={onAction}
            />
            {i < shown.length - 1 && <Separator />}
            {i === insertMenuAfter && (
              <>
                <MenuButton
                  variant="text"
                  size="xs"
                  aria-label={`${folded.length} more`}
                  className={styles.more}
                  items={folded.map((crumb) => (
                    <MenuItem key={String(crumb.id)}>{crumb.children}</MenuItem>
                  ))}
                  onAction={(key) => onAction?.(key)}
                >
                  …
                </MenuButton>
                <Separator />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Separator() {
  return (
    <span className={styles.separator} aria-hidden="true">
      <svg viewBox="0 -960 960 960" focusable="false">
        <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
      </svg>
    </span>
  );
}

function Crumb({
  children,
  href,
  target,
  disabled,
  isCurrent,
  id,
  onAction,
  className,
}: BreadcrumbProps & { isCurrent: boolean; onAction?: (id: Key) => void; className: string }) {
  const ref = useRef<HTMLElement>(null);
  const { itemProps } = useBreadcrumbItem(
    {
      children,
      isCurrent,
      isDisabled: disabled,
      href,
      target,
      // The current crumb is not a link, so it is not an <a> either. The hook needs to be told,
      // or it hands back link props for an element that cannot use them.
      elementType: isCurrent || href == null ? 'span' : 'a',
      onPress: () => onAction?.(id),
    },
    ref,
  );

  const Element = (isCurrent || href == null ? 'span' : 'a') as 'span';
  return (
    <Element
      {...itemProps}
      ref={ref}
      className={className}
      data-current={isCurrent || undefined}
      data-disabled={disabled || undefined}
    >
      {children}
    </Element>
  );
}
