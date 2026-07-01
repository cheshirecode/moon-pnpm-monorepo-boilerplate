import cx from 'classnames';

import { borderPalette } from '@/styles/palette';

const borderTypes = {
  plain: {
    small: 'border-3',
    medium: 'border-5',
    large: 'border-10',
    _common: 'rounded-full both-modes:(border-r-transparent border-b-transparent)'
  },
  inset: {
    small: 'border-inset border-3',
    medium: 'border-inset border-5',
    large: ' border-inset border-10',
    _common: 'rounded-full'
  },
  moon: {
    small: 'border-t-3',
    medium: 'border-t-5',
    large: 'border-t-10',
    _common:
      'rounded-t-full border-0 both-modes:(border-r-transparent border-l-transparent border-b-transparent)'
  }
};

const sizes = {
  small: 'w-5 h-5',
  medium: 'w-10 h-10',
  large: 'w-20 h-20'
};

export type SpinnerProps = BaseProps & {
  type?: keyof typeof borderTypes;
  size?: keyof typeof sizes;
  palette?: keyof typeof borderPalette;
  screen?: boolean;
  screenClassName?: string;
  center?: boolean;
};

const Spinner = ({
  className,
  type = 'plain',
  size = 'medium',
  palette = 'primary',
  screen = false,
  screenClassName,
  center = true,
  ...props
}: SpinnerProps) => {
  const c = (
    <i
      className={cx(
        borderPalette[palette],
        sizes[size],
        borderTypes[type][size],
        borderTypes[type]._common,
        'transform-gpu animate-spin',
        'inline-block',
        center && 'self-center mx-auto',
        className
      )}
      {...props}
    />
  );
  return screen ? (
    <article className={cx('h-full w-full max-w-full flex', screenClassName)}>{c}</article>
  ) : (
    c
  );
};

export default Spinner;
