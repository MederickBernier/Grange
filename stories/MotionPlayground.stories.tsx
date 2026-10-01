import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Button,
  ButtonGroup,
  ConnectedButtonGroup,
  ConnectedButtonGroupItem,
  GrangeProvider,
  ToggleButton,
  tokens,
  useSpring,
  type SpringSpec,
} from '../src';
import { HeartFilledIcon, HeartIcon } from './icons';

type SpringName = tokens.SpringName;
type Scheme = tokens.MotionSchemeName;
const NAMES: SpringName[] = ['fastSpatial', 'defaultSpatial', 'slowSpatial', 'fastEffects', 'defaultEffects', 'slowEffects'];

const meta: Meta = {
  title: 'Foundations/Motion playground',
  parameters: { layout: 'fullscreen' },
};
export default meta;

function fromTokens(scheme: Scheme): Record<SpringName, SpringSpec> {
  return Object.fromEntries(
    NAMES.map((n) => [n, { stiffness: tokens.springs[scheme][n].stiffness, dampingRatio: tokens.springs[scheme][n].dampingRatio }]),
  ) as Record<SpringName, SpringSpec>;
}

/** Normalised step response of a damped spring (mass 1), 0 to 1. */
function response(t: number, { stiffness, dampingRatio: z }: SpringSpec): number {
  const w = Math.sqrt(stiffness);
  if (z >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
}

function stats(s: SpringSpec) {
  const overshoot = s.dampingRatio < 1 ? Math.exp((-Math.PI * s.dampingRatio) / Math.sqrt(1 - s.dampingRatio ** 2)) : 0;
  let settle = 0;
  for (let t = 0; t < 3; t += 0.002) if (Math.abs(1 - response(t, s)) > 0.02) settle = t;
  return { overshoot, settleMs: Math.round(settle * 1000) };
}

function Curve({ spec, base }: { spec: SpringSpec; base: SpringSpec }) {
  const W = 220;
  const H = 90;
  const T = 0.8;
  const path = (s: SpringSpec) => {
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * T;
      const y = response(t, s);
      d += `${i ? 'L' : 'M'}${((t / T) * W).toFixed(1)},${(H - 12 - y * (H - 30)).toFixed(1)}`;
    }
    return d;
  };
  const target = H - 12 - (H - 30);
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <line x1={0} x2={W} y1={target} y2={target} stroke="var(--md-sys-color-outline-variant)" strokeDasharray="3 3" />
      <line x1={0} x2={W} y1={H - 12} y2={H - 12} stroke="var(--md-sys-color-outline-variant)" />
      <path d={path(base)} fill="none" stroke="var(--md-sys-color-outline)" strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={path(spec)} fill="none" stroke="var(--md-sys-color-primary)" strokeWidth={2.5} />
      <text x={W} y={H} textAnchor="end" fontSize={10} fill="var(--md-sys-color-on-surface-variant)">
        {T * 1000} ms
      </text>
    </svg>
  );
}

function SpringControl({
  name,
  spec,
  base,
  onChange,
}: {
  name: SpringName;
  spec: SpringSpec;
  base: SpringSpec;
  onChange: (s: SpringSpec) => void;
}) {
  const { overshoot, settleMs } = stats(spec);
  const changed = spec.stiffness !== base.stiffness || spec.dampingRatio !== base.dampingRatio;
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong className="md-typescale-title-small">{name}</strong>
        {changed && (
          <button style={linkButton} onClick={() => onChange(base)}>
            reset
          </button>
        )}
      </div>
      <Curve spec={spec} base={base} />
      <label style={sliderRow}>
        <span>stiffness</span>
        <input
          type="range"
          min={50}
          max={5000}
          step={10}
          value={spec.stiffness}
          onChange={(e) => onChange({ ...spec, stiffness: Number(e.target.value) })}
        />
        <output>{spec.stiffness}</output>
      </label>
      <label style={sliderRow}>
        <span>damping ratio</span>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={spec.dampingRatio}
          onChange={(e) => onChange({ ...spec, dampingRatio: Number(e.target.value) })}
        />
        <output>{spec.dampingRatio.toFixed(2)}</output>
      </label>
      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        overshoot {(overshoot * 100).toFixed(0)}% · settles in ~{settleMs} ms
      </div>
    </div>
  );
}

