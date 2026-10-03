/**
 * The spacing scale, re-exported as a spec so a layout reads it the way every other component
 * reads its tokens.
 *
 * It is the one scale in this library that is **not** Google's. Material publishes no spacing
 * tokens — `SpacingTokens`, `SpaceTokens`, `DimensionTokens`, `DensityTokens`, `GridTokens` and
 * `LayoutTokens` are all 404 in androidx — and a layout component cannot be written without
 * one. So it was chosen, in `tokens/grange-spacing.json`, on the 4dp grid Material lays out on,
 * with the middle of the scale taken from `ListTokens` so a layout agrees with the components
 * it holds: `md` is `ItemBetweenSpace` and `lg` is `ItemLeadingSpace`.
 *
 * It is emitted as `--grange-space-*`, not `--md-sys-*`. Putting a chosen value in Google's
 * namespace would claim a provenance it does not have, and the whole point of this library is
 * that you can tell which is which.
 */
export { space, type SpaceName } from '../../tokens/generated/tokens';
