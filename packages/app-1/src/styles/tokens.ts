// @ts-ignore
import { splitAlphanumeric } from '../utils';
import { colors as baseUnoCssColors } from './colors';

export const matchColorToCode = (c: string): string => {
  const splits = splitAlphanumeric(c) as string[];
  if (!splits) {
    // eslint-disable-next-line no-console
    console.error('matchColorToCode expects non-empty string but received ', c);
    return '';
  }
  if (!baseUnoCssColors) {
    return '';
  }
  const color: keyof typeof baseUnoCssColors = splits[0]; // first word is color
  const shade = splits.slice(1).join(''); // treat the remainer as shade
  const palette = baseUnoCssColors[color];
  let res = '';
  if (typeof palette === 'string') {
    res = palette ?? res;
  } else {
    res = (palette && (palette[String(shade)] as string)) ?? res;
  }
  return res;
};

export const colors = baseUnoCssColors;

export const sources = {};

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  medium: '800px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1440px',
  xxxl: '1920px',
  '4xl': '2560px'
};

export const lineHeight = {
  h1: '4.3125rem',
  h2: '3.5rem',
  h3: '3.875rem',
  h4: '2.3125rem',
  h5: '2rem',
  h6: '1.6875rem',
  default: '1rem',
  small: '0.75rem'
};

export const maxViewport = (Object.keys(breakpoints) as Array<keyof typeof breakpoints>).reduce(
  (prev, x) => Math.max(prev, ~~breakpoints[x].replace('px', '')),
  0
);

export const MAX_SPACING_UNIT = 20; // up to {n}rem, for em do m-[2em]
export const extraSizes = Array(MAX_SPACING_UNIT)
  .fill(0)
  .reduce(
    (prev, x, i) => ({
      ...prev,
      [i + 1]: `${(i + 1) * 0.25}rem`
    }),
    {
      baseline: '0.5rem'
    }
  );
export const MAX_GRID_SIZE = 12;
export const extraGridTemplates = Array(MAX_GRID_SIZE)
  .fill(0)
  .reduce(
    (prev, x, i) => ({
      ...prev,
      [i]: `repeat(${i}, minmax(0, 1fr))`
    }),
    {}
  );

export const safelist = Object.keys(breakpoints)
  .concat('')
  .flatMap((x) =>
    ['grid-cols', 'grid-rows', 'col-span']
      .flatMap((x) => Object.keys(extraGridTemplates).map((y) => `${x}-${y}`))
      .map((y) => `${x ? `${x}:` : ''}${y}`)
  );
