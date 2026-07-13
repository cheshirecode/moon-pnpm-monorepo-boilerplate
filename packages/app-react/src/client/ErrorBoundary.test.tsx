import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Component } from 'react';

import ErrorBoundary from './ErrorBoundary';

const ThrowingComponent = (): never => {
  throw new Error('secret internal message with stack trace');
};

describe('ErrorBoundary', () => {
  it('renders a fixed generic message with no interpolated error content', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const text = container.textContent ?? '';
    expect(text).toBe('Something went wrong.');
    expect(text).not.toContain('secret internal message');
    expect(text).not.toContain('stack trace');
    expect(text).not.toContain('Error:');
  });
});