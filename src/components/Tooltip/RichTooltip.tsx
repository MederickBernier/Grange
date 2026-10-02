import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { mergeProps, useFocusWithin, useHover, useOverlayTrigger } from 'react-aria';
// The DOM's PointerEvent, not React's synthetic one: these listeners are added to the node.
type PointerEvent = globalThis.PointerEvent;
import { useOverlayTriggerState } from 'react-stately';
import { Popover } from '../../overlays/Popover';
import {
  resolveSlotClass,
  useComponentConfig,
  type RichTooltipSlot,
  type SlotOverrides,
} from '../../config/config';
import { richTooltip as spec } from './specs';
import styles from './RichTooltip.module.scss';

export interface RichTooltipProps {
  /** The paragraph. */
  children: ReactNode;
  /** The element it hangs off. One element that forwards props and a ref. */
  trigger: ReactElement;
  /** An optional heading over the text, which also names the panel. */
  subhead?: ReactNode;
  /** Buttons along the bottom. Text buttons, as the spec draws them. */
  actions?: ReactNode;
  /** Which side to prefer. It flips automatically when there is no room. */
  placement?: 'top' | 'bottom' | 'start' | 'end';
  /**
   * Opens on a press and stays until it is dismissed, rather than following the pointer. The
   * spec's persistent variant, and the one to use when the panel is the only way to reach what
   * is in it.
   */
  persistent?: boolean;
  /** Milliseconds before it appears on hover. Ignored when persistent. */
  delay?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<RichTooltipSlot>;
}

/**
 * The rich tooltip: a heading, a paragraph and buttons.
 *
 * Despite sharing the name it is not the same kind of thing as the plain tooltip, and it is not
 * built on `useTooltipTrigger`. A tooltip is a label — `role="tooltip"`, no focus, nothing to
 * interact with — and the moment there is a button inside, that stops being true: a tooltip that
 * vanishes when the pointer leaves the trigger is one whose button can never be pressed, and
 * assistive tech reaches nothing inside a tooltip anyway. So this is a non-modal popover with
 * `role="dialog"`, named by its subhead, which is what the content actually is.
 *
 * That makes the hover handling ours rather than React Aria's, and the part worth knowing is the
 * grace period: the panel stays open while the pointer is over either the trigger or the panel,
 * and for {@link richTooltip.closeDelayMs} after leaving both, so a pointer can travel across
 * the gap between them. Focus inside the panel holds it open for the same reason.
 *
 * A press outside closes it, which `usePopover` brings. Escape is handled here instead, because
 * `useOverlay` listens for it on the overlay and a rich tooltip is usually open while focus is
 * still on the trigger or nowhere near it.
 */
