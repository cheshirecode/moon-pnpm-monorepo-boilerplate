import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import type { ExtraInternalTableProps, TableHookParams } from './typings';

const useTable = <T>(params: TableHookParams<T>, extra?: ExtraInternalTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const columnHelper = createColumnHelper<T>();

  const { data = [] } = params;
  const { cellRenderer, createColumnDefs, skipNonPrimitiveColumns = true } = extra ?? {};
  const columns = useMemo<ColumnDef<T>[]>(() => {
    // for now, drop those non-primitive columns and rely on createColumnDefs
    const firstRow = (data[0] ?? {}) as Record<string, unknown>;
    const keys = Object.keys(firstRow).filter(
      (x) =>
        skipNonPrimitiveColumns &&
        typeof firstRow[x] !== 'function' &&
        typeof firstRow[x] !== 'object'
    );
    const baseColumns = keys.map((x) => {
      // @ts-expect-error
      return columnHelper.accessor(x, {
        // accessorKey: x,
        // header: x,
        cell: (info) => {
          const v = info.getValue();
          const str = (() => {
            if ((v as Date)?.toLocaleString) {
              return (v as Date)?.toLocaleString();
            }
            if (v?.toString) {
              return v.toString();
            }
            return typeof v !== 'undefined' ? String(v) : null;
          })();
          return cellRenderer ? cellRenderer?.(info, str) : str;
        }
      });
    });
    // https://tanstack.com/table/v8/docs/guide/column-defs#column-helpers for more column types
    // columnHelper.display({
    //   id: 'actions',
    //   header: 'actions',
    //   footer: 'actions',
    //   cell: (props) => 'actions'
    // })
    return createColumnDefs ? createColumnDefs(baseColumns, columnHelper) : baseColumns;
  }, [cellRenderer, columnHelper, createColumnDefs, data, skipNonPrimitiveColumns]);

  const table = useReactTable({
    ...params,
    columns,
    state: {
      sorting,
      columnVisibility
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel<T>(),
    getSortedRowModel: getSortedRowModel<T>()
    // debugTable: true,
    // debugHeaders: true,
    // debugColumns: true
  });

  return {
    table,
    sorting,
    setSorting
  } as const;
};

export default useTable;
