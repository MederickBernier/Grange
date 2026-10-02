import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Overlay, mergeProps, useDialog, useModalOverlay } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';
import { useGrangeConfig } from '../config/config';

export interface ModalPanelProps {
  children: ReactNode;
  state: OverlayTriggerState;
  /** Whether Escape and a click on the scrim close it. */
  dismissable?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  scrimClassName?: string;
  style?: CSSProperties;
  /**
   * Reaches the panel element, so a stylesheet can place and shape it by which edge it is on.
   * Without it the panel would need a wrapper to hang the attribute on, and a wrapper cannot
   * carry the layout: the scrim's flex only lays out its own child.
   */
  'data-placement'?: string;
}

/**
 * The modal shell behind the drawer and the bottom sheet: a scrim, a dialog, and everything
 * useModalOverlay brings with it, which is the scroll lock, hiding the rest of the page from
 * assistive tech, Escape and outside-click, with the Overlay containing and restoring focus.
 *
 * Dialog predates this and carries its own copy of the same wiring; it could move onto this.
 */
export function ModalPanel({
  children,
  state,
  dismissable = true,
  className,
  scrimClassName,
  style,
  'data-placement': placement,
  ...aria
}: ModalPanelProps) {
  const { portalContainer } = useGrangeConfig();
  const ref = useRef<HTMLDivElement>(null);

  const { modalProps, underlayProps } = useModalOverlay(
    { isDismissable: dismissable, isKeyboardDismissDisabled: !dismissable },
    state,
    ref,
  );
  const { dialogProps } = useDialog({ ...aria }, ref);

  return (
    <Overlay portalContainer={portalContainer ?? undefined}>
      <div {...underlayProps} className={scrimClassName}>
        <div
          {...mergeProps(modalProps, dialogProps)}
          ref={ref}
          className={className}
          style={style}
          data-placement={placement}
        >
          {children}
        </div>
      </div>
    </Overlay>
  );
}
