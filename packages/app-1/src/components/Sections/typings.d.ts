import type { MouseEvent, ReactNode } from 'react';

export type SectionItem = {
  id: string;
  name: ReactNode;
  content?: ReactNode | (() => ReactNode);
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

export type SectionHookParams = {
  items?: SectionItem[];
  activeIndex?: number;
  inferHash?: boolean;
  inferQueryParams?: boolean;
  cbScrollTop?: (scrollTop: number) => void;
  scrollTopOnIndexChange?: boolean;
};

export type SectionsProps = BaseProps &
  SectionHookParams & {
    stickyNav?: boolean;
    navClassName?: string;
    contentClassName?: string;
    itemFitContent?: boolean;
    Pre?: ReactNode;
    preContentClassName?: string;
    flexContent?: boolean;
    contentPadding?: 'compact' | 'normal';
  };
