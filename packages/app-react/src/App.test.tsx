import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import App from './App';

it('renders the app heading', async () => {
  const { getByText } = render(<App />);
  expect(getByText('@moon-pnpm-monorepo-boilerplate/app-react')).toBeTruthy();
});
