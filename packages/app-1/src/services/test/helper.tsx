// @ts-nocheck
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { Fragment } from 'react';
import { SWRConfig } from 'swr';
import { afterEach } from 'vitest';

import ErrorBoundary from '@/components/ErrorBoundary';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {
      // do nothing
    }
    unobserve() {
      // do nothing
    }
    disconnect() {
      // do nothing
    }
  };
});

afterEach(() => {
  cleanup();
});

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, {
    // wrap provider(s) here if needed
    wrapper: ({ children }) => children,
    ...options
  });

// override render export
export { customRender as render };

export const NoCacheWrapper = ({ children }: BaseProps) => (
  <ErrorBoundary>
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>{children}</SWRConfig>
  </ErrorBoundary>
);

export const PostRequestHelper = ({ data, error, trigger, payload, emptyPayload }) => (
  <Fragment>
    <button
      onClick={() => {
        trigger(payload);
      }}
    >
      works
    </button>
    <button
      onClick={() => {
        trigger(emptyPayload);
      }}
    >
      fails
    </button>
    <span title="data">{data}</span>
    <span title="error">{error}</span>
  </Fragment>
);

export const assertPostRequest = async (Helper: React.ReactElement) => {
  const res = await render(<Helper />);
  const workingBtn = await res.findByText('works');
  act(() => workingBtn.click());
  const dataNode = await res.findByTitle('data');
  await waitFor(() => {
    expect(Number(dataNode?.innerHTML)).toBeGreaterThan(0);
  });
  const failingBtn = await res.findByText('fails');
  act(() => failingBtn.click());
  const errorNode = await res.findByTitle('error');
  await waitFor(() => {
    expect(Number(errorNode?.innerHTML)).toBe(0);
  });
};
