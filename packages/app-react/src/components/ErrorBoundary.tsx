import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { Component } from 'react';

// nearly impossible to reliably test unless throwing errors explicitly inside component tree
/* c8 ignore next 50 */
export default class ErrorBoundary extends Component<
  PropsWithChildren<unknown>,
  { error: Error; errorInfo: ErrorInfo }
> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props);
    // @ts-expect-error initially must be null
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch: (error: Error, errorInfo: ErrorInfo) => void = (error, errorInfo) => {
    this.setState({
      error,
      errorInfo
    });
  };

  render: () => ReactNode = () => {
    if (this.state.errorInfo) {
      return import.meta.env.DEV ? (
        <details className="pre-wrap color-error">
          {this.state.error && this.state.error.toString()}
          <br />
          {this.state.errorInfo.componentStack}
        </details>
      ) : (
        <em className="color-error">{this.state.error.toString()}</em>
      );
    }
    // Normally, just render children
    return this.props.children;
  };
}
