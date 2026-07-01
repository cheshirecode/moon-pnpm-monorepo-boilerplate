import cx from 'classnames';

export type TagsProps = BaseProps & {
  items: string[];
  middleSpan?: number;
  itemClassName?: string;
};

const Board = ({ items, middleSpan = 1, className, itemClassName }: TagsProps) => (
  <p
    className={cx(
      'grid',
      // https://github.com/unocss/unocss/issues/1478#issuecomment-1229132066
      middleSpan === 2 && 'grid-cols-[auto_1fr_1fr_auto]',
      middleSpan === 3 && 'grid-cols-[auto_1fr_1fr_1fr_auto]',
      ![2, 3].includes(middleSpan) && 'grid-cols-[auto_1fr_auto]',
      className
    )}
  >
    {items.map((x, i) => (
      <span
        key={i}
        className={cx(
          'inline-block px-2 text-center',
          !x && 'bg-transparent text-transparent',
          x && itemClassName
        )}
      >
        {x}
      </span>
    ))}
  </p>
);

export default Board;
