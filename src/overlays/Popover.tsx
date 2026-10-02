import { useRef, type ReactNode, type RefObject } from 'react';
import { Overlay, usePopover } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';
import { useGrangeConfig } from '../config/config';

export interface PopoverProps {
  children: ReactNode;
  state: OverlayTriggerState;
  triggerRef: RefObject<Element | null>;
  placement?: 'top' | 'bottom' | 'start' | 'end';
  offset?: number;
  /** Matches the popover's width to its trigger, which a select needs and a menu does not. */
  matchTriggerWidth?: boolean;
  className?: string;
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
  className,
}: PopoverProps) {
  const { portalContainer } = useGrangeConfig();
  const popoverRef = useRef<HTMLDivElement>(null);

  const { popoverProps, underlayProps } = usePopover(
    { triggerRef, popoverRef, placement, offset },
    state,
  );

  const width = matchTriggerWidth
    ? { width: (triggerRef.current as HTMLElement | null)?.offsetWidth }
    : undefined;

  return (
    <Overlay portalContainer={portalContainer ?? undefined}>
      {/* Catches a click anywhere outside, which usePopover turns into a dismiss. */}
      <div {...underlayProps} style={{ position: 'fixed', inset: 0 }} />
      <div
        {...popoverProps}
        ref={popoverRef}
        className={className}
        style={{ ...popoverProps.style, ...width }}
      >
        {children}
      </div>
    </Overlay>
  );
}
