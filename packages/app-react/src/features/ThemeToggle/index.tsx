import cx from 'classnames';

import type { ThemeToggleProps } from './typings';
import useThemeToggle from './useThemeToggle';

const ThemeToggle = ({ className, isApply = true, onChange, ...props }: ThemeToggleProps) => {
  const { isDarkMode, onClick } = useThemeToggle({
    isApply,
    onChange
  });
  return (
    // wrapper of label to allow different values for 'position'
    <fieldset className={cx('border-0 p-0 m-0', className)} {...props}>
      {/* label needs relative position so that the pseudo-toggle can be absolutely positioned */}
      <label htmlFor="--ThemeToggle" className="relative cursor-pointer">
        <span className={cx('block w-10 h-6', 'rounded-full shadow-inner', 'bg-contrast')}></span>
        <span
          className={cx(
            'absolute block w-4 h-4 mt-1 ml-1',
            'bg-primary',
            'rounded-full shadow inset-y-0',
            'focus-within-shadow-inset',
            'transition-all-200',
            isDarkMode && 'translate-x-full'
          )}
        >
          <input
            id="--ThemeToggle"
            type="checkbox"
            className="absolute opacity-0 w-0 h-0"
            onClick={onClick}
          />
        </span>
      </label>
    </fieldset>
  );
};

export default ThemeToggle;
