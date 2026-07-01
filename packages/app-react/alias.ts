import { resolve } from 'path';

const alias: Record<string, string> = {
  '~': resolve(__dirname, './'),
  '@': resolve(__dirname, './src'),
  lodash: 'lodash-es'
};

export default alias;
