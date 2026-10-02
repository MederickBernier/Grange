import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Overlay, useButton, useToast, useToastRegion } from 'react-aria';
import { ToastQueue, useToastQueue, type QueuedToast, type ToastState } from 'react-stately';
import { resolveSlotClass, useComponentConfig, useGrangeConfig, type SnackbarSlot, type SlotOverrides } from '../../config/config';
import { snackbar as spec } from './specs';
import styles from './Snackbar.module.scss';

export interface SnackbarContent {
  /** The message. One or two lines; anything longer belongs in a dialog. */
  message: ReactNode;
  /** A single action, which is all the spec allows. */
  actionLabel?: string;
  onAction?: () => void;
  /** Adds a close button, for a message with no action of its own. */
  closeable?: boolean;
}

/**
 * Creates the queue a region drains.
 *
 * It lives outside React so anything can post to it, including code with no component to hang a
 * hook off, which is the usual case for "that request failed".
 */
export function createSnackbarQueue(options?: { maxVisibleToasts?: number }) {
  return new ToastQueue<SnackbarContent>({ maxVisibleToasts: options?.maxVisibleToasts ?? 1 });
}

export interface SnackbarRegionProps {
  queue: ToastQueue<SnackbarContent>;
  /** Where the stack sits. M3 puts snackbars at the bottom, centred on a wide screen. */
  placement?: 'bottom' | 'bottom-start' | 'bottom-end';
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SnackbarSlot>;
}

/**
 * Renders whatever is in the queue. Mount it once, near the root.
 *
 * useToastRegion makes the stack a landmark that assistive tech can be sent to, and holds a
 * toast open while it is hovered or focused so it cannot vanish mid-read.
 */
export function SnackbarRegion({
  queue,
  placement = 'bottom',
  className,
  classNames,
  style,
}: SnackbarRegionProps) {
  const { slots } = useComponentConfig('Snackbar');
  const { portalContainer } = useGrangeConfig();
  const state = useToastQueue(queue);
  const ref = useRef<HTMLDivElement>(null);
  const { regionProps } = useToastRegion({}, state, ref);

  if (state.visibleToasts.length === 0) return null;

  return (
    <Overlay portalContainer={portalContainer ?? undefined}>
      <div
        {...regionProps}
        ref={ref}
        className={resolveSlotClass(
          'grange-snackbar-region',
          styles.region,
          ...(slots?.region ?? []),
          classNames?.region,
          className,
        )}
        style={style}
        data-placement={placement}
      >
        {state.visibleToasts.map((toast) => (
          <Snackbar key={toast.key} toast={toast} state={state} classNames={classNames} slots={slots} />
        ))}
      </div>
    </Overlay>
  );
}

function Snackbar({
  toast,
  state,
  classNames,
  slots,
}: {
  toast: QueuedToast<SnackbarContent>;
  state: ToastState<SnackbarContent>;
  classNames?: SlotOverrides<SnackbarSlot>;
  slots?: Partial<Record<string, Array<string | { replace: string | undefined }>>>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { toastProps, contentProps, titleProps, closeButtonProps } = useToast({ toast }, state, ref);
  // Same as the select's trigger: these are button options, so they go through useButton.
  const { buttonProps: closeProps } = useButton(closeButtonProps, closeRef);
  const { message, actionLabel, onAction, closeable } = toast.content;

  const slot = (name: SnackbarSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name]);

  return (
    <div {...toastProps} ref={ref} className={slot('root', 'grange-snackbar', styles.snackbar)}>
      <div {...contentProps} className={styles.content}>
        <span {...titleProps} className={styles.message}>
          {message}
        </span>
      </div>

      {actionLabel && (
        <button
          type="button"
          className={slot('action', 'grange-snackbar-action', styles.action)}
          onClick={() => {
            onAction?.();
            state.close(toast.key);
          }}
        >
          {actionLabel}
        </button>
      )}

      {closeable && (
        <button {...closeProps} ref={closeRef} className={styles.close} aria-label="Dismiss">
          <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export { spec as snackbarSpec };
