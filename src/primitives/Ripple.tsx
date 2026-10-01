/**
 * Press ripple, ported from Material Web's ripple (Apache 2.0, see NOTICE).
 * Same constants: 450ms grow on the standard easing, 225ms minimum press, soft-edged radial wave.
 */
import { forwardRef, useImperativeHandle, useRef } from 'react';

const PRESS_GROW_MS = 450;
const MINIMUM_PRESS_MS = 225;
const FADE_OUT_MS = 375;
const INITIAL_ORIGIN_SCALE = 0.2;
const PADDING = 10;
const SOFT_EDGE_MINIMUM_SIZE = 75;
const SOFT_EDGE_CONTAINER_RATIO = 0.35;
const STANDARD_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

export interface RippleHandle {
  /** Start a ripple. x and y are relative to the host; omit them to start from the center (keyboard). */
  start(x?: number, y?: number): void;
  end(): void;
}

interface Wave {
  el: HTMLSpanElement;
  startedAt: number;
  opacity: number;
}

export const Ripple = forwardRef<RippleHandle>(function Ripple(_props, ref) {
  const host = useRef<HTMLSpanElement>(null);
  const wave = useRef<Wave | null>(null);

  useImperativeHandle(ref, () => ({
    start(x, y) {
      const root = host.current;
      if (!root || typeof root.animate !== 'function') return;
      fade(wave.current, 0);

      const { width, height } = root.getBoundingClientRect();
      const maxDim = Math.max(width, height);
      const softEdge = Math.max(SOFT_EDGE_CONTAINER_RATIO * maxDim, SOFT_EDGE_MINIMUM_SIZE);
      const initial = Math.max(1, Math.floor(maxDim * INITIAL_ORIGIN_SCALE));
      const maxRadius = Math.hypot(width, height) + PADDING;
      const scale = (maxRadius + softEdge) / initial;

      const cx = x ?? width / 2;
      const cy = y ?? height / 2;
      const opacity =
        parseFloat(getComputedStyle(root).getPropertyValue('--md-sys-state-pressed-state-layer-opacity')) || 0.1;

      const el = document.createElement('span');
      el.className = 'grange-ripple-wave';
      el.style.width = el.style.height = `${initial}px`;
      root.appendChild(el);

      el.animate(
        [
          { transform: `translate(${cx - initial / 2}px, ${cy - initial / 2}px) scale(1)` },
          { transform: `translate(${(width - initial) / 2}px, ${(height - initial) / 2}px) scale(${scale})` },
        ],
        { duration: PRESS_GROW_MS, easing: STANDARD_EASING, fill: 'forwards' },
      );
      el.animate([{ opacity: 0 }, { opacity }], { duration: 105, easing: 'linear', fill: 'forwards' });
      wave.current = { el, startedAt: performance.now(), opacity };
    },
    end() {
      const current = wave.current;
      wave.current = null;
      if (!current) return;
      const elapsed = performance.now() - current.startedAt;
      fade(current, Math.max(0, MINIMUM_PRESS_MS - elapsed));
    },
  }));

  return <span ref={host} className="grange-ripple" aria-hidden="true" />;
});

function fade(wave: Wave | null, delay: number) {
  if (!wave) return;
  const { el, opacity } = wave;
  window.setTimeout(() => {
    const anim = el.animate([{ opacity }, { opacity: 0 }], { duration: FADE_OUT_MS, easing: 'linear', fill: 'forwards' });
    anim.finished.then(() => el.remove()).catch(() => el.remove());
  }, delay);
}
