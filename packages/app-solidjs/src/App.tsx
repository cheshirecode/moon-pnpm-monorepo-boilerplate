import { createRendererDemoContract, formatRendererDemo } from '@cheshirecode/demo-contract';
import type { Component } from 'solid-js';

const contract = createRendererDemoContract('SolidJS');

export const App: Component = () => (
  <main>
    <h1>{contract.title}</h1>
    <p>{formatRendererDemo(contract)}</p>
    <p>{contract.url}</p>
  </main>
);
