import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { FocusScope, useInteractOutside, type AriaButtonProps } from 'react-aria';
import { ButtonBase, uniform, type GrangeButtonElement } from '../ButtonBase/ButtonBase';
import {
  resolveSlotClass,
  useComponentConfig,
  type ButtonSlot,
  type SlotOverrides,
} from '../../config/config';
import { fabMenu as spec, type FabVariant } from './specs';
import fabStyles from './Fab.module.scss';
import styles from './FabMenu.module.scss';

interface FabMenuContextValue {
  variant: FabVariant;
  close: () => void;
}

const FabMenuContext = createContext<FabMenuContextValue | null>(null);

export interface FabMenuProps {
  /** FabMenuItem children, the actions the FAB opens onto. */
  children: ReactNode;
  /** Whether the menu is open. Controlled, so the app owns it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The toggle's icon while closed. */
  icon: ReactNode;
  /** Its icon while open, typically a cross. */
  closeIcon: ReactNode;
  /** Names the toggle while closed. */
  'aria-label': string;
  /** Names it while open, since by then it closes rather than opens. */
  closeAriaLabel?: string;
  variant?: FabVariant;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<'root'>;
}

/**
 * A FAB that opens onto a short list of labelled actions. New in M3 Expressive, and the
 * replacement for the speed dial and for stacks of small FABs.
 *
 * Keyboard and focus are handled here rather than through React Aria's menu collection: the list
 * traps focus and restores it, Escape and a click outside close it, Up, Down, Home and End move
 * between items, the arrows open it from the toggle, and typing jumps to a matching label.
 *
 * It does not sit on `useMenu`, and the roadmap records why. An item here is a `ButtonBase`,
 * which is what gives it the FAB's shape, ripple, state layer and press spring, and a link when
 * it has an href. `ButtonBase` routes its props through `useButton`, which filters them down to
 * real DOM attributes, so `useMenuItem`'s handlers would be dropped on the way through; and
 * layering `useMenuItem`'s `usePress` over `useButton`'s own would put two press systems on one
 * node. The collection would cost the item API and the FAB rendering to buy the typeahead that
 * is thirty lines below.
 */
export function FabMenu(props: FabMenuProps) {
  const { defaults, slots, behavior } = useComponentConfig('FabMenu');
  const {
    children,
    open,
    onOpenChange,
    icon,
    closeIcon,
    'aria-label': ariaLabel,
    closeAriaLabel,
    variant = defaults?.variant ?? 'primary',
    className,
    classNames,
    style,
  } = props;

  const listId = useId();
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<GrangeButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  /** Set when the arrows open the menu, so focus lands on the right end of it. */
  const pendingFocus = useRef<'first' | 'last' | null>(null);

  // FocusScope's autoFocus takes the first item; opening with the up arrow wants the last.
  useEffect(() => {
    if (!open || pendingFocus.current !== 'last') {
      pendingFocus.current = null;
      return;
    }
    pendingFocus.current = null;
    const items = itemsIn(list.current);
    items[items.length - 1]?.focus();
  }, [open]);

  useInteractOutside({
    ref: container,
    isDisabled: !open,
    onInteractOutside: () => onOpenChange(false),
  });

  /**
   * Escape closes from anywhere inside, including the toggle, and the arrows open a closed menu
   * onto the end they point at, the way a menu button does.
   *
   * Both are handled on the container rather than on the toggle, because ButtonBase routes its
   * props through useButton, which filters them down to real DOM attributes and would drop an
   * onKeyDown on the way. While the menu is closed the toggle is the only thing inside that can
   * hold focus, so there is nothing to disambiguate.
   */
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      onOpenChange(false);
      return;
    }
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      pendingFocus.current = event.key === 'ArrowDown' ? 'first' : 'last';
      onOpenChange(true);
    }
  };

  /**
   * Roving focus over the items, plus typeahead. FocusScope contains and restores focus but does
   * not move it, and a menu is expected to answer the arrow keys rather than only Tab.
   */
  const typed = useRef({ buffer: '', at: 0 });

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = itemsIn(event.currentTarget);
    if (items.length === 0) return;

    const current = items.indexOf(document.activeElement as HTMLElement);
    const last = items.length - 1;

    const move = (to: number) => {
      event.preventDefault();
      items[to]?.focus();
    };

    switch (event.key) {
      case 'ArrowDown':
        return move(current >= last ? 0 : current + 1);
      case 'ArrowUp':
        return move(current <= 0 ? last : current - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(last);
    }

    // Typing jumps to the next item whose label starts with what has been typed, which is the
    // one thing the hand-rolled keyboard was missing against a real menu.
    if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) return;

    const now = Date.now();
    typed.current.buffer =
      now - typed.current.at > spec.typeaheadResetMs ? event.key : typed.current.buffer + event.key;
    typed.current.at = now;
    const query = typed.current.buffer.toLowerCase();

    /*
     * A fresh search starts at the item after the current one, so pressing the same letter again
     * cycles through the items beginning with it. A search that is still being typed starts at
     * the current one, so adding a letter narrows what is already found rather than skipping
     * past it.
     */
    const from = query.length === 1 ? current + 1 : Math.max(current, 0);
    const order = items.slice(from).concat(items.slice(0, from));
    const match = order.find((item) => (item.textContent ?? '').trim().toLowerCase().startsWith(query));
    if (match) {
      event.preventDefault();
      match.focus();
    }
  };

  return (
    <div
      ref={container}
      className={resolveSlotClass(
        'grange-fab-menu',
        styles.menu,
        ...(slots?.root ?? []),
        classNames?.root,
        className,
      )}
      style={style}
      data-open={open || undefined}
      onKeyDown={onKeyDown}
    >
      {open && (
        <FocusScope restoreFocus autoFocus contain>
          <div
            ref={list}
            id={listId}
            role="menu"
            /*
             * Focusable programmatically but not a tab stop: the FocusScope above moves focus
             * into the first item when the menu opens, and -1 is what lets anything focus the
             * list itself without adding a stop that lands on nothing.
             */
            tabIndex={-1}
            aria-label={ariaLabel}
            className={styles.list}
            onKeyDown={onListKeyDown}
          >
            <FabMenuContext.Provider value={{ variant, close: () => onOpenChange(false) }}>
              {children}
            </FabMenuContext.Provider>
          </div>
        </FocusScope>
      )}

      <ButtonBase
        ref={toggle}
        className={`grange-fab-menu-toggle ${fabStyles.fab} ${styles.toggle}`}
        style={{
          ['--_size' as string]: `${spec.closeSize}px`,
          ['--grange-icon-size' as string]: `${open ? spec.closeIcon : spec.itemIcon}px`,
        }}
        aria-label={open ? (closeAriaLabel ?? ariaLabel) : ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? listId : undefined}
        padding={0}
        cornerSpring={behavior.springs.selection}
        corners={() => uniform(spec.closeSize / 2)}
        onPress={() => onOpenChange(!open)}
        dataAttributes={{ 'data-variant': variant, 'data-open': String(open) }}
      >
        <span className={fabStyles.icon}>{open ? closeIcon : icon}</span>
      </ButtonBase>
    </div>
  );
}

