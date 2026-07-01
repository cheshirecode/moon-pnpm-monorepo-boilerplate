import cx from 'classnames';
import type { FC, MouseEvent } from 'react';

const Confirm: FC<BaseProps & { onClick?: (e: MouseEvent<SVGElement>) => void }> = ({
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={cx(
      'inline-block fill-gray-300 h-6 w-6 cursor-pointer @hover:animate-pulse',
      className
    )}
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm-1-6 7.07-7.07-1.41-1.41L11 13.17l-2.83-2.83-1.41 1.42L11 16z" />
  </svg>
);
export default Confirm;
