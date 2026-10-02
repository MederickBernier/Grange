import { cloneElement, isValidElement, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { Overlay, mergeProps, useOverlayPosition, useTooltip, useTooltipTrigger } from 'react-aria';
import { useTooltipTriggerState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  useGrangeConfig,
  type SlotOverrides,
  type TooltipSlot,
} from '../../config/config';
import { tooltip as spec } from './specs';
import styles from './Tooltip.module.scss';

export interface TooltipProps {
  /** The text. A tooltip is a label, so keep it short. */
  content: ReactNode;
  /**
   * The element it describes. One element that forwards props and a ref, which every component
   * here does; the tooltip clones it to attach its handlers.
   */
  children: ReactElement;
  /** Which side to prefer. It flips automatically when there is no room. */
  placement?: 'top' | 'bottom' | 'start' | 'end';
  /** Milliseconds before it appears on hover. Focus shows it at once, as the pattern expects. */
  delay?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TooltipSlot>;
}

/**
 * A plain tooltip.
 *
 * React Aria's useTooltipTrigger carries the parts that are tedious and easy to get subtly
 * wrong: the warmup and cooldown so running a pointer across a row of icons does not flash a
 * tooltip under each one, showing immediately on keyboard focus, hiding on Escape, and never
 * appearing for a touch, where there is no hover to speak of.
 */
export function Tooltip(props: TooltipProps) {
  const { slots } = useComponentConfig('Tooltip');
  const { portalContainer } = useGrangeConfig();
  const {
    content,
    children,
    placement = 'top',
    delay = spec.delayMs,
    disabled,
    className,
    classNames,
    style,
  } = props;

  const state = useTooltipTriggerState({ delay, isDisabled: disabled });
  const triggerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const { triggerProps, tooltipProps } = useTooltipTrigger({ isDisabled: disabled }, state, triggerRef);
  const { tooltipProps: ariaTooltipProps } = useTooltip(tooltipProps, state);
  const { overlayProps, placement: resolved } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef,
    placement,
    offset: spec.offset,
    isOpen: state.isOpen,
  });

  if (!isValidElement(children)) {
    throw new Error('Tooltip expects a single element child that forwards props and a ref');
  }

  return (
    <>
      {cloneElement(children, { ...triggerProps, ref: triggerRef } as never)}
      {state.isOpen && (
        <Overlay portalContainer={portalContainer ?? undefined}>
          <div
            {...mergeProps(ariaTooltipProps, overlayProps)}
            ref={overlayRef}
            className={resolveSlotClass(
              'grange-tooltip',
              styles.tooltip,
              ...(slots?.root ?? []),
              classNames?.root,
              className,
            )}
            style={{ ...overlayProps.style, ...style }}
            data-placement={resolved ?? placement}
          >
            {content}
          </div>
        </Overlay>
      )}
    </>
  );
}