/** The focusable items in a list, in DOM order. A disabled one is not a stop. */
function itemsIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')];
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface FabMenuItemProps extends Omit<
  AriaButtonProps<'button' | 'a'>,
  'children' | 'elementType' | 'isDisabled'
> {
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  href?: string;
  /** Leaves the menu open after this item is chosen. Off by default, as picking an action ends it. */
  keepOpen?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ButtonSlot>;
}

export const FabMenuItem = forwardRef<GrangeButtonElement, FabMenuItemProps>(
  function FabMenuItem(props, ref) {
    const { slots, behavior } = useComponentConfig('FabMenuItem');
    const { children, icon, disabled, keepOpen, className, classNames, style, onPress, ...rest } = props;
    const context = useContext(FabMenuContext);
    if (!context) throw new Error('FabMenuItem must be inside a FabMenu');

    const slot = (name: ButtonSlot, hook: string, builtIn?: string) =>
      resolveSlotClass(
        hook,
        builtIn,
        ...(slots?.[name] ?? []),
        classNames?.[name],
        name === 'root' ? className : undefined,
      );

    return (
      <ButtonBase
        ref={ref}
        {...rest}
        role="menuitem"
        isDisabled={disabled}
        className={slot('root', 'grange-fab-menu-item', `${fabStyles.fab} ${styles.item}`)}
        style={{
          ['--_height' as string]: `${spec.itemHeight}px`,
          ['--_gap' as string]: `${spec.itemGap}px`,
          ['--grange-icon-size' as string]: `${spec.itemIcon}px`,
          ...style,
        }}
        padding={spec.itemPadding}
        touchTarget={spec.itemHeight < behavior.touchTargetBelow}
        cornerSpring={behavior.springs.press}
        corners={() => uniform(spec.itemHeight / 2)}
        onPress={(event) => {
          onPress?.(event);
          if (!keepOpen) context.close();
        }}
        dataAttributes={{ 'data-variant': context.variant }}
      >
        {icon && <span className={slot('icon', 'grange-button-icon', fabStyles.icon)}>{icon}</span>}
        <span className={slot('label', 'grange-button-label', fabStyles.label)}>{children}</span>
      </ButtonBase>
    );
  },
);
