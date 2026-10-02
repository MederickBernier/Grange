import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useMove } from 'react-aria';
import { useOverlayTriggerState } from 'react-stately';
import { ModalPanel } from '../../overlays/ModalPanel';
import {
  resolveSlotClass,
  useComponentConfig,
  type BottomSheetSlot,
  type SlotOverrides,
} from '../../config/config';
import { bottomSheet as spec } from './specs';
import styles from './BottomSheet.module.scss';

export interface BottomSheetProps {
  children: ReactNode;
  /** Modal sheets sit over the content behind a scrim; standard ones are part of the layout. */
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Whether Escape, a click on the scrim, or a drag downwards close it. */
  dismissable?: boolean;
  /** Hides the drag handle, for a sheet that should only be closed by its own controls. */
  hideHandle?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<BottomSheetSlot>;
}

/**
 * A sheet that comes up from the bottom edge, modal or standard.
 *
 * The drag handle is on React Aria's useMove, which means dragging it works with a pointer and
 * with the keyboard: focus the handle and the down arrow moves the sheet just as a drag does.
 * A handle that only answered a mouse would be a handle most people cannot use.
 */
export function BottomSheet(props: BottomSheetProps) {
  const { defaults, slots } = useComponentConfig('BottomSheet');
  const {
    children,
    modal = defaults?.modal ?? true,
    open = false,
    onOpenChange,
    dismissable = true,
    hideHandle = false,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const state = useOverlayTriggerState({ isOpen: open, onOpenChange });
  const [offset, setOffset] = useState(0);

  const slot = (name: BottomSheetSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  const handle = !hideHandle && (
    <DragHandle
      className={slot('handle', 'grange-bottom-sheet-handle', styles.handle)}
      enabled={dismissable}
      onDrag={setOffset}
      onRelease={(distance, keyboard) => {
        if (distance > spec.dismissDistance) {
          state.close();
          setOffset(0);
          return;
        }
        // A pointer drag that did not go far enough springs back; a keyboard drag stays put so
        // the next press continues from where it left off.
        if (!keyboard) setOffset(0);
      }}
    />
  );

  const content = (
    <>
      {handle}
      <div className={styles.content}>{children}</div>
    </>
  );

  // A standard sheet is layout, so it stays in place with no scrim and nothing to close.
  if (!modal) {
    return (
      <div {...aria} className={slot('root', 'grange-bottom-sheet', styles.sheet)} style={style}>
        {content}
      </div>
    );
  }

  if (!state.isOpen) return null;

  return (
    <ModalPanel
      state={state}
      dismissable={dismissable}
      aria-label={aria['aria-label']}
      className={slot('root', 'grange-bottom-sheet', styles.sheet)}
      scrimClassName={resolveSlotClass(
        'grange-bottom-sheet-scrim',
        styles.scrim,
        ...(slots?.scrim ?? []),
        classNames?.scrim,
      )}
      style={{ translate: `0 ${offset}px`, ...style }}
    >
      {content}
    </ModalPanel>
  );
}

function DragHandle({
  className,
  enabled,
  onDrag,
  onRelease,
}: {
  className: string;
  enabled: boolean;
  onDrag: (offset: number) => void;
  onRelease: (distance: number, keyboard: boolean) => void;
}) {
  const travelled = useRef(0);

  const { moveProps } = useMove({
    onMoveStart: (event) => {
      // A pointer drag is one gesture, so it starts from nothing. The keyboard fires a whole
      // start, move and end for every arrow press, so resetting here would throw away the
      // progress of each press and the sheet could never be dragged away from the keyboard.
      if (event.pointerType !== 'keyboard') travelled.current = 0;
    },
    onMove: (event) => {
      if (!enabled) return;
      // An arrow key reports a delta of 1, so it is scaled to something a person can actually
      // drag with; a pointer already moves in real pixels.
      const delta = event.pointerType === 'keyboard' ? event.deltaY * spec.keyboardStep : event.deltaY;
      // Downwards only: a sheet does not go further up than its open position.
      travelled.current = Math.max(0, travelled.current + delta);
      onDrag(travelled.current);
    },
    onMoveEnd: (event) => {
      if (!enabled) return;
      const keyboard = event.pointerType === 'keyboard';
      onRelease(travelled.current, keyboard);
      // A keyboard drag keeps what it has moved so the next press carries on from there.
      if (!keyboard) travelled.current = 0;
    },
  });

  return (
    <div
      {...moveProps}
      className={className}
      role="separator"
      tabIndex={enabled ? 0 : undefined}
      aria-label="Drag to resize or dismiss"
    >
      <span className={styles.grip} aria-hidden="true" />
    </div>
  );
}
