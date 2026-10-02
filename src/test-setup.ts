import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Render tests mount into one shared document, so unmount between cases.
afterEach(cleanup);
