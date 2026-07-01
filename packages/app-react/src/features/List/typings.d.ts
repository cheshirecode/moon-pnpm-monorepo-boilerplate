import type { PaginationHookParams } from '@/components/Pagination/typings';
import type { PaginationHookResults, PaginationProps } from '@/components/Pagination/typings';
import type { TableProps } from '@/components/Table/typings';
import type { _SortingState, SortingHookResults } from '@/components/Table/useSorting';

export type ListParams<T> = {
  filter: {
    str: string;
    onChange?: (str: string) => void;
    fn?: (arr: T[], str: string) => T[];
  };
  pagination?: Partial<PaginationHookParams> | false;
  sorting?: _SortingState;
  postProcess?: (arr: T[]) => T[];
};

export type ListResults<T> = {
  filter: {
    str: string;
    set: (str: string) => void;
  };
  pagination: PaginationHookResults;
  filtered: T[];
  paginated: T[];
  sorting: SortingHookResults[0];
  setSorting: SortingHookResults[1];
};

export type ListProps<T> = BaseProps & {
  data: T[];
  pagination: Partial<PaginationProps> & Pick<PaginationHookParams, 'pageSize'>;
  table?: Omit<TableProps<T>, 'data'>;
};
