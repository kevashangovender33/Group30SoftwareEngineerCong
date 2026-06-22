import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Component tests must not hit the network. Stub fetch with a healthy response
// so App's /api/health effect resolves deterministically.
vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'healthy' }),
    } as Response)
  )
);
