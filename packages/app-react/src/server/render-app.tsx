import { renderToString } from 'react-dom/server';

import AppTree from '../shared/AppTree';

export function renderAppTree(): string {
  return renderToString(<AppTree />);
}
