import ErrorBoundary from '@/components/ErrorBoundary';
import Spinner from '@/components/Spinner';

const App: BaseFC = () => (
  <ErrorBoundary>
    <Spinner />
    <h1>@moon-pnpm-monorepo-boilerplate/app-1</h1>
  </ErrorBoundary>
);

export default App;
