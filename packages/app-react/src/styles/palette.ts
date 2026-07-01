// @unocss-include
export const PALETTE = [
  'cta',
  'primary',
  'secondary',
  'tertiary',
  'error',
  'success',
  'information',
  'warning'
] as const;

export const colorPalette: Record<typeof PALETTE[number], string> = {
  cta: 'color-cta',
  primary: 'color-primary',
  secondary: 'color-secondary',
  tertiary: 'color-tertiary',
  error: 'color-error',
  success: 'color-success',
  information: 'color-information',
  warning: 'color-warning'
};
export const colorHoveredPalette: Record<typeof PALETTE[number], string> = {
  cta: 'color-cta-hover',
  primary: 'color-primary-hover',
  secondary: 'color-secondary-hover',
  tertiary: 'color-tertiary-hover',
  error: 'color-error-hover',
  success: 'color-success-hover',
  information: 'color-information-hover',
  warning: 'color-warning-hover'
};
export const bgPalette: Record<typeof PALETTE[number], string> = {
  cta: 'bg-cta',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  error: 'bg-error',
  success: 'bg-success',
  information: 'bg-information',
  warning: 'bg-warning'
};
export const bgHoveredPalette: Record<typeof PALETTE[number], string> = {
  cta: 'bg-cta-hover',
  primary: 'bg-primary-hover',
  secondary: 'bg-secondary-hover',
  tertiary: 'bg-tertiary-hover',
  error: 'bg-error-hover',
  success: 'bg-success-hover',
  information: 'bg-information-hover',
  warning: 'bg-warning-hover'
};
export const borderPalette: Record<typeof PALETTE[number], string> = {
  cta: 'border-cta',
  primary: 'border-primary',
  secondary: 'border-secondary',
  tertiary: 'border-tertiary',
  error: 'border-error',
  success: 'border-success',
  information: 'border-information',
  warning: 'border-warning'
};
export const buttonPalette: Record<typeof PALETTE[number], string> = {
  cta: 'btn-cta',
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  tertiary: 'btn-tertiary',
  error: 'btn-error',
  success: 'btn-success',
  information: 'btn-information',
  warning: 'btn-warning'
};
export const cardPalette: Record<typeof PALETTE[number], string> = {
  cta: 'card-cta',
  primary: 'card-primary',
  secondary: 'card-secondary',
  tertiary: 'card-tertiary',
  error: 'card-error',
  success: 'card-success',
  information: 'card-information',
  warning: 'card-warning'
};

export const cardHoveredPalette: Record<typeof PALETTE[number], string> = {
  cta: 'card-cta-hover',
  primary: 'card-primary-hover',
  secondary: 'card-secondary-hover',
  tertiary: 'card-tertiary-hover',
  error: 'card-error-hover',
  success: 'card-success-hover',
  information: 'card-information-hover',
  warning: 'card-warning-hover'
};

export const cardHoverClassnames: Record<typeof PALETTE[number], string> = {
  cta: '@hover:(card-cta-hover)',
  primary: '@hover:(card-primary-hover)',
  secondary: '@hover:(card-secondary-hover)',
  tertiary: '@hover:(card-tertiary-hover)',
  error: '@hover:(card-error-hover)',
  success: '@hover:(card-success-hover)',
  information: '@hover:(card-information-hover)',
  warning: '@hover:(card-warning-hover)'
};
