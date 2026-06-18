import type { UserConfig } from 'unocss';
import { defineConfig, presetAttributify, presetUno, transformerVariantGroup } from 'unocss';

import {
  rules as gridRules,
  shortcutArr as gridShortcutArr,
  shortcutObj as gridShortcutObj
} from './src/styles/grid';
import {
  breakpoints,
  colors,
  extraGridTemplates,
  extraSizes,
  lineHeight,
  safelist
} from './src/styles/tokens';

const config: UserConfig = defineConfig({
  // include: [/\.(vue|svelte|[jt]s[|x]|mdx?|astro|elm|php|phtml|html)($|\?)/],
  darkMode: 'class',
  safelist,
  theme: {
    screens: breakpoints,
    breakpoints,
    colors,
    fontSize: {
      // based on https://grtcalculator.com/
      h1: ['2.625rem', lineHeight.h1],
      h2: ['2.0625rem', lineHeight.h2],
      h3: ['1.625rem', lineHeight.h3],
      h4: ['1.125rem', lineHeight.h4],
      h5: ['1rem', lineHeight.h5],
      h6: ['0.8125rem', lineHeight.h6],
      small: ['0.75rem', lineHeight.h6],
      default: '1rem'
    },
    lineHeight,
    maxWidth: {
      custom: 'clamp(900px, 80%, 1440px)',
      ...extraSizes
    },
    maxHeight: {
      ...extraSizes
    },
    minWidth: {
      ...extraSizes
    },
    minHeight: {
      ...extraSizes
    },
    height: {
      ...extraSizes
    },
    width: {
      ...extraSizes
    },
    gridTemplateRows: {
      main: '1fr auto auto auto',
      ...extraGridTemplates
    },
    gridTemplateColumns: {
      main: '1fr auto auto auto',
      ...extraGridTemplates
    },
    listStyleType: {
      none: 'none',
      disc: 'disc',
      decimal: 'decimal',
      square: 'square',
      roman: 'upper-roman'
    }
    // https://github.com/unocss/unocss/blob/main/packages/preset-wind/src/theme.ts
  },
  presets: [
    presetUno(),
    presetAttributify({
      prefix: 'uno-',
      prefixedOnly: true
    })
  ],
  transformers: [transformerVariantGroup()],
  layers: {
    preflights: -1,
    components: 0,
    default: 1,
    utilities: 2,
    rules: 3,
    shortcuts: 4,
    // custom variant - uno-layer-o:{class} to override the other layers
    l: 5,
    o: 6
  },
  variants: [
    // another more powerful override over 3rd party CSS classes
    (matcher) =>
      !matcher.startsWith('override:')
        ? matcher
        : {
            matcher: matcher.slice('override:'.length),
            selector: (s) => `html ${s}`
          }
  ],
  rules: [...(gridRules ?? [])],
  shortcuts: [
    ...(gridShortcutArr as []),
    {
      ...gridShortcutObj,
      // @ts-ignore
      btn: 'border-0 py-2 px-4 font-semibold rounded-md cursor-pointer',
      'btn--rounded-none': 'border-0 py-2 px-4 font-light cursor-pointer',
      'btn-compact': 'py-1 px-1',
      'btn-icon': 'cursor-pointer color-inherit bg-inherit border-0 p-0 m-0',
      anchor:
        'text-blue-600 dark:text-blue-500 no-underline @hover:(underline text-blue-80 dark:text-blue-30)',
      disabled: 'focus:outline-none cursor-auto pointer-events-none',
      tag: 'border rounded-full text-center',
      'tag--hover': '@hover:(cursor-pointer) border-transparent',
      //https://github.com/unocss/unocss/tree/main/packages/preset-wind#sm-lg-variants
      'responsive-page': 'max-w-custom mx-auto',
      'px-res': 'px-4 xxl:px-1/10 4xl:px-1/5',
      'w-res': 'w-4 xxl:w-[10vw] 4xl:w-[20vw]',
      'mx-res': 'mx-4 xxl:mx-1/10 4xl:mx-1/5',
      'mx--res': 'mx--4 xl:mx--1/5 xxl:mx--1/10 4xl:mx--1/5',
      'responsive-content-layout': [
        'flex',
        'lt-xs:justify-start',
        'lt-md:justify-center',
        'justify-start'
      ].join(' '),
      'fill-width': 'w-auto ml-[-9999px] pl-[9999px] mr-[-9999px] pr-[9999px]',
      // color
      'color-cta': 'text-white dark:text-gray-100',
      'color-cta-hover': 'text-gray-200 dark:text-white',
      'color-primary': 'text-gray-900 dark:text-gray-100',
      'color-primary-hover': 'text-dark-900 dark:text-white',
      'color-secondary': 'text-gray-700 dark:text-gray-400',
      'color-secondary-hover': 'text-gray-900 dark:text-gray-200',
      'color-tertiary': 'text-gray-400 dark:text-gray-600',
      'color-tertiary-hover': 'uno-layer-h:(text-gray-600 dark:text-gray-400)',
      'color-link': 'text-blue-600 dark:text-blue-500',
      'color-link-hover': 'text-blue-800 dark:text-blue-300',
      'color-destructive': 'text-red-600 dark:text-gray-500',
      'color-reversed': 'text-white dark:text-dark-900',
      'color-error': 'text-white dark:text-dark-900',
      'color-error-hover': 'text-gray-200 dark:text-gray-900',
      'color-warning': 'text-dark-900 dark:text-dark-900',
      'color-warning-hover': 'text-[#19222a] dark:text-gray-900',
      'color-information': 'text-white dark:text-dark-900',
      'color-information-hover': 'text-gray-200 dark:text-gray-900',
      'color-success': 'text-white dark:text-dark-900',
      'color-success-hover': 'text-gray-200 dark:text-gray-900',
      // bg
      'bg-cta': 'bg-blue-600 dark:bg-blue-500',
      'bg-cta-hover': 'bg-blue-800 dark:bg-blue-300',
      'bg-primary': 'bg-white dark:bg-dark-900',
      'bg-primary-hover': 'bg-gray-200 dark:bg-gray-900',
      'bg-secondary': 'bg-gray-100 dark:(bg-gray-100)',
      'bg-secondary-hover': 'bg-gray-300 dark:bg-gray-800',
      'bg-tertiary': 'bg-gray-200 dark:(bg-gray-900)',
      'bg-tertiary-hover': 'bg-gray-400 dark:bg-gray-700',
      'bg-moderate': 'bg-gray-300 dark:(bg-gray-800)',
      'bg-moderate-hover': 'bg-gray-500 dark:bg-gray-600',
      'bg-bold': 'bg-gray-400 dark:(bg-gray-600)',
      'bg-bold-hover': 'bg-gray-600 dark:bg-gray-400',
      'bg-strong': 'bg-gray-600 dark:(bg-gray-400)',
      'bg-strong-hover': 'bg-gray-700 dark:bg-gray-200',
      'bg-contrast': 'bg-dark-900 dark:(bg-white)',
      'bg-contrast-hover': 'bg-gray-900 dark:bg-gray-200',
      'bg-none': 'bg-transparent',
      'bg-toggle': 'bg-gray-400 dark:(bg-green-400)',
      'bg-error': 'bg-red-600 dark:(bg-red-500)',
      'bg-error-hover': 'bg-[#c51d10] dark:(bg-[#fa6759])',
      'bg-warning': 'bg-yellow-300 dark:(bg-yellow-300)',
      'bg-warning-hover': 'bg-[#e7b816] dark:(bg-[#f6ce3c])',
      'bg-information': 'bg-blue-500 dark:(bg-blue-600)',
      'bg-information-hover': 'bg-[#5399f5] dark:(bg-[#1660c9])',
      'bg-success': 'bg-green-600 dark:(bg-green-500)',
      'bg-success-hover': 'bg-[#07714e] dark:(bg-[#2cac70])',
      // border
      'border-cta': 'border-gray-200 dark:(border-gray-800)',
      'border-cta-blend': 'border-blue-600 dark:(border-blue-500)',
      'border-cta-hover': 'border-blue-800 dark:(border-blue-300)',
      'border-primary': 'border-gray-200 dark:(border-gray-800)',
      'border-primary-hover': 'border-gray-300 dark:(border-gray-700)',
      'border-secondary': 'border-gray-200 dark:(border-gray-800)',
      'border-secondary-hover': 'border-gray-300 dark:(border-gray-700)',
      'border-tertiary': 'border-gray-300 dark:(border-gray-700)',
      'border-tertiary-hover': 'border-gray-400 dark:(border-gray-600)',
      'border-warningAlt': 'border-orange-50 dark:(border-yellow-300)',
      'border-warning': 'border-yellow-300 dark:(border-yellow-300)',
      'border-warning-hover': 'border-[#e7b816] dark:(border-[#f6ce3c])',
      'border-error': 'border-red-600 dark:(border-red-500)',
      'border-error-hover': 'border-[#c51d10] dark:(border-[#fa6759])',
      'border-information': 'border-blue-500 dark:(border-blue-600)',
      'border-information-hover': 'border-[#5399f5] dark:(border-[#1660c9])',
      'border-success': 'border-green-600 dark:(border-green-500)',
      'border-success-hover': 'border-[#07714e] dark:(border-[#2cac70])'
    },
    [
      // @ts-ignore
      /^btn-(.*)$/,
      // @ts-ignore
      ([, c]) =>
        `btn bg-${c} @hover:(bg-${c}-hover color-${c}-hover) color-${c} border-1 border-${c}`
    ],
    // @ts-ignore
    [/^card-(.*)$/, ([, c]) => `bg-${c} color-${c} border-${c}`],
    // @ts-ignore
    [/^card-(\w*)-hover$/, ([, c]) => `bg-${c}-hover color-${c}-hover border-${c}-hover`],
    // @ts-ignore
    [/^cell-(.*)$/, ([, c]) => `bg-${c} color-${c} border-1 border-${c}`],
    // @ts-ignore
    [/^both-modes:(.*)$/, ([, c]) => `${c} dark:(${c})`]
  ]
});

export default config;