function SpatialDemo() {
  const [right, setRight] = useState(false);
  const spatial = useSpring('defaultSpatial');
  const effects = useSpring('defaultEffects');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Button variant="tonal" onPress={() => setRight((r) => !r)}>
        Move
      </Button>
      <div style={{ position: 'relative', width: 260, height: 56, borderRadius: 28, background: 'var(--md-sys-color-surface-container-high)' }}>
        <motion.div
          initial={false}
          animate={{ x: right ? 204 : 0 }}
          transition={spatial}
          style={{ position: 'absolute', top: 4, left: 4, width: 48, height: 48, borderRadius: 24, background: 'var(--md-sys-color-primary)' }}
        />
      </div>
      <motion.div
        initial={false}
        animate={{ opacity: right ? 1 : 0.25 }}
        transition={effects}
        className="md-typescale-label-large"
        style={{ color: 'var(--md-sys-color-primary)' }}
      >
        effects spring (opacity)
      </motion.div>
    </div>
  );
}

function Playground() {
  const [scheme, setScheme] = useState<Scheme>('expressive');
  const base = useMemo(() => fromTokens(scheme), [scheme]);
  const [values, setValues] = useState<Record<SpringName, SpringSpec>>(() => fromTokens('expressive'));

  const overrides = useMemo(() => {
    const o: Partial<Record<SpringName, SpringSpec>> = {};
    for (const n of NAMES) {
      if (values[n].stiffness !== base[n].stiffness || values[n].dampingRatio !== base[n].dampingRatio) o[n] = values[n];
    }
    return o;
  }, [values, base]);

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <header className="sb-row">
        <h1 className="md-typescale-headline-small" style={{ margin: 0 }}>
          Motion playground
        </h1>
        <ConnectedButtonGroup
          aria-label="Motion scheme"
          selectedKeys={[scheme]}
          onSelectionChange={(k) => {
            const next = [...k][0] as Scheme;
            setScheme(next);
            setValues(fromTokens(next));
          }}
        >
          <ConnectedButtonGroupItem id="expressive">Expressive</ConnectedButtonGroupItem>
          <ConnectedButtonGroupItem id="standard">Standard</ConnectedButtonGroupItem>
        </ConnectedButtonGroup>
        <span className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Drag the sliders, then try the components below. Dashed curve = spec value.
        </span>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {NAMES.map((n) => (
          <SpringControl key={n} name={n} spec={values[n]} base={base[n]} onChange={(s) => setValues((v) => ({ ...v, [n]: s }))} />
        ))}
      </section>

      <GrangeProvider scheme={scheme} springOverrides={overrides}>
        <section style={{ ...card, display: 'grid', gap: 20 }}>
          <h2 className="md-typescale-title-medium" style={{ margin: 0 }}>
            Try it
          </h2>
          <div className="sb-row">
            <span className="sb-label">toggle · fastSpatial</span>
            <ToggleButton size="m" icon={<HeartIcon />} selectedIcon={<HeartFilledIcon />}>
              Favorite
            </ToggleButton>
            <ToggleButton size="l" variant="tonal">
              Large
            </ToggleButton>
          </div>
          <div className="sb-row">
            <span className="sb-label">press · defaultEffects</span>
            <Button size="m">Press and hold</Button>
            <Button size="l" shape="square" variant="outlined">
              Square
            </Button>
          </div>
          <div className="sb-row">
            <span className="sb-label">group · fastSpatial</span>
            <ButtonGroup>
              <Button variant="tonal" size="m">One</Button>
              <Button variant="tonal" size="m">Two</Button>
              <Button variant="tonal" size="m">Three</Button>
            </ButtonGroup>
          </div>
          <div className="sb-row">
            <span className="sb-label">defaultSpatial</span>
            <SpatialDemo />
          </div>
        </section>
      </GrangeProvider>

      <section style={card}>
        <h2 className="md-typescale-title-medium" style={{ margin: '0 0 8px' }}>
          Changed values
        </h2>
        <pre className="md-typescale-body-small" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {Object.keys(overrides).length
            ? JSON.stringify({ scheme, overrides }, null, 2)
            : 'No changes: all springs match the M3E spec.'}
        </pre>
      </section>
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--md-sys-color-surface-container-low)',
  borderRadius: 16,
  padding: 16,
  display: 'grid',
  gap: 8,
};
const sliderRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '96px 1fr 44px',
  alignItems: 'center',
  gap: 8,
  font: 'var(--md-sys-typescale-body-small-weight) var(--md-sys-typescale-body-small-size) var(--md-ref-typeface-plain)',
};
const linkButton: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--md-sys-color-primary)',
  cursor: 'pointer',
  font: 'inherit',
};

/** Tune the six M3E springs live and feel them on real components. Share the "Changed values" block. */
export const Springs: StoryObj = { render: () => <Playground /> };
