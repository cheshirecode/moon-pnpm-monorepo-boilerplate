import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { Component } from 'react';

const GENERIC_ERROR_MESSAGE = 'Something went wrong.';

export default class ErrorBoundary extends Component<
  PropsWithChildren<unknown>,
  { hasError: boolean }
> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Server-side logs may record the original error; tests must not depend on log text.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <em>{GENERIC_ERROR_MESSAGE}</em>;
    }
    return this.props.children;
  }
}