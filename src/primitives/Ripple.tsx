/**
 * Press ripple, ported from Material Web's ripple (Apache 2.0, see NOTICE).
 * Same constants by default: 450ms grow on the standard easing, 225ms minimum press, soft-edged
 * radial wave. All of them are configurable through GrangeProvider's `behavior.ripple`.
 */
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useGrangeConfig, type RippleBehavior } from '../config/config';

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
  const { ripple } = useGrangeConfig().behavior;
  // Read through a ref so a handle captured by a parent always sees the current config.
  const settings = useRef<RippleBehavior>(ripple);
  settings.current = ripple;

  useImperativeHandle(ref, () => ({
    start(x, y) {
      const root = host.current;
      const cfg = settings.current;
      if (!root || !cfg.enabled || typeof root.animate !== 'function') return;
      fade(wave.current, 0, cfg.fadeOutMs);

      const { width, height } = root.getBoundingClientRect();
      const maxDim = Math.max(width, height);
      const softEdge = Math.max(cfg.softEdgeContainerRatio * maxDim, cfg.softEdgeMinimumSize);
      const initial = Math.max(1, Math.floor(maxDim * cfg.initialOriginScale));
      const maxRadius = Math.hypot(width, height) + cfg.padding;
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
        { duration: cfg.growMs, easing: cfg.easing, fill: 'forwards' },
      );
      el.animate([{ opacity: 0 }, { opacity }], { duration: 105, easing: 'linear', fill: 'forwards' });
      wave.current = { el, startedAt: performance.now(), opacity };
    },
    end() {
      const current = wave.current;
      const cfg = settings.current;
      wave.current = null;
      if (!current) return;
      const elapsed = performance.now() - current.startedAt;
      fade(current, Math.max(0, cfg.minimumPressMs - elapsed), cfg.fadeOutMs);
    },
  }));

  return <span ref={host} className="grange-ripple" aria-hidden="true" />;
});

function fade(wave: Wave | null, delay: number, fadeOutMs: number) {
  if (!wave) return;
  const { el, opacity } = wave;
  window.setTimeout(() => {
    const anim = el.animate([{ opacity }, { opacity: 0 }], { duration: fadeOutMs, easing: 'linear', fill: 'forwards' });
    anim.finished.then(() => el.remove()).catch(() => el.remove());
  }, delay);
}
