// @unocss-include
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  isFunction,
  useReactTable
} from '@tanstack/react-table';
import cx from 'classnames';
import { useEffect, useMemo, useReducer, useState } from 'react';

import { isEmptyObject } from '@/utils';

import { TableCoreProps, TableProps } from './typings';

const useBaseCell = (v: unknown) =>
  useMemo(() => {
    if ((v as Date)?.toLocaleString) {
      return (v as Date)?.toLocaleString();
    }
    if (v?.toString) {
      return v.toString();
    }
    return typeof v !== 'undefined' ? String(v) : null;
  }, [v]);

const useTableCore = <T,>({
  data = [],
  state: { columnVisibility = {}, sorting = [], grouping = [], ...restState } = {},
  enableColumnResizing = true,
  enableRowSelection = false,
  enableMultiSort = true,
  columnResizeMode = 'onChange',
  extra: {
    headerRenderer,
    cellRenderer,
    createColumnDefs,
    skipNonPrimitiveColumns = true,
    subRowRenderer,
    centeredActionColumn = true
  } = {},
  classNameGetters,
  defaultStyling = true,
  className: _cl,
  tableClassName: _t,
  style: _s,
  children: _c,
  manualPagination = false,
  manualSorting = false,
  setSorting,
  defaultColumn = {},
  ...rest
}: TableProps<T>) => {
  if (manualSorting && !isFunction(setSorting)) {
    throw new TypeError('expecting setSorting if manualSorting=true');
  }
  const [_sorting, _setSorting] = useState<typeof sorting>(sorting);
  useEffect(() => {
    if (!isEmptyObject(sorting)) {
      _setSorting(sorting);
    }
  }, [manualSorting, sorting]);
  const [_columnVisibility, _setColumnVisibility] =
    useState<typeof columnVisibility>(columnVisibility);
  useEffect(() => {
    if (!isEmptyObject(columnVisibility)) {
      _setColumnVisibility(columnVisibility);
    }
  }, [columnVisibility]);
  const [_grouping, _setGrouping] = useState<typeof grouping>(grouping);
  // useEffect(() => {
  //   _setGrouping(grouping);
  // }, [grouping]);
  const columnHelper = createColumnHelper<T>();
  // for now, drop those non-primitive columns and rely on createColumnDefs
  const keys = useMemo(() => {
    const firstElement = data[0] as Record<string, unknown>;
    return Object.keys(firstElement ?? {}).filter(
      (x) =>
        skipNonPrimitiveColumns &&
        typeof firstElement[x] !== 'function' &&
        typeof firstElement[x] !== 'object'
    );
  }, [data, skipNonPrimitiveColumns]);

  const columns = useMemo<ColumnDef<T>[]>(() => {
    const baseColumns = keys.map((x) => {
      // https://tanstack.com/table/v8/docs/guide/column-defs#column-helpers for more column types
      // @ts-expect-error
      return columnHelper.accessor(x, {
        // accessorKey: x,
        // header: x,
        header: function Header(props) {
          return headerRenderer ? headerRenderer?.(props, x, x) : x;
        },
        cell: function Cell(props) {
          const v = props.getValue();
          const cachedV = useBaseCell(v);
          return cellRenderer ? cellRenderer?.(props, cachedV) : cachedV;
        }
      });
    });
    const cols = createColumnDefs ? createColumnDefs(baseColumns, columnHelper) : baseColumns;
    cols.forEach((c) => {
      if (!c.enableGrouping) {
        c.enableGrouping = false;
      }
    });
    return cols;
  }, [cellRenderer, columnHelper, createColumnDefs, keys, headerRenderer]);

  const [finalSorting, finalSetSorting] = useMemo(
    () => [manualSorting ? sorting : _sorting, manualSorting ? setSorting : _setSorting],
    [_sorting, manualSorting, setSorting, sorting]
  );

  const table = useReactTable({
    data,
    enableColumnResizing,
    enableRowSelection,
    enableMultiSort,
    columnResizeMode,
    columns,
    state: {
      sorting: finalSorting,
      columnVisibility: _columnVisibility,
      grouping: _grouping,
      ...restState
    },
    onSortingChange: finalSetSorting,
    onColumnVisibilityChange: _setColumnVisibility,
    onGroupingChange: _setGrouping,
    getCoreRowModel: getCoreRowModel<T>(),
    getSortedRowModel: getSortedRowModel<T>(),
    getGroupedRowModel: getGroupedRowModel<T>(),
    manualPagination,
    manualSorting,
    defaultColumn: {
      minSize: 0,
      size: Number.MAX_SAFE_INTEGER,
      maxSize: Number.MAX_SAFE_INTEGER,
      ...defaultColumn
    },
    ...rest
    // debugTable: true,
    // debugHeaders: true,
    // debugColumns: true
  });

  const rerender = useReducer(() => ({}), {})[1];

  const rows = table.getRowModel().rows.map((row) => {
    return {
      id: row.id,
      className: cx(classNameGetters?.row?.(row)),
      cells: row.getVisibleCells().map((cell) => ({
        ...cell,
        id: cell.id,
        style: {
          width: cell.column.getSize() === Number.MAX_SAFE_INTEGER ? 'auto' : cell.column.getSize()
        },
        className: cx(
          defaultStyling && [
            'px-2 py-0.5 uno-layer-o:(border-r-0 border-l-0)',
            'cell-primary ',
            cell.column.columnDef.id !== 'actions' && 'text-left',
            cell.column.columnDef.id === 'actions' && centeredActionColumn
              ? 'text-center'
              : 'text-left',
            'relative',
            cell.column.getSize() === Number.MAX_SAFE_INTEGER && 'flex-1'
          ],
          classNameGetters?.cell?.(cell)
        ),
        // children: flexRender(cell.column.columnDef.cell, cell.getContext())
        render: () => flexRender(cell.column.columnDef.cell, cell.getContext())
      })),
      subRow:
        row.getIsExpanded() && subRowRenderer
          ? {
              className: cx(classNameGetters?.expandedRow?.(row)),
              colSpan: row.getVisibleCells().length,
              children: subRowRenderer(row)
            }
          : {},
      subRows: row.subRows
    };
  });

  return {
    table,
    sorting: _sorting,
    rerender,
    rows
  } as TableCoreProps<T>;
};

export default useTableCore;
