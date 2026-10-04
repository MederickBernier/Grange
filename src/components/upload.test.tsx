import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ChunkProgress,
  DropZone,
  GrangeProvider,
  Upload,
  acceptsFile,
  fileId,
  formatBytes,
  rejectReason,
  toUploadFiles,
  type UploadFile,
} from '../index';

/* A real File, whose size is its contents — the component reads file.size, not a prop. */
const file = (name: string, size = 1000, type = '') => new File(['x'.repeat(size)], name, { type });

describe('acceptsFile', () => {
  const png = { name: 'cat.png', size: 10, type: 'image/png' };

  it('takes everything when nothing is asked for', () => {
    expect(acceptsFile(png)).toBe(true);
    expect(acceptsFile(png, '  ')).toBe(true);
  });

  it('matches an extension', () => {
    expect(acceptsFile(png, '.png')).toBe(true);
    expect(acceptsFile(png, '.jpg')).toBe(false);
  });

  it('matches a full type and a wildcard', () => {
    expect(acceptsFile(png, 'image/png')).toBe(true);
    expect(acceptsFile(png, 'image/*')).toBe(true);
    expect(acceptsFile(png, 'video/*')).toBe(false);
  });

  it('takes a list, and any one of them is enough', () => {
    expect(acceptsFile(png, '.pdf, image/*')).toBe(true);
  });

  it('ignores case, because a .PNG off a camera is the same file', () => {
    expect(acceptsFile({ ...png, name: 'CAT.PNG', type: 'IMAGE/PNG' }, '.png')).toBe(true);
    expect(acceptsFile({ ...png, name: 'CAT.PNG', type: 'IMAGE/PNG' }, 'image/*')).toBe(true);
  });

  it('does not match a wildcard against the wrong family', () => {
    // "image/*" must not be satisfied by "images-archive/zip" or anything merely starting the same.
    expect(acceptsFile({ name: 'a.zip', size: 1, type: 'imagex/zip' }, 'image/*')).toBe(false);
  });

  it('copes with a file the browser gave no type', () => {
    expect(acceptsFile({ name: 'notes.md', size: 1, type: '' }, '.md')).toBe(true);
    expect(acceptsFile({ name: 'notes.md', size: 1, type: '' }, 'text/*')).toBe(false);
  });
});

describe('rejectReason', () => {
  it('says why in a sentence, not in a code', () => {
    const reason = rejectReason({ name: 'big.bin', size: 4_200_000, type: '' }, { maxSize: 2_000_000 });
    // "E_SIZE" tells nobody what to do about it.
    expect(reason).toBe('Too large (4.2 MB of 2 MB)');
  });

  it('is null for a file that is fine', () => {
    expect(rejectReason({ name: 'a.png', size: 10, type: 'image/png' }, { accept: 'image/*' })).toBeNull();
  });
});

describe('formatBytes', () => {
  it('uses the units a file browser uses, so the two agree', () => {
    // Decimal: kB is 1000 bytes. A component that disagrees with the OS looks broken.
    expect(formatBytes(999)).toBe('999 B');
    expect(formatBytes(1000)).toBe('1 kB');
    expect(formatBytes(1_500_000)).toBe('1.5 MB');
  });

  it('drops the decimal once the number is big enough not to need it', () => {
    expect(formatBytes(128_000_000)).toBe('128 MB');
  });

  it('says nothing useful for a size that is not one', () => {
    expect(formatBytes(NaN)).toBe('—');
    expect(formatBytes(-1)).toBe('—');
  });
});

describe('toUploadFiles', () => {
  it('marks what cannot be accepted as it arrives, not on submit', () => {
    const rows = toUploadFiles([file('a.png', 10, 'image/png'), file('b.exe', 10, '')], { accept: 'image/*' });
    expect(rows[0]!.status).toBe('pending');
    expect(rows[1]!.status).toBe('error');
    expect(rows[1]!.error).toContain('Not an accepted type');
  });

  it('gives every row an id that survives a re-render', () => {
    const rows = toUploadFiles([file('a.png'), file('a.png')]);
    // Two files with the same name are still two rows.
    expect(rows[0]!.id).not.toBe(rows[1]!.id);
    expect(fileId({ name: 'a.png', size: 1000, type: '' })).toContain('a.png');
  });
});

