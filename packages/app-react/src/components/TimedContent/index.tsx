import { delay } from '@cheshirecode/async-utils';
import cx from 'classnames';
import { isFunction, isNil } from 'lodash-es';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type TimeContentProps = BaseProps & {
  timings: {
    time: number;
    content: ReactNode | (() => ReactNode);
    cb?: () => void;
  }[];
};

export const DURATIONS = {
  DISAPPEARING_MESSAGE: 2000
};

export const CSS_CLASS = {
  DISAPPEARING_MESSAGE: 'animate-duration-2000'
};

const TimedContent = ({ className, timings, children }: TimeContentProps) => {
  const [c, setC] = useState(children);
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    timings?.forEach(async ({ time, content, cb }) => {
      const comp = isNil(content) ? children : isFunction(content) ? content() : content;
      await delay(time);
      if (cancelled) return;
      setC(comp);
      isFunction(cb) && cb();
    });

    return () => {
      cancelled = true;
    };
  }, [children, timings]);

  return (
    <section className={cx('', isNil(c) && 'w-0 h-0 p-0 m-0 disabled', !isNil(c) && className)}>
      {c}
    </section>
  );
};

export default TimedContent;
