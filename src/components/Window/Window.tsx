import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Overlay, useDialog, useMove } from 'react-aria';
import { useControlledState } from '../../utils';
import { IconButton } from '../Button/Button';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type WindowSlot,
} from '../../config/config';
import { windowSpec as spec } from './specs';
import styles from './Window.module.scss';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowProps {
  /** Whether the window is on screen. Controlled, so the app owns it. */
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The title, which is also the window's accessible name. */
  title: ReactNode;
  children?: ReactNode;
  /** Extra controls in the title bar, before the minimise and close buttons. */
  actions?: ReactNode;
  position?: WindowPosition;
  defaultPosition?: WindowPosition;
  onPositionChange?: (position: WindowPosition) => void;
  size?: WindowSize;
  defaultSize?: WindowSize;
  onSizeChange?: (size: WindowSize) => void;
  /** Collapses to the title bar. */
  minimizable?: boolean;
  /** Fills the viewport. */
  maximizable?: boolean;
  resizable?: boolean;
  /** Off for a window the app closes itself. */
  closable?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<WindowSlot>;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * A floating window: a non-modal dialog that can be moved, resized, collapsed and maximised.
 *
 * **Non-modal is the substantive part.** There is no scrim and no focus trap, because the point
 * of a window is that the page behind it stays usable — which means it must not behave like a
 * dialog that has taken the page over. It still carries `role="dialog"` and is named by its
 * title, so a screen reader can find it and say what it is.
 *
 * **Moving and resizing have no ARIA role, and pretending otherwise would be worse.** There is
 * no "move handle" role; the one role that fits a draggable boundary is `separator`, and a
 * window's corner grip resizes in two directions at once, which a separator does not describe.
 * So each handle is a plain focusable control with a real label, and both are on `useMove`, so
 * the arrow keys move and resize exactly as a pointer does. A window that can only be moved
 * with a mouse is a window some people cannot move.
 *
 * Position and size are clamped to the viewport on every change. A window dragged off the top
 * of the screen is a window whose title bar — and therefore every one of its controls — can
 * never be reached again.
 */
export function Window(props: WindowProps) {
  const { defaults, slots } = useComponentConfig('Window');
  const {
    open,
    onOpenChange,
    title,
    children,
    actions,
    position,
    defaultPosition = { x: 80, y: 80 },
    onPositionChange,
    size,
    defaultSize = { width: 480, height: 320 },
    onSizeChange,
    minimizable = defaults?.minimizable ?? true,
    maximizable = defaults?.maximizable ?? true,
    resizable = defaults?.resizable ?? true,
    closable = defaults?.closable ?? true,
    className,
    classNames,
    style,
  } = props;

  const [at, setAt] = useControlledState(position, defaultPosition, onPositionChange);
  const [box, setBox] = useControlledState(size, defaultSize, onSizeChange);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const { dialogProps, titleProps } = useDialog({ role: 'dialog' }, ref);

  const viewport = () => ({
    width: typeof window === 'undefined' ? Infinity : window.innerWidth,
    height: typeof window === 'undefined' ? Infinity : window.innerHeight,
  });

  const moveBy = useCallback(
    (dx: number, dy: number) => {
      const { width, height } = viewport();
      setAt({
        // Clamped so the title bar can always be reached: a window dragged off the top of the
        // screen takes every one of its own controls with it.
        x: clamp(at.x + dx, 0, Math.max(0, width - box.width)),
        y: clamp(at.y + dy, 0, Math.max(0, height - spec.barHeight)),
      });
    },
    [at.x, at.y, box.width, setAt],
  );

  const resizeBy = useCallback(
    (dx: number, dy: number) => {
      const { width, height } = viewport();
      setBox({
        width: clamp(box.width + dx, spec.minWidth, Math.max(spec.minWidth, width - at.x)),
        height: clamp(box.height + dy, spec.minHeight, Math.max(spec.minHeight, height - at.y)),
      });
    },
    [at.x, at.y, box.height, box.width, setBox],
  );

  const slot = (name: WindowSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  if (!open) return null;

  /*
   * Maximised ignores the stored rect rather than overwriting it, so restoring puts the window
   * back exactly where it was instead of somewhere that happens to be the viewport's corner.
   */
  const rect: CSSProperties = maximized
    ? { insetInlineStart: 0, top: 0, width: '100vw', height: '100vh' }
    : {
        insetInlineStart: at.x,
        top: at.y,
        width: box.width,
        height: minimized ? undefined : box.height,
      };

  return (
    <Overlay>
      <div
        {...dialogProps}
        ref={ref}
        className={slot('root', 'grange-window', styles.window)}
        style={{ ...rect, ...style }}
        data-minimized={minimized || undefined}
        data-maximized={maximized || undefined}
      >
        <TitleBar
          className={slot('bar', 'grange-window-bar', styles.bar)}
          title={title}
          titleProps={titleProps}
          // A maximised window has nowhere to go, so the handle is not offered.
          movable={!maximized}
          onMove={moveBy}
          actions={actions}
          controls={
            <>
              {minimizable && (
                <IconButton
                  variant="standard"
                  size="xs"
                  aria-label={minimized ? 'Restore' : 'Minimise'}
                  onClick={() => setMinimized(!minimized)}
                >
                  <Glyph path={minimized ? 'M200-440v-80h560v80H200Z' : 'M240-120v-80h480v80H240Z'} />
                </IconButton>
              )}
              {maximizable && (
                <IconButton
                  variant="standard"
                  size="xs"
                  aria-label={maximized ? 'Restore down' : 'Maximise'}
                  onClick={() => setMaximized(!maximized)}
                >
                  <Glyph path="M200-200v-560h560v560H200Zm80-80h400v-400H280v400Z" />
                </IconButton>
              )}
              {closable && (
                <IconButton
                  variant="standard"
                  size="xs"
                  aria-label="Close"
                  onClick={() => onOpenChange?.(false)}
                >
                  <Glyph path="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </IconButton>
              )}
            </>
          }
        />

        {!minimized && (
          <div className={slot('body', 'grange-window-body', styles.body)}>{children}</div>
        )}

        {resizable && !maximized && !minimized && (
          <ResizeGrip className={styles.grip} onResize={resizeBy} size={box} />
        )}
      </div>
    </Overlay>
  );
}

function TitleBar({
  className,
  title,
  titleProps,
  movable,
  onMove,
  actions,
  controls,
}: {
  className: string;
  title: ReactNode;
  titleProps: React.HTMLAttributes<HTMLElement>;
  movable: boolean;
  onMove: (dx: number, dy: number) => void;
  actions?: ReactNode;
  controls: ReactNode;
}) {
  const { moveProps } = useMove({
    onMove: (event) => {
      // An arrow key reports a delta of 1; a pointer already moves in real pixels.
      const scale = event.pointerType === 'keyboard' ? spec.keyboardStep : 1;
      onMove(event.deltaX * scale, event.deltaY * scale);
    },
  });

  return (
    <div className={className}>
      {/*
        The drag surface. Focusable and on useMove, so the arrow keys move the window — there is
        no ARIA role for a move handle, so it carries a label that says what the keys do rather
        than a role that would describe it wrongly.
      */}
      <div
        {...(movable ? moveProps : {})}
        className={styles.grab}
        tabIndex={movable ? 0 : undefined}
        aria-label={movable ? 'Move window with the arrow keys' : undefined}
        data-movable={movable || undefined}
      >
        <span {...titleProps} className={styles.title}>
          {title}
        </span>
      </div>
      {actions}
      {controls}
    </div>
  );
}

function ResizeGrip({
  className,
  onResize,
  size,
}: {
  className: string | undefined;
  onResize: (dx: number, dy: number) => void;
  size: WindowSize;
}) {
  const { moveProps } = useMove({
    onMove: (event) => {
      const scale = event.pointerType === 'keyboard' ? spec.keyboardStep : 1;
      onResize(event.deltaX * scale, event.deltaY * scale);
    },
  });

  return (
    <div
      {...moveProps}
      className={className}
      tabIndex={0}
      /*
       * No role. A separator describes a boundary on one axis; this grip changes width and
       * height at once, so the role would be a lie and the label is the honest part. The size
       * is announced so the keys have feedback.
       */
      aria-label={`Resize window, ${Math.round(size.width)} by ${Math.round(size.height)}`}
    />
  );
}

const Glyph = ({ path }: { path: string }) => (
  <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
    <path d={path} />
  </svg>
);
