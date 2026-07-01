import type { Preview } from '@storybook/react-vite';

import '../src/styles/index.css';
import '../src/styles/reset.css';
import 'virtual:uno.css';

import { applyTheme } from '../src/features/ThemeToggle/utils';

applyTheme();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
