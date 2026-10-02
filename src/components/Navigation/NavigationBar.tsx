import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { resolveSlotClass, useComponentConfig, type NavigationSlot, type SlotOverrides } from '../../config/config';
import type { NavigationArrangement } from './specs';
import styles from './Navigation.module.scss';

export interface NavigationBarProps {
  /** NavigationItem children, three to five of them. */
  children: ReactNode;
  /** Icon above the label, or beside it. The inline arrangement is M3 Expressive's. */
  arrangement?: NavigationArrangement;
  /** The taller 80px bar, for labels that need the room. */
  tall?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<NavigationSlot>;
}

/**
 * The bottom navigation bar, for three to five top-level destinations.
 *
 * A nav landmark holding links or buttons, with the current destination marked by aria-current.
 * It is deliberately not a tablist: these lead somewhere rather than swapping a panel in place,
 * and a screen reader should say so.
 */
export const NavigationBar = forwardRef<HTMLElement, NavigationBarProps>(
  function NavigationBar(props, ref) {
    const { defaults, slots } = useComponentConfig('NavigationBar');
    const {
      children,
      arrangement = defaults?.arrangement ?? 'vertical',
      tall = defaults?.tall ?? false,
      className,
      classNames,
      style,
      ...aria
    } = props;

    return (
      <nav
        {...aria}
        ref={ref}
        className={resolveSlotClass(
          'grange-navigation-bar',
          styles.bar,
          ...(slots?.root ?? []),
          classNames?.root,
          className,
        )}
        style={style}
        data-arrangement={arrangement}
        data-tall={tall || undefined}
      >
        {children}
      </nav>
    );
  },
);

export interface NavigationRailProps {
  /** NavigationItem children. */
  children: ReactNode;
  /**
   * The expanded rail, which lays its items out inline and takes a width between 220 and 360px.
   * New in M3 Expressive.
   */
  expanded?: boolean;
  /** The narrower 80px collapsed rail. */
  narrow?: boolean;
  /** Content above the items, usually a FAB or a menu button. */
  header?: ReactNode;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<NavigationSlot>;
}

/**
 * The navigation rail, for the same destinations on a wider screen.
 *
 * Collapsed it is a 96px column of stacked items; expanded it widens and lays them out inline,
 * which is M3 Expressive's addition. The expanded width is a range in the tokens rather than a
 * number, so it is set as min and max and the layout picks within it.
 */
export const NavigationRail = forwardRef<HTMLElement, NavigationRailProps>(
  function NavigationRail(props, ref) {
    const { defaults, slots } = useComponentConfig('NavigationRail');
    const {
      children,
      expanded = defaults?.expanded ?? false,
      narrow = defaults?.narrow ?? false,
      header,
      className,
      classNames,
      style,
      ...aria
    } = props;

    return (
      <nav
        {...aria}
        ref={ref}
        className={resolveSlotClass(
          'grange-navigation-rail',
          styles.rail,
          ...(slots?.root ?? []),
          classNames?.root,
          className,
        )}
        style={style}
        data-expanded={expanded || undefined}
        data-narrow={narrow && !expanded ? 'true' : undefined}
      >
        {header && <div className={styles.railHeader}>{header}</div>}
        <div className={styles.railItems} data-arrangement={expanded ? 'horizontal' : 'vertical'}>
          {children}
        </div>
      </nav>
    );
  },
);
