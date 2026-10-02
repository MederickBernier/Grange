import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocale, useMove } from 'react-aria';
import { useOverlayTriggerState } from 'react-stately';
import { ModalPanel } from '../../overlays/ModalPanel';
import { IconButton } from '../Button/Button';
import {
  resolveSlotClass,
  useComponentConfig,
  type SideSheetSlot,
  type SlotOverrides,
} from '../../config/config';
import { sideSheet as spec } from './specs';
import styles from './SideSheet.module.scss';

export interface SideSheetProps {
  children: ReactNode;
  /** Modal sheets sit over the content behind a scrim; standard ones are part of the layout. */
  modal?: boolean;
  /** Only meaningful for a modal sheet. A standard one has nothing to open or close. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which edge it comes from, resolved against the text direction. */
  placement?: 'start' | 'end';
  /** Whether Escape and a click on the scrim close it. Modal only. */
  dismissable?: boolean;
  /** A title row above the content. Given one, the sheet is labelled by it. */
  headline?: ReactNode;
  /** A close button in the header. Needs a headline to sit in. */
  showClose?: boolean;
  closeLabel?: string;
  /** Actions pinned to the bottom of the sheet, below the scrolling content. */
  actions?: ReactNode;
  /** Lets the inner edge be dragged to widen or narrow the sheet, within 256 and 400px. */
  resizable?: boolean;
  /** Starting width in px. Defaults to the spec's 360. */
  width?: number;
  onWidthChange?: (width: number) => void;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SideSheetSlot>;
}

/**
 * A sheet on the leading or trailing edge, modal or standard.
 *
 * It is the drawer's panel carrying content rather than destinations, so it reuses the same
 * modal shell and the same geometry. What it adds is a header, bottom actions, and a resize
 * handle on its inner edge.
 *
 * The handle is on useMove, like the bottom sheet's, so resizing works from the keyboard as well
 * as from a pointer: focus the separator and the arrow keys widen and narrow it. It carries the
 * separator role with aria-valuenow, which is the one role that describes a draggable splitter.
 */
export function SideSheet(props: SideSheetProps) {
  const { defaults, slots } = useComponentConfig('SideSheet');
  const {
    children,
    modal = defaults?.modal ?? false,
    open = false,
    onOpenChange,
    placement = defaults?.placement ?? 'end',
    dismissable = true,
    headline,
    showClose = false,
    closeLabel = 'Close',
    actions,
    resizable = false,
    width,
    onWidthChange,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const state = useOverlayTriggerState({ isOpen: open, onOpenChange });
  const [internalWidth, setInternalWidth] = useState(width ?? spec.width);
  const current = width ?? internalWidth;

  const setWidth = (next: number) => {
    const clamped = Math.min(spec.maxWidth, Math.max(spec.minWidth, Math.round(next)));
    if (width === undefined) setInternalWidth(clamped);
    onWidthChange?.(clamped);
  };

  const slot = (name: SideSheetSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const headlineId = 'grange-side-sheet-headline';

  const body = (
    <>
      {headline != null && (
        <div className={slot('header', 'grange-side-sheet-header', styles.header)}>
          <h2 id={headlineId} className={slot('headline', 'grange-side-sheet-headline', styles.headline)}>
            {headline}
          </h2>
          {showClose && (
            <IconButton aria-label={closeLabel} onPress={() => state.close()}>
              <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>
            </IconButton>
          )}
        </div>
      )}
      <div className={slot('content', 'grange-side-sheet-content', styles.content)}>{children}</div>
      {actions != null && <div className={slot('actions', 'grange-side-sheet-actions', styles.actions)}>{actions}</div>}
      {resizable && (
        <ResizeHandle
          className={slot('handle', 'grange-side-sheet-handle', styles.handle)}
          placement={placement}
          width={current}
          onResize={setWidth}
        />
      )}
    </>
  );

  const sheetStyle: CSSProperties = { width: `${current}px`, ...style };

  // A standard sheet is layout, so it is rendered in place with no scrim and nothing to close.
  if (!modal) {
    return (
      <aside
        {...aria}
        aria-labelledby={headline != null && !aria['aria-label'] ? headlineId : undefined}
        className={slot('root', 'grange-side-sheet', styles.sheet)}
        style={sheetStyle}
        data-placement={placement}
      >
        {body}
      </aside>
    );
  }

  if (!state.isOpen) return null;

  return (
    <ModalPanel
      state={state}
      dismissable={dismissable}
      aria-label={aria['aria-label']}
      aria-labelledby={headline != null && !aria['aria-label'] ? headlineId : undefined}
      className={slot('root', 'grange-side-sheet', styles.sheet)}
      scrimClassName={resolveSlotClass(
        'grange-side-sheet-scrim',
        styles.scrim,
        ...(slots?.scrim ?? []),
        classNames?.scrim,
      )}
      style={sheetStyle}
      data-placement={placement}
    >
      {body}
    </ModalPanel>
  );
}

function ResizeHandle({
  className,
  placement,
  width,
  onResize,
}: {
  className: string;
  placement: 'start' | 'end';
  width: number;
  onResize: (width: number) => void;
}) {
  const { direction } = useLocale();
  const live = useRef(width);
  live.current = width;

  /**
   * Which way a drag has to go to make the sheet wider. A sheet on the trailing edge grows when
   * the handle is dragged towards the leading edge, and in RTL that is the other way round, so
   * the sign is the product of the two.
   */
  const grow = (placement === 'end' ? -1 : 1) * (direction === 'rtl' ? -1 : 1);

  const { moveProps } = useMove({
    onMove: (event) => {
      // An arrow key reports a delta of 1; a pointer already moves in real pixels.
      const delta = event.pointerType === 'keyboard' ? event.deltaX * spec.keyboardStep : event.deltaX;
      live.current = live.current + delta * grow;
      onResize(live.current);
    },
  });

  return (
    <div
      {...moveProps}
      className={className}
      data-placement={placement}
      role="separator"
      tabIndex={0}
      aria-label="Resize"
      aria-orientation="vertical"
      aria-valuenow={Math.round(width)}
      aria-valuemin={spec.minWidth}
      aria-valuemax={spec.maxWidth}
    />
  );
}
