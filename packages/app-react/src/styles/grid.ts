import type { UserConfig } from 'unocss';

import { breakpoints } from './tokens';

const convertUnitsToRem = (n: string) => (~~n == Number(n) ? `${~~n / 4}rem` : n);
const minMax = (x: string, y: string) => `minmax( min(${x},${y}), max(${x},${y}) )`;

export const rules: UserConfig['rules'] = [
  /* 
grid-cols-auto-(40) -> 
  grid-template-columns: repeat(auto-fill,minmax(40rem,1fr));
  grid-auto-flow: column;
  grid-auto-columns: minmax(40rem,1fr); 
*/
  [
    /^grid-cols-fill-(\d+)$/,
    (match) => ({
      'grid-template-columns': `repeat(auto-fill,minmax(${convertUnitsToRem(match[1])},1fr))`,
      'grid-auto-flow': 'column',
      'grid-auto-columns': `minmax(${convertUnitsToRem(match[1])},1fr)`
    })
  ],
  [
    /^grid-cols-max-(\d+)-(\d+)$/,
    (match) => ({
      'grid-template-columns': `repeat(auto-fill,min(${
        ~~match[1] / 4
      }rem, calc(100%/${~~match[2]}) ))`,
      'grid-auto-flow': 'row',
      'grid-auto-columns': `min(${convertUnitsToRem(match[1])}, calc(100%/${~~match[2]}) )`
    })
  ],
  [
    /^grid-cols-min-(\d+)-(\d+)$/,
    (match) => ({
      'grid-template-columns': `repeat(auto-fill,max(${
        ~~match[1] / 4
      }rem, calc(100%/${~~match[2]}) ))`,
      'grid-auto-flow': 'col',
      'grid-auto-columns': `max(${convertUnitsToRem(match[1])}, calc(100%/${~~match[2]}) )`
    })
  ],
  [
    /^grid-cols-fluid-(\d+)-(\d+)$/,
    (match) => ({
      'grid-template-columns': `repeat(auto-fill,${minMax(
        convertUnitsToRem(match[1]),
        `calc(100%/${~~match[2]})`
      )})`,
      'grid-auto-flow': 'row',
      'grid-auto-columns': minMax(convertUnitsToRem(match[1]), `calc(100%/${~~match[2]})`)
    })
  ]
];

export const shortcutArr: UserConfig['shortcuts'] = [
  [/^border-(.*)-primary$/, ([, c]) => `border-${c}-gray-300 dark:(border-${c}-gray-600)`],
  /* 
    responsive-grid-max-10 -> 
      grid-cols-max-10-1
      xs:grid-cols-max-10-2
      sm:grid-cols-max-10-3
      md:grid-cols-max-10-3
      ...
  */
  [
    /^responsive-grid-max-(\d+)$/,
    (match) =>
      [`grid grid-cols-max-${match[1]}-1`]
        .concat(Object.keys(breakpoints).map((x, i) => `${x}:grid-cols-max-${match[1]}-${i + 2}`))
        .join(' ')
  ],
  [
    /^responsive-grid-min-(\d+)$/,
    (match) =>
      [`grid grid-cols-min-${match[1]}-1`]
        .concat(Object.keys(breakpoints).map((x, i) => `${x}:grid-cols-min-${match[1]}-${i + 2}`))
        .join(' ')
  ],
  [
    /^responsive-grid-fluid-(\d+)$/,
    (match) =>
      [`grid grid-cols-fluid-${match[1]}-1`]
        .concat(Object.keys(breakpoints).map((x, i) => `${x}:grid-cols-fluid-${match[1]}-${i + 2}`))
        .join(' ')
  ]
];

export const shortcutObj: UserConfig['shortcuts'] = {
  'responsive-grid': Object.keys(breakpoints)
    .map((x, i) => `${x}:grid-cols-${i + 2}`)
    .concat('grid', 'grid-cols-1')
    .join(' '),
  'responsive-grid-kv': Object.keys(breakpoints)
    .map((x, i) => `${x}:grid-cols-${(i + 1) * 2}`)
    .concat('grid')
    .join(' ')
};
