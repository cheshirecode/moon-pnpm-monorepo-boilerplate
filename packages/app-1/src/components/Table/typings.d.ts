import type {
  Cell,
  CellContext,
  ColumnDef,
  ColumnHelper,
  Header,
  HeaderContext,
  OnChangeFn,
  Row,
  SortingState,
  Table,
  TableOptions
} from '@tanstack/react-table';
import type { CSSProperties, DispatchWithoutAction, ReactNode } from 'react';

export type InternalTableProps<T> = Partial<TableOptions<T>> & Pick<TableOptions<T>, 'data'>;
export type TableHookParams<T> = InternalTableProps<T>;

export type ExtraInternalTableProps<T> = {
  headerRenderer?: (
    props: HeaderContext<T, unknown>,
    v: string | null,
    displayX: string | null
  ) => ReactNode;
  cellRenderer?: (props: CellContext<T, unknown>, v: string | null) => ReactNode;
  subRowRenderer?: (props: Row<T>) => ReactNode;
  createColumnDefs?: (colDefs: ColumnDef<T>[], helper: ColumnHelper<T>) => ColumnDef<T>[];
  /**
   * default - true. flag to not include non-string, non-number columns to defs to simplify rendering
   * and allow custom columns in userland with createColumnDefs (or set to true and use cellRenderer)
   */
  skipNonPrimitiveColumns?: boolean;
  /**
   * by default centering the column if id === actions
   */
  centeredActionColumn?: boolean;
};

export interface CustomCell<T> extends Cell<T, unknown> {
  id: string;
  style: {
    width?: number | undefined;
  };
  className: string;
  render: () => ReactNode | JSX.Element;
  children?: ReactNode;
}

export type TableProps<T> = BaseProps &
  InternalTableProps<T> & {
    extra?: ExtraInternalTableProps<T>;
    classNameGetters?: {
      header?: (props: Header<T, unknown>) => string;
      row?: (props: Row<T>) => string;
      expandedRow?: (props: Row<T>) => string;
      cell?: (props: Cell<T, unknown>) => string;
    };
    tableClassName?: string;
    style?: CSSProperties;
    defaultStyling?: boolean;
    setSorting?: OnChangeFn<SortingState>;
    /**
     * (experimental) virtualized rows
     */
    isVirtual?: boolean;
    /**
     * (experimental) virtualized rows
     */
    isHeaderHidden?: boolean;
    /**
     * (experimental) virtualized rows
     */
    isFooterHidden?: boolean;
    /**
     * (experimental) virtualized rows
     */
    isBodyHidden?: boolean;
    hasCustomFooter?: boolean;
  };

export type TableCoreProps<T> = {
  table: Table<T>;
  sorting: SortingState;
  rerender: DispatchWithoutAction;
  rows: ({
    id: string;
    className: string;
    cells: CustomCell<T>[];
    subRow: {
      className: string;
      colSpan: number;
      children: ReactNode;
    };
  } & Row<T>)[];
  // (exprimental) set to false in order to use div
  isTableElement?: boolean;
};
