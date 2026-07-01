import { createRendererDemoContract, formatRendererDemo } from '@cheshirecode/demo-contract';
import { copyToClipboard } from '@fieryeagle/browser-clipboard';
import { memo } from 'preact/compat';

const contract = createRendererDemoContract('Preact');

const CompatBadge = memo(() => <span data-testid="compat">preact-compat</span>);

export function App() {
  return (
    <main>
      <h1>{contract.title}</h1>
      <p>{formatRendererDemo(contract)}</p>
      <p>{contract.url}</p>
      <CompatBadge />
      <button type="button" onClick={() => copyToClipboard(contract.slug)}>
        copy
      </button>
    </main>
  );
}
