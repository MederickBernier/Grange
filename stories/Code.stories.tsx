import type { Meta, StoryObj } from '@storybook/react-vite';
import { Barcode, QRCode, Stack, byteCapacity } from '../src';

/**
 * A Code 128 barcode and a QR code, both encoded here rather than brought in.
 *
 * A barcode library is a lookup table and a checksum; a QR library is that plus Reed–Solomon
 * and a mask chooser. Neither is large enough to be worth a dependency that has to be kept up
 * to date, audited and shipped.
 *
 * **Every table is checked by arithmetic rather than by eye.** Code 128's 107 patterns are six
 * bar-and-space widths that must add to eleven modules; the QR block table's codewords must
 * add to each version's known capacity; the format and version information are *computed* from
 * their BCH generators rather than transcribed; and the Reed–Solomon is checked against the
 * standard's own worked example.
 *
 * The test that earned its keep reads the codewords back out of a finished QR grid the way a
 * scanner would — find the mask, unmask, walk the same zigzag. It caught an alignment pattern
 * being dropped from version 7 upwards, which produced a symbol that looked completely normal
 * and scanned as nothing at all.
 *
 * **The quiet zone is part of the symbol**, not margin around it: ten modules for Code 128,
 * four for QR. Both are inside the SVG, where a layout cannot crop them off.
 */
const meta: Meta = {
  title: 'Components/Barcode and QR Code',
  parameters: { layout: 'padded' },
};
export default meta;

/** Code 128, which switches into its digit-pair set when a run is long enough to pay for it. */
export const Barcodes: StoryObj = {
  render: () => (
    <Stack gap="xl" align="start">
      <Stack gap="xs">
        <span className="sb-label">Text, in code set B</span>
        <Barcode value="GRANGE-REACT" />
      </Stack>

      <Stack gap="xs">
        <span className="sb-label">Digits, which switch to set C: two to a symbol</span>
        <Barcode value="5901234123457" />
      </Stack>

      <Stack gap="xs">
        <span className="sb-label">Without the human-readable line</span>
        <Barcode value="A1B2C3" showValue={false} height={40} />
      </Stack>
    </Stack>
  ),
};

/** The four error-correction levels, same string. Higher survives more damage and costs room. */
export const Levels: StoryObj = {
  render: () => (
    <Stack direction="row" gap="lg" wrap align="start">
      {(['L', 'M', 'Q', 'H'] as const).map((level) => (
        <Stack key={level} gap="xs" align="center">
          <QRCode value="https://example.com/grange" level={level} />
          <span className="sb-label">
            {level} · {byteCapacity(10, level)} bytes at version 10
          </span>
        </Stack>
      ))}
    </Stack>
  ),
};

/** Byte mode is UTF-8, so anything encodes — and the version grows to hold it. */
export const Contents: StoryObj = {
  render: () => (
    <Stack direction="row" gap="lg" wrap align="start">
      <Stack gap="xs" align="center">
        <QRCode value="x" moduleSize={6} />
        <span className="sb-label">One byte, version 1</span>
      </Stack>
      <Stack gap="xs" align="center">
        <QRCode value="caf&#233; &#9749; &#26085;&#26412;&#35486;" moduleSize={6} />
        <span className="sb-label">UTF-8</span>
      </Stack>
      <Stack gap="xs" align="center">
        <QRCode value={'https://example.com/a/fairly/long/path?with=a&few=parameters&attached=yes'} />
        <span className="sb-label">A URL</span>
      </Stack>
    </Stack>
  ),
};
