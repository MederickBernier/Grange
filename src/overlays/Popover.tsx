import {
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { FocusScope, Overlay, usePopover, useOverlayTrigger } from 'react-aria';
import { useOverlayTriggerState, type OverlayTriggerState } from 'react-stately';
import { resolveSlotClass, useComponentConfig, useGrangeConfig } from '../config/config';
import styles from './Popover.module.scss';

export interface PopoverProps {
  children: ReactNode;
  state: OverlayTriggerState;
  triggerRef: RefObject<Element | null>;
  placement?: 'top' | 'bottom' | 'start' | 'end';
  offset?: number;
  /** Matches the popover's width to its trigger, which a select needs and a menu does not. */
  matchTriggerWidth?: boolean;
  /**
   * Leaves the rest of the page usable while it is open, for a surface that only adds to what is
   * already there: a rich tooltip, not a menu. A menu wants the opposite, because the next click
   * should go to the menu and nowhere else.
   */
  nonModal?: boolean;
  /**
   * The element ref, when the caller needs it too. A combo box does: `useComboBox` is given the
   * popover's ref so it can tell a press inside the list from a press outside the field, and it
   * has to be the same ref this positions.
   */
  popoverRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  style?: CSSProperties;
}

/**
 * The shared anchored surface behind the menus and, later, the select.
 *
 * usePopover does the positioning, the flipping when there is no room, the dismiss on Escape or
 * a click outside, and the scroll containment; this only adds where the portal lands and the
 * option to match the trigger's width.
 */
export function Popover({
  children,
  state,
  triggerRef,
  placement = 'bottom',
  offset = 4,
  matchTriggerWidth = false,
  nonModal = false,
  popoverRef: providedRef,
  className,
  style,
}: PopoverProps) {
  const { portalContainer } = useGrangeConfig();
  const ownRef = useRef<HTMLDivElement>(null);
  const popoverRef = providedRef ?? ownRef;

  const { popoverProps, underlayProps } = usePopover(
    { triggerRef, popoverRef, placement, offset, isNonModal: nonModal },
    state,
  );

  /*
   * Measured in a layout effect rather than during render. A layout effect runs before the
   * browser paints, so the popover is still drawn once, at the right width — and the ref is
   * read at the only time React guarantees it is populated.
   */
  const [triggerWidth, setTriggerWidth] = useState<number>();
  useLayoutEffect(() => {
    if (!matchTriggerWidth) return;
    const trigger = triggerRef.current as HTMLElement | null;
    if (trigger) setTriggerWidth(trigger.offsetWidth);
  }, [matchTriggerWidth, triggerRef]);

  const width = matchTriggerWidth && triggerWidth != null ? { width: triggerWidth } : undefined;

  return (
    <Overlay portalContainer={portalContainer ?? undefined}>
      {/*
        Catches a click anywhere outside, which usePopover turns into a dismiss. A non-modal
        surface leaves it out: the full-screen layer would swallow the first click on whatever is
        behind it, and useOverlay closes on an outside press without it anyway.
      */}
      {!nonModal && <div {...underlayProps} style={{ position: 'fixed', inset: 0 }} />}
      <div
        {...popoverProps}
        ref={popoverRef}
        className={className}
        style={{ ...popoverProps.style, ...width, ...style }}
      >
        {children}
      </div>
    </Overlay>
  );
}

export interface PopoverTriggerProps {
  /** Exactly two children: the trigger, then what it opens. */
  children: [ReactElement, ReactNode];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: 'top' | 'bottom' | 'start' | 'end';
  offset?: number;
  /** Leaves the page behind usable and does not contain focus. */
  nonModal?: boolean;
  /** Names the surface, which it needs because it is a dialog. */
  'aria-label'?: string;
  className?: string;
}

/**
 * A button and the anchored surface it opens — the catalog's Popup, and the generic version of
 * what `MenuTrigger` does for a menu.
 *
 * The low-level `Popover` beneath it takes a state and a trigger ref and is what the menu, the
 * select and the combo box use. This is for a surface with arbitrary content: a filter panel, a
 * colour picker, a form in a bubble.
 *
 * It is a dialog rather than a tooltip, and that is the whole reason it exists separately from
 * `Tooltip`: the moment there is something to interact with inside, a tooltip is the wrong
 * markup — assistive tech cannot reach into one, and it closes on pointer-leave, so its controls
 * can never be pressed. `usePopover` brings the dismiss on Escape and on an outside press, and
 * focus moves into the surface and back to the trigger afterwards.
 */
export function PopoverTrigger(props: PopoverTriggerProps) {
  const { defaults, slots } = useComponentConfig('Popover');
  const {
    children,
    placement = defaults?.placement ?? 'bottom',
    offset,
    nonModal = defaults?.nonModal ?? false,
    className,
    ...aria
  } = props;
  const [trigger, content] = children;

  const state = useOverlayTriggerState({
    isOpen: props.open,
    defaultOpen: props.defaultOpen,
    onOpenChange: props.onOpenChange,
  });
  const triggerRef = useRef<HTMLElement>(null);
  const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, triggerRef);

  if (!isValidElement(trigger)) {
    throw new Error('PopoverTrigger expects a trigger element followed by its content');
  }

  return (
    <>
      {cloneElement(trigger, { ...triggerProps, ref: triggerRef } as never)}
      {state.isOpen && (
        <Popover
          state={state}
          triggerRef={triggerRef}
          placement={placement}
          offset={offset}
          nonModal={nonModal}
          className={resolveSlotClass('grange-popover', styles.popover, ...(slots?.root ?? []), className)}
        >
          {/*
            Focus has to move into the surface. usePopover listens for Escape on the overlay
            element, so with focus left on the trigger the key never reaches it and the popover
            cannot be dismissed from the keyboard. Containing it also matches what the modal
            variant already does to the rest of the page, which it hides from assistive tech.
          */}
          <FocusScope restoreFocus autoFocus contain={!nonModal}>
            <div
              {...overlayProps}
              role="dialog"
              aria-label={aria['aria-label']}
              /*
               * Focusable so that autoFocus has somewhere to land. A panel whose content holds
               * nothing focusable would otherwise leave focus on the trigger, and Escape — which
               * usePopover listens for on this element — would never arrive.
               */
              tabIndex={-1}
              className={styles.content}
            >
              {content}
            </div>
          </FocusScope>
        </Popover>
      )}
    </>
  );
}
