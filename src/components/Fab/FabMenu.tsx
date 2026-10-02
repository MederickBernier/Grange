import {
  createContext,
  forwardRef,
  useContext,
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
 * Keyboard and focus are handled here rather than through React Aria's menu collection, which
 * arrives with the overlay layer: the list traps focus and restores it, Escape and a click
 * outside close it, and Up, Down, Home and End move between items. When useMenu lands this
 * should move onto it and inherit typeahead for free.
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

  useInteractOutside({
    ref: container,
    isDisabled: !open,
    onInteractOutside: () => onOpenChange(false),
  });

  // Escape closes from anywhere inside, including the toggle.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      onOpenChange(false);
    }
  };

  /**
   * Roving focus over the items. FocusScope contains and restores focus but does not move it,
   * and a menu is expected to answer the arrow keys rather than only Tab.
   */
  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const items = [
      ...(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []),
    ];
    if (items.length === 0) return;

    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const last = items.length - 1;

    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowDown'
            ? current >= last
              ? 0
              : current + 1
            : current <= 0
              ? last
              : current - 1;

    items[next]?.focus();
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
            id={listId}
            role="menu"
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
        aria-label={open ? closeAriaLabel ?? ariaLabel : ariaLabel}
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

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface FabMenuItemProps
  extends Omit<AriaButtonProps<'button' | 'a'>, 'children' | 'elementType' | 'isDisabled'> {
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
