import { cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useContextMenu, useMenuTrigger } from 'react-aria';
import { useMenuTriggerState } from 'react-stately';
import { Popover } from '../../overlays/Popover';
import { Button, type ButtonProps } from '../Button/Button';
import { Menu, MenuTrigger, type MenuProps } from './Menu';
import styles from './Menu.module.scss';

export interface MenuButtonProps extends Omit<ButtonProps, 'children' | 'onClick' | 'onPress'> {
  /** The button's label. */
  children: ReactNode;
  /** MenuItem and MenuSection children for the menu it opens. */
  items: MenuProps['children'];
  /** Fired with the chosen item's key. */
  onAction?: MenuProps['onAction'];
  menuVariant?: MenuProps['variant'];
  selectionMode?: MenuProps['selectionMode'];
  selectedKeys?: MenuProps['selectedKeys'];
  defaultSelectedKeys?: MenuProps['defaultSelectedKeys'];
  onSelectionChange?: MenuProps['onSelectionChange'];
  disabledKeys?: MenuProps['disabledKeys'];
  placement?: 'top' | 'bottom' | 'start' | 'end';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A button and the menu it opens — the catalog's DropDownButton.
 *
 * Deliberately thin: `MenuTrigger` already wires a trigger to a menu, and this is the ordinary
 * case of that, with the trigger being one of our buttons. It exists because writing the trigger
 * and the menu out by hand for a plain dropdown is three nested components for no decision.
 *
 * There is no separate label for the menu, and there deliberately is not one to give: the menu
 * is named by its trigger. `useMenuTrigger` points the menu's `aria-labelledby` at the button,
 * which wins over any `aria-label` — so a `menuLabel` prop would have sat in the API looking
 * like it worked. The button's own label names both.
 */
export function MenuButton(props: MenuButtonProps) {
  const {
    children,
    items,
    onAction,
    menuVariant,
    selectionMode,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    disabledKeys,
    placement = 'bottom',
    open,
    defaultOpen,
    onOpenChange,
    ...button
  } = props;

  return (
    <MenuTrigger placement={placement} open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Button {...button}>{children}</Button>
      <Menu
        variant={menuVariant}
        onAction={onAction}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        defaultSelectedKeys={defaultSelectedKeys}
        onSelectionChange={onSelectionChange}
        disabledKeys={disabledKeys}
      >
        {items}
      </Menu>
    </MenuTrigger>
  );
}

export interface ContextMenuProps {
  /** Exactly two children: the element to right-click, then the Menu it opens. */
  children: [ReactElement, ReactElement];
  onOpenChange?: (open: boolean) => void;
}

/**
 * A menu opened by a right-click, a long press, or the keyboard's context key.
 *
 * `useContextMenu` is the part worth having: it covers all three of those plus the screen-reader
 * path, which a bare `onContextMenu` handler does not — a long press on touch and the context
 * key on a keyboard both have to be recognised separately, and neither is a context menu event.
 *
 * The menu opens at the pointer rather than against the element, so there is nothing for
 * `usePopover` to anchor to. A one-pixel element is placed at the point and used as the anchor,
 * which keeps all the positioning — the flipping when there is no room, the containment — rather
 * than reimplementing it against raw coordinates.
 */
export function ContextMenu({ children, onOpenChange }: ContextMenuProps) {
  const [target, menu] = children;
  const state = useMenuTriggerState({ onOpenChange });
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const { menuProps } = useMenuTrigger({}, state, triggerRef);

  const { contextMenuProps } = useContextMenu({
    onContextMenu: ({ target: element, x, y }) => {
      // x and y are relative to the element, and the anchor is positioned in the viewport.
      const box = element.getBoundingClientRect();
      setPoint({ x: box.left + x, y: box.top + y });
      state.open();
    },
  });

  // The anchor has to exist before usePopover measures it, which is why the point is state and
  // the popover only renders once there is one.
  useEffect(() => {
    if (!state.isOpen) setPoint(null);
  }, [state.isOpen]);

  if (!isValidElement(target) || !isValidElement(menu)) {
    throw new Error('ContextMenu expects an element to press followed by a Menu');
  }

  return (
    <>
      {cloneElement(target, { ...contextMenuProps, ref: triggerRef } as never)}

      {state.isOpen && point && (
        <>
          <span
            ref={anchorRef}
            aria-hidden="true"
            style={{ position: 'fixed', left: point.x, top: point.y, width: 1, height: 1 }}
          />
          <Popover state={state} triggerRef={anchorRef} placement="bottom" offset={0} className={styles.popover}>
            {cloneElement(menu, { ...menuProps, autoFocus: 'first' } as never)}
          </Popover>
        </>
      )}
    </>
  );
}
