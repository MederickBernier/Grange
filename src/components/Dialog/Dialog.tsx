import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Overlay, mergeProps, useDialog, useModalOverlay } from 'react-aria';
import { useOverlayTriggerState, type OverlayTriggerState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  useGrangeConfig,
  type DialogSlot,
  type SlotOverrides,
} from '../../config/config';
import styles from './Dialog.module.scss';

export interface DialogProps {
  /** Whether the dialog is showing. Controlled, so the app owns it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The title. Announced as the dialog's name. */
  headline?: ReactNode;
  /** An icon above the headline, which M3 centres the whole dialog around when present. */
  icon?: ReactNode;
  /** The body. */
  children?: ReactNode;
  /** Buttons, laid out at the end. Usually TextButtons. */
  actions?: ReactNode;
  /**
   * Whether clicking the scrim or pressing Escape closes it. Off for a dialog the user must
   * answer, which is the only honest reason to take those away.
   */
  dismissable?: boolean;
  /** Fills the screen, for a dialog whose content needs the room. */
  fullScreen?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<DialogSlot>;
}

/**
 * A modal dialog.
 *
 * React Aria's useModalOverlay does the parts that are easy to get wrong: it locks the page
 * behind the dialog from scrolling, hides the rest of the document from assistive tech so a
 * screen reader cannot wander out of it, closes on Escape and on a click outside, and the
 * Overlay around it contains and restores focus.
 */
export function Dialog(props: DialogProps) {
  const state = useOverlayTriggerState({ isOpen: props.open, onOpenChange: props.onOpenChange });

  // Mounted only while open, so none of the modal machinery runs for a closed dialog.
  if (!state.isOpen) return null;
  return <DialogContent {...props} state={state} />;
}

function DialogContent({
  state,
  headline,
  icon,
  children,
  actions,
  dismissable = true,
  fullScreen = false,
  className,
  classNames,
  style,
  ...aria
}: DialogProps & { state: OverlayTriggerState }) {
  const { slots } = useComponentConfig('Dialog');
  const { portalContainer } = useGrangeConfig();
  const ref = useRef<HTMLDivElement>(null);

  const { modalProps, underlayProps } = useModalOverlay(
    { isDismissable: dismissable, isKeyboardDismissDisabled: !dismissable },
    state,
    ref,
  );
  const { dialogProps, titleProps } = useDialog({ ...aria }, ref);

  const slot = (name: DialogSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <Overlay portalContainer={portalContainer ?? undefined}>
      <div {...underlayProps} className={slot('scrim', 'grange-dialog-scrim', styles.scrim)}>
        <div
          {...mergeProps(modalProps, dialogProps)}
          ref={ref}
          className={slot('root', 'grange-dialog', styles.dialog)}
          style={style}
          data-full-screen={fullScreen || undefined}
          data-has-icon={icon ? 'true' : undefined}
        >
          {icon && <span className={slot('icon', 'grange-dialog-icon', styles.icon)}>{icon}</span>}
          {headline != null && (
            <h2 {...titleProps} className={slot('headline', 'grange-dialog-headline', styles.headline)}>
              {headline}
            </h2>
          )}
          {children != null && (
            <div className={slot('content', 'grange-dialog-content', styles.content)}>{children}</div>
          )}
          {actions != null && (
            <div className={slot('actions', 'grange-dialog-actions', styles.actions)}>{actions}</div>
          )}
        </div>
      </div>
    </Overlay>
  );
}
