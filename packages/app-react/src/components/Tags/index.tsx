import cx from 'classnames';
import { isFunction } from 'lodash-es';
import type { ReactNode } from 'react';

export type TagsProps = BaseProps & {
  items: (ReactNode | ((p: TagsProps) => ReactNode))[];
  itemClassName?: string;
};

const Tags = (props: TagsProps) => {
  const { items, className, itemClassName, ...rest } = props;
  return (
    <ul className={cx('flex flex-wrap gap-2', 'w-full', 'p-0 m-0', className)} {...rest}>
      {items?.map((c, i) => (
        <li
          key={i}
          className={cx('w-fit inline-block', 'py-1 px-2', 'border rounded-full', itemClassName)}
        >
          {isFunction(c) ? c(props) : c}
        </li>
      ))}
    </ul>
  );
};

export default Tags;