export function RichTooltip(props: RichTooltipProps) {
  const { defaults, slots } = useComponentConfig('RichTooltip');
  const {
    children,
    trigger,
    subhead,
    actions,
    placement = defaults?.placement ?? 'bottom',
    persistent = defaults?.persistent ?? false,
    delay = spec.delayMs,
    open,
    defaultOpen,
    onOpenChange,
    disabled,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const state = useOverlayTriggerState({ isOpen: open, defaultOpen, onOpenChange });
  const triggerRef = useRef<HTMLElement>(null);
  const subheadId = useId();

  const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, triggerRef);

  // One timer for both directions: opening after the warmup and closing after the grace period.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const schedule = useCallback((run: () => void, after: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(run, after);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Escape closes it wherever focus is, which is not what useOverlay's own handler covers.
  useEffect(() => {
    if (!state.isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      clearTimeout(timer.current);
      state.close();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [state]);

  const hovering = useRef({ trigger: false, panel: false });
  const focused = useRef({ trigger: false, panel: false });

  const settle = useCallback(() => {
    if (disabled) return;
    const wanted =
      hovering.current.trigger || hovering.current.panel || focused.current.trigger || focused.current.panel;
    if (wanted) {
      // A keyboard user gets it at once, as the plain tooltip does on focus; only a pointer
      // crossing the trigger has to wait out the warmup.
      const immediate = hovering.current.panel || focused.current.trigger || focused.current.panel;
      if (!state.isOpen) schedule(() => state.open(), immediate ? 0 : delay);
      else clearTimeout(timer.current);
      return;
    }
    schedule(() => state.close(), spec.closeDelayMs);
  }, [delay, disabled, schedule, state]);

  /*
   * The trigger's hover is listened for on the element rather than handed to it as props.
   * useButton filters its props down to real DOM attributes, so onPointerEnter and
   * onPointerLeave would be dropped on the way through any of the buttons here — and the trigger
   * is whatever the caller passes, so it cannot be assumed to forward them either. Watching the
   * node sidesteps the question.
   */
  useEffect(() => {
    const node = triggerRef.current;
    if (!node || disabled || persistent) return;

    const enter = (event: PointerEvent) => {
      // A touch has no hover to speak of, which is why the plain tooltip ignores it too.
      if (event.pointerType === 'touch') return;
      hovering.current.trigger = true;
      settle();
    };
    const leave = () => {
      hovering.current.trigger = false;
      settle();
    };

    // Focus shows it immediately, which is the only way a keyboard reaches it at all.
    const gainedFocus = () => {
      focused.current.trigger = true;
      settle();
    };
    const lostFocus = () => {
      focused.current.trigger = false;
      settle();
    };

    node.addEventListener('pointerenter', enter);
    node.addEventListener('pointerleave', leave);
    node.addEventListener('focus', gainedFocus);
    node.addEventListener('blur', lostFocus);
    return () => {
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('focus', gainedFocus);
      node.removeEventListener('blur', lostFocus);
    };
  }, [disabled, persistent, settle]);

  const { hoverProps: panelHover } = useHover({
    isDisabled: disabled || persistent,
    onHoverStart: () => {
      hovering.current.panel = true;
      settle();
    },
    onHoverEnd: () => {
      hovering.current.panel = false;
      settle();
    },
  });

  // Focus moving into the panel holds it open; leaving it lets the grace period run.
  const { focusWithinProps } = useFocusWithin({
    isDisabled: disabled || persistent,
    onFocusWithinChange: (within) => {
      focused.current.panel = within;
      settle();
    },
  });

  if (!isValidElement(trigger)) {
    throw new Error('RichTooltip expects a single trigger element that forwards props and a ref');
  }

  const slot = (name: RichTooltipSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  /*
   * A hover tooltip's trigger is not an expanded control: the panel is a comment on it, not a
   * thing it opens, so aria-expanded and aria-haspopup would both be wrong. A persistent one
   * genuinely is, and keeps them.
   */
  const triggerAria = persistent
    ? triggerProps
    : { ...triggerProps, 'aria-expanded': undefined, 'aria-haspopup': undefined };

  return (
    <>
      {cloneElement(trigger, {
        ...triggerAria,
        ref: triggerRef,
      } as never)}

      {state.isOpen && (
        <Popover
          state={state}
          triggerRef={triggerRef}
          placement={placement}
          offset={spec.offset}
          nonModal
          className={styles.popover}
        >
          <div
            {...mergeProps(overlayProps, panelHover, focusWithinProps)}
            role="dialog"
            aria-label={subhead == null ? aria['aria-label'] : undefined}
            aria-labelledby={subhead != null ? subheadId : undefined}
            className={slot('root', 'grange-rich-tooltip', styles.tooltip)}
            style={style}
          >
            {subhead != null && (
              <p id={subheadId} className={slot('subhead', 'grange-rich-tooltip-subhead', styles.subhead)}>
                {subhead}
              </p>
            )}
            <div className={slot('content', 'grange-rich-tooltip-content', styles.content)}>{children}</div>
            {actions != null && (
              <div className={slot('actions', 'grange-rich-tooltip-actions', styles.actions)}>{actions}</div>
            )}
          </div>
        </Popover>
      )}
    </>
  );
}
