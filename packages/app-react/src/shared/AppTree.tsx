import { createRendererDemoContract } from '@cheshirecode/demo-contract';
import ErrorBoundary from '../client/ErrorBoundary';
import Spinner from '../components/Spinner';

const contract = createRendererDemoContract('React');

export function AppTree() {
  return (
    <ErrorBoundary>
      <Spinner />
      <a href="/" className="back-link">← Back to showcase</a>
      <h1>{contract.title}</h1>
    </ErrorBoundary>
  );
}

export default AppTree;
