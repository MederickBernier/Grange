import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChunkProgress, DropZone, Stack, Upload, type UploadFile } from '../src';

/**
 * Uploading, and progress counted in steps.
 *
 * **The network stays the app's.** `Upload` never uploads anything: it collects files, reports
 * them through `onAdd`, and draws whatever status the app hands back. Every library that owns
 * the request ends up with a prop for headers, one for the field name, one for chunking, one
 * for retries — and still cannot do what the app needed.
 *
 * **Dropping is not an interaction everybody has**, so the zone is a real button: press it, or
 * focus it and press Enter, and the system file dialog opens. `useClipboard` adds a third
 * route — focus the zone and paste. All three end in one `onFiles`.
 *
 * A file that cannot be accepted is refused **as it arrives**, with a sentence rather than a
 * code: telling someone a file is too large after they have waited for it to upload is the
 * worst possible moment to say so.
 */
const meta: Meta = {
  title: 'Components/Upload and Chunked Progress',
  parameters: { layout: 'padded' },
};
export default meta;

/** The zone on its own. */
export const Zone: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <DropZone />
    </div>
  ),
};

/** With a list, and a size limit that refuses as it goes. */
export const WithList: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Upload
        accept="image/*,.pdf"
        maxSize={2_000_000}
        defaultFiles={[
          { id: '1', name: 'brief.pdf', size: 184_320, status: 'done' },
          { id: '2', name: 'photo.jpg', size: 1_204_000, status: 'uploading', progress: 0.42 },
          {
            id: '3',
            name: 'scan.tiff',
            size: 4_200_000,
            status: 'error',
            error: 'Too large (4.2 MB of 2 MB)',
          },
        ]}
        onRetry={() => {}}
      />
    </div>
  ),
};

/** What an app wires it to: a fake upload that reports its own progress back. */
export const Live: StoryObj = {
  render: function Render() {
    const [files, setFiles] = useState<UploadFile[]>([]);

    const fakeUpload = (added: UploadFile[]) => {
      for (const row of added) {
        let progress = 0;
        const tick = setInterval(() => {
          progress += 0.2;
          setFiles((current) =>
            current.map((candidate) =>
              candidate.id === row.id
                ? {
                    ...candidate,
                    status: progress >= 1 ? 'done' : 'uploading',
                    progress: Math.min(progress, 1),
                  }
                : candidate,
            ),
          );
          if (progress >= 1) clearInterval(tick);
        }, 400);
      }
    };

    return (
      <Stack gap="md" style={{ maxWidth: 480 }}>
        <Upload
          files={files}
          onFilesChange={setFiles}
          onAdd={fakeUpload}
          onRetry={(row) => fakeUpload([row])}
        />
        <span className="sb-label">
          The component collected the files; this story is the part an app would write.
        </span>
      </Stack>
    );
  },
};

/**
 * Progress in whole steps. It is **one** progress bar underneath, not a row of them: a screen
 * reader hears "three of five", once, rather than being read five boxes.
 */
export const Chunked: StoryObj = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: 360 }}>
      <Stack gap="xs">
        <span className="sb-label">Three of five files</span>
        <ChunkProgress value={0.6} chunks={5} aria-label="Files uploaded" />
      </Stack>

      <Stack gap="xs">
        <span className="sb-label">Ten segments, counting whole steps</span>
        <ChunkProgress value={0.72} chunks={10} aria-label="Pages processed" />
      </Stack>

      <Stack gap="xs">
        <span className="sb-label">Part-filled, for chunks that are only a texture</span>
        <ChunkProgress value={0.72} chunks={10} whole={false} aria-label="Pages processed" />
      </Stack>
    </Stack>
  ),
};
