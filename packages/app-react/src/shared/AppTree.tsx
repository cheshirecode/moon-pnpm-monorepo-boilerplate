import ErrorBoundary from '../client/ErrorBoundary';
import Spinner from '../components/Spinner';

export function AppTree() {
  return (
    <ErrorBoundary>
      <Spinner />
      <h1>@moon-pnpm-monorepo-boilerplate/app-react</h1>
    </ErrorBoundary>
  );
}

export default AppTree;