describe('ChunkProgress', () => {
  const bar = () => screen.getByRole('progressbar');

  it('is one progress bar, not a row of them', () => {
    const { container } = render(<ChunkProgress value={0.62} chunks={8} aria-label="Pages" />);
    // A screen reader hears "62%" once rather than being read eight boxes.
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(bar().getAttribute('aria-valuenow')).toBe('0.62');
    expect(container.querySelectorAll('.grange-chunk-progress span span')).toHaveLength(8);
  });

  it('hides the segments, which only draw what the bar reports', () => {
    const { container } = render(<ChunkProgress value={0.5} aria-label="Pages" />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('fills whole chunks only, which is what makes it count rather than slide', () => {
    const { container } = render(<ChunkProgress value={0.5} chunks={4} aria-label="Pages" />);
    // Half of four is two whole chunks; the third stays dark rather than half-lit.
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(2);
  });

  it('part-fills when a caller says the chunks are only a texture', () => {
    const { container } = render(<ChunkProgress value={0.6} chunks={4} whole={false} aria-label="Pages" />);
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(2);
    // The third is partly lit rather than dark.
    expect(container.querySelectorAll('.grange-chunk-progress span span span')).toHaveLength(1);
  });

  it('is indeterminate with no value', () => {
    render(<ChunkProgress aria-label="Pages" />);
    expect(bar().getAttribute('aria-valuenow')).toBeNull();
  });

  it('pins a value outside the range', () => {
    const { container } = render(<ChunkProgress value={5} chunks={3} aria-label="Pages" />);
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(3);
  });

  it('takes its shape from the provider', () => {
    const { container } = render(
      <GrangeProvider defaultProps={{ ChunkProgress: { chunks: 3 } }}>
        <ChunkProgress value={1} aria-label="Pages" />
      </GrangeProvider>,
    );
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(3);
  });
});

describe('DropZone', () => {
  it('is a button, because dropping is not an interaction everybody has', async () => {
    const user = userEvent.setup();
    const { container } = render(<DropZone />);
    const zone = screen.getByRole('button', { name: /Drop files here/ });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clicked = vi.spyOn(input, 'click');
    await user.click(zone);
    // Pressing it opens the system dialog, which is the only route that works without a pointer.
    expect(clicked).toHaveBeenCalled();
  });

  it('passes accept and multiple to the real input', () => {
    const { container } = render(<DropZone accept=".png" multiple={false} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('.png');
    expect(input.multiple).toBe(false);
  });

  it('reports what was chosen', async () => {
    const user = userEvent.setup();
    const onFiles = vi.fn();
    const { container } = render(<DropZone onFiles={onFiles} />);

    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, [
      file('a.png', 10, 'image/png'),
    ]);
    expect(onFiles.mock.lastCall![0]).toHaveLength(1);
  });

  it('takes only the first file when it is not multiple', async () => {
    const user = userEvent.setup();
    const onFiles = vi.fn();
    const { container } = render(<DropZone onFiles={onFiles} multiple={false} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file('a.png'), file('b.png')]);
    expect(onFiles.mock.lastCall![0]).toHaveLength(1);
  });
});

describe('Upload', () => {
  const pick = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement, files: File[]) =>
    user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, files);

  it('lists what was chosen, with a readable size', async () => {
    const user = userEvent.setup();
    const { container } = render(<Upload />);

    await pick(user, container, [file('report.pdf', 1500, 'application/pdf')]);
    expect(screen.getByText('report.pdf')).not.toBeNull();
    expect(screen.getByText(/B$/)).not.toBeNull();
  });

  it('refuses a file as it arrives and says why', async () => {
    const user = userEvent.setup();
    /*
     * A size rule rather than a type one: the file input filters by `accept` itself, in the
     * browser and in testing-library, so a file of the wrong type never reaches the component
     * through the picker. It can still arrive by drop or by paste, which is why the component
     * checks the type too — that path is covered in toUploadFiles above.
     */
    const { container } = render(<Upload maxSize={100} />);

    await pick(user, container, [file('huge.bin', 4000, '')]);
    // Beside the row…
    expect(within(screen.getByRole('list')).getByText(/Too large/)).not.toBeNull();
    // …and said out loud once, for the whole batch rather than once per row.
    expect(screen.getByRole('status').textContent).toContain('not accepted');
  });

  it('hands the app only the files it can actually upload', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const { container } = render(<Upload accept="image/*" onAdd={onAdd} />);

    await pick(user, container, [file('a.png', 10, 'image/png'), file('b.txt', 10, 'text/plain')]);
    expect(onAdd.mock.lastCall![0]).toHaveLength(1);
    expect(onAdd.mock.lastCall![0][0].name).toBe('a.png');
  });

  it('removes a row and says so', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(<Upload onRemove={onRemove} />);

    await pick(user, container, [file('a.png', 10, 'image/png')]);
    await user.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(onRemove).toHaveBeenCalled();
    expect(screen.queryByText('a.png')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('a.png removed');
  });

  it('offers a retry only for a failure, and only when it can do something', () => {
    const failed: UploadFile[] = [{ id: '1', name: 'a.png', size: 10, status: 'error', error: 'Network' }];
    const { rerender } = render(<Upload files={failed} />);
    expect(screen.queryByRole('button', { name: /Retry/ })).toBeNull();

    rerender(<Upload files={failed} onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: 'Retry a.png' })).not.toBeNull();
  });

  it('draws a progress bar for a row that is uploading', () => {
    const rows: UploadFile[] = [{ id: '1', name: 'a.png', size: 10, status: 'uploading', progress: 0.4 }];
    render(<Upload files={rows} />);
    expect(screen.getByRole('progressbar', { name: 'Uploading a.png' }).getAttribute('aria-valuenow')).toBe('0.4');
  });

  it('replaces rather than appends when it is not multiple', async () => {
    const user = userEvent.setup();
    const { container } = render(<Upload multiple={false} />);

    await pick(user, container, [file('a.png', 10, 'image/png')]);
    await pick(user, container, [file('b.png', 10, 'image/png')]);
    expect(screen.queryByText('a.png')).toBeNull();
    expect(screen.getByText('b.png')).not.toBeNull();
  });

  it('works controlled', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [files, setFiles] = useState<UploadFile[]>([]);
      return (
        <>
          <Upload files={files} onFilesChange={setFiles} />
          <p>count: {files.length}</p>
        </>
      );
    }
    const { container } = render(<Controlled />);
    await pick(user, container, [file('a.png', 10, 'image/png')]);
    expect(screen.getByText('count: 1')).not.toBeNull();
  });

  it('can be told not to draw the list at all', async () => {
    const user = userEvent.setup();
    const { container } = render(<Upload showList={false} />);
    await pick(user, container, [file('a.png', 10, 'image/png')]);
    expect(screen.queryByText('a.png')).toBeNull();
  });
});
