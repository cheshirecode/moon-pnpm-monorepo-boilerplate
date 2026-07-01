// import { css } from '@emotion/react';
import cx from 'classnames';
import { isFunction } from 'lodash-es';
import { ReactNode } from 'react';

import { SectionsProps } from './typings';
import useSections from './useSections';

const Sections = (props: SectionsProps) => {
  const {
    ref,
    preRef,
    preRefWide,
    contentRef,
    bottomPaddingRef,
    checkOnScroll,
    currentIndex,
    setCurrentIndex
  } = useSections(props);
  const {
    // props for hook
    activeIndex: _a,
    inferQueryParams: _i1,
    cbScrollTop: _c,
    // contentOffset = 0,
    scrollTopOnIndexChange: _s,
    // props for rendering
    stickyNav,
    inferHash,
    items = [],
    className,
    navClassName,
    contentClassName,
    itemFitContent = false,
    Pre,
    preContentClassName,
    flexContent,
    contentPadding = 'compact',
    ...rest
  } = props;
  return (
    <section
      className={cx(
        'w-full max-h-full',
        'lt-xxl:(flex flex-wrap)',
        flexContent && 'flex-col',
        'xxl:(grid-three-cols-content h-full)',
        'overflow-auto',
        className
      )}
      ref={ref}
      onScroll={checkOnScroll}
      {...rest}
    >
      {Pre ? (
        <section
          className={cx(
            'w-full',
            'z-1',
            'lt-xxl:(order-1)',
            'xxl:(hidden)',
            contentPadding === 'compact' && 'lt-xxl:(p-2) xxl:(mb-2)',
            contentPadding === 'normal' && 'lt-xxl:(p-4) xxl:(mb-4)',
            preContentClassName
          )}
          ref={preRef}
        >
          {Pre}
        </section>
      ) : null}
      <nav
        className={cx(
          'm-0 p-0 overflow-auto',
          'flex',
          'lt-xxl:(w-full)',
          'lt-xxl:(order-2)',
          'lt-md:(flex-wrap flex-col children:(max-w-full))',
          !itemFitContent && 'lt-xxl:(children:(max-w-60))',
          itemFitContent && 'lt-xxl:(children:(min-w-fit))',
          itemFitContent && 'xxl:(min-w-fit)',
          stickyNav && 'md:(sticky top-0)',
          // 'card-secondary xxl:shadow-lg',
          'lt-xxl:uno-layer-o:(border-b-1)',
          'xxl:uno-layer-o:(border-r-1)',
          // grid-only, delete rest if working
          'xxl:(grid-area-nav w-res flex-col)',
          'z-3',
          navClassName
        )}
      >
        {items.map(({ name, id, onClick, className: cl }, i) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              isFunction(onClick) && onClick(e);
              inferHash && setCurrentIndex(i);
            }}
            className={cx(
              !cl && 'inline-block xxl:(text-right)',
              'break-words',
              'color-link',
              'py-1 xxl:(py-2) px-2',
              'leading-normal no-underline',
              'lt-xxl:(border-b-3) xxl:(border-r-3)',
              'border-transparent',
              'font-gs-heading06',
              currentIndex !== i && 'opacity-60 @hover:(bg-primary opacity-100)',
              currentIndex === i && ['border-warningAlt', 'disabled'].join(' '),
              cl
            )}
          >
            {name}
          </a>
        ))}
      </nav>
      <div
        className={cx(
          'm-0',
          'bg-transparent',
          'w-full',
          flexContent && 'flex flex-col flex-1',
          contentPadding === 'compact' && 'p-2',
          contentPadding === 'normal' && 'p-4',
          'z-2',
          'xxl:(grid-area-content)',
          'lt-xxl:(order-3)',
          contentClassName
        )}
        ref={contentRef}
      >
        <>
          {Pre ? (
            <section
              className={cx(
                'w-full',
                'z-1',
                'lt-xxl:(hidden)',
                contentPadding === 'compact' && 'xxl:(mb-2)',
                contentPadding === 'normal' && 'xxl:(mb-4)',
                preContentClassName
              )}
              ref={preRefWide}
            >
              {Pre}
            </section>
          ) : null}
          {isFunction(items[currentIndex]?.content)
            ? (items[currentIndex].content as () => ReactNode)()
            : items[currentIndex]?.content}
        </>
      </div>
      <aside className={cx('lt-xxl:(hidden)', 'xxl:(grid-area-aside w-res)')}></aside>
      {/* pad the bottom to ensure scrolling works - see useSections for dynamic height logic*/}
      <div
        className={cx('w-full', 'lt-xxl:(order-4)', 'xxl:(grid-area-rest hidden)')}
        ref={bottomPaddingRef}
      ></div>
    </section>
  );
};

export default Sections;
