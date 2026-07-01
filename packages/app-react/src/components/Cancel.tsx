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
    <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-11.41L9.17 7.76 7.76 9.17 10.59 12l-2.83 2.83 1.41 1.41L12 13.41l2.83 2.83 1.41-1.41L13.41 12l2.83-2.83-1.41-1.41L12 10.59z" />
  </svg>
);
export default Confirm;
