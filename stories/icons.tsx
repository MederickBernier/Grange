/* A few Material Symbols paths (Apache 2.0), 960-unit viewBox. */
const Svg = ({ d, filled = true }: { d: string; filled?: boolean }) => (
  <svg viewBox="0 -960 960 960" aria-hidden="true" style={filled ? undefined : { fill: 'none', stroke: 'currentColor', strokeWidth: 60 }}>
    <path d={d} />
  </svg>
);
const HEART =
  'm480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z';
export const AddIcon = () => <Svg d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />;
export const CheckIcon = () => <Svg d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />;
export const ArrowIcon = () => <Svg d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />;
export const HeartIcon = () => <Svg d={HEART} filled={false} />;
export const HeartFilledIcon = () => <Svg d={HEART} />;
