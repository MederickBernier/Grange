import { type CSSProperties, type ReactNode } from 'react';
import { useOverlayTriggerState } from 'react-stately';
import { ModalPanel } from '../../overlays/ModalPanel';
import { resolveSlotClass, useComponentConfig, type DrawerSlot, type SlotOverrides } from '../../config/config';
import styles from './Drawer.module.scss';

export interface NavigationDrawerProps {
  /** NavigationItem children, optionally with headlines between the groups. */
  children: ReactNode;
  /**
   * Modal drawers sit over the content behind a scrim and are dismissable; standard ones are
   * part of the layout and are always there. The tokens give them different colours and
   * elevations, so it is not only behaviour.
   */
  modal?: boolean;
  /** Only meaningful for a modal drawer. A standard one has nothing to open or close. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which edge it comes from. */
  placement?: 'start' | 'end';
  /** Whether Escape and a click on the scrim close it. Modal only. */
  dismissable?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<DrawerSlot>;
}

/**
 * The navigation drawer, modal or standard.
 *
 * Its items are the same NavigationItem the bar and the rail use, sized up here: the tokens give
 * the drawer a 336 by 56 pill rather than the bar's 56 by 32, so the drawer's stylesheet resizes
 * them through their stable hook class rather than through a second component.
 */
export function NavigationDrawer(props: NavigationDrawerProps) {
  const { defaults, slots } = useComponentConfig('NavigationDrawer');
  const {
    children,
    modal = defaults?.modal ?? false,
    open = false,
    onOpenChange,
    placement = defaults?.placement ?? 'start',
    dismissable = true,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const state = useOverlayTriggerState({ isOpen: open, onOpenChange });

  const panelClass = resolveSlotClass(
    'grange-drawer',
    styles.drawer,
    ...(slots?.root ?? []),
    classNames?.root,
    className,
  );

  // A standard drawer is layout, so it is rendered in place with no scrim and nothing to close.
  if (!modal) {
    return (
      <nav {...aria} className={panelClass} style={style} data-placement={placement}>
        {children}
      </nav>
    );
  }

  if (!state.isOpen) return null;

  return (
    <ModalPanel
      state={state}
      dismissable={dismissable}
      aria-label={aria['aria-label']}
      className={panelClass}
      scrimClassName={resolveSlotClass(
        'grange-drawer-scrim',
        styles.scrim,
        ...(slots?.scrim ?? []),
        classNames?.scrim,
      )}
      style={style}
    >
      <div className={styles.inner} data-placement={placement} data-modal="true">
        {children}
      </div>
    </ModalPanel>
  );
}

export interface DrawerHeadlineProps {
  children: ReactNode;
  className?: string;
}

/** A label over a group of destinations. */
export function DrawerHeadline({ children, className }: DrawerHeadlineProps) {
  return <h3 className={`grange-drawer-headline ${styles.headline} ${className ?? ''}`}>{children}</h3>;
}
