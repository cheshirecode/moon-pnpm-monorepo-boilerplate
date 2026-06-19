import styled from '@emotion/styled';
import { flexRender } from '@tanstack/react-table';
import cx from 'classnames';
import stringify from 'fast-json-stable-stringify';
import { isNil } from 'lodash-es';
import type { ThHTMLAttributes } from 'react';
import { Fragment, useRef } from 'react';


const TElement = styled.table``;
const TBody = styled.tbody``;
const TFoot = styled.tfoot``;
const THead = styled.thead``;
const TRow = styled.tr``;
const THeader = styled(({ as: E = 'th', ...props }) => (
  <E {...(props as ThHTMLAttributes<HTMLTableCellElement>)} />
))``;
const TCell = styled.td``;

import { TableCoreProps, TableProps } from './typings';
import useTableCore from './useTableCore';
import useVirtualTable from './useVirtualTable';

const Rows = <T,>({ rows = [], isTableElement }: Partial<TableCoreProps<T>>) => (
  <>
    {rows.map(({ id, className, cells, subRow, subRows, ...rest }) => (
      <Fragment key={id}>
        <TRow
          {...(isTableElement ? {} : { as: 'div' })}
          className={cx(isTableElement ? '' : 'flex', className)}
          {...rest}
        >
          {cells.map(
            ({
              id,
              style,
              className,
              children,
              render,
              getIsGrouped,
              getIsAggregated,
              getContext,
              column
            }) => (
              <TCell
                {...(isTableElement ? {} : { as: 'div' })}
                key={id}
                style={style}
                className={cx('m-0 relative', getIsGrouped() && 'vertical-base', className)}
              >
                {getIsGrouped() ? (
                  // If it's a grouped cell, add an expander and row count
                  <>
                    {flexRender(column.columnDef.cell, getContext())} ({subRows.length})
                  </>
                ) : getIsAggregated() ? (
                  // If the cell is aggregated, use the Aggregated
                  // renderer for cell
                  flexRender(column.columnDef.aggregatedCell ?? column.columnDef.cell, getContext())
                ) : render ? (
                  render()
                ) : (
                  children
                )}
              </TCell>
            )
          )}
        </TRow>
        {subRow?.children && (
          <TRow
            {...(isTableElement ? {} : { as: 'div' })}
            className={cx(isTableElement ? '' : 'flex')}
          >
            {/* https://github.com/TanStack/table/blob/main/examples/react/sub-components/src/main.tsx#L161 */}
            <TCell
              {...(isTableElement ? {} : { as: 'div' })}
              className={subRow.className}
              colSpan={subRow.colSpan}
            >
              {subRow.children}
            </TCell>
          </TRow>
        )}
      </Fragment>
    ))}
  </>
);

const VirtualTable = <T,>(props: TableProps<T> & TableCoreProps<T>) => {
  const ref = useRef<HTMLTableElement>(null);
  const { rows, className, isVirtual: _i, ...rest } = props;
  const { rows: newRows, virtualizer } = useVirtualTable({
    ref,
    rows
  });
  return (
    <>
      <PlainTable<T> {...rest} rows={[]} isFooterHidden isBodyHidden />
      <section
        ref={ref}
        className={cx(
          'w-full contain-strict',
          'relative',
          'scrollbar scrollbar-primary min-h-34 ',
          rows.length > 5 && rows.length < 10 && 'min-h-60',
          rows.length > 10 && 'min-h-100',
          className
        )}
      >
        <div
          className="w-full relative"
          style={{
            height: virtualizer.getTotalSize()
          }}
        >
          <PlainTable<T>
            className="absolute top-0 left-0"
            style={{
              transform: `translateY(${newRows[0]?.start ?? 0}px)`
            }}
            {...rest}
            rows={newRows as unknown as typeof rows}
            isHeaderHidden
          />
        </div>
      </section>
    </>
  );
};

export const PlainTable = <T,>(props: TableProps<T> & TableCoreProps<T>) => {
  const {
    className,
    style,
    tableClassName,
    enableColumnResizing = false,
    defaultStyling = true,
    classNameGetters,
    debugAll,
    extra: { centeredActionColumn = true } = {},
    isVirtual = false,
    isHeaderHidden = false,
    isFooterHidden = false,
    isBodyHidden = false,
    isTableElement = false,
    table,
    sorting,
    rerender,
    rows
  } = props;

  if (isVirtual) {
    return <VirtualTable {...props} />;
  }

  return (
    <article className={cx('w-full', !isVirtual && className)} style={style}>
      <TElement
        {...(isTableElement ? {} : { as: 'section' })}
        className={cx('w-full', 'border-collapse border-spacing-0', 'inline-block', tableClassName)}
      >
        {!isHeaderHidden && (
          <THead {...(isTableElement ? {} : { as: 'div' })}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TRow
                {...(isTableElement ? {} : { as: 'div' })}
                key={headerGroup.id}
                className={cx(isTableElement ? '' : 'flex')}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <THeader
                      {...(isTableElement ? { colSpan: header.colSpan } : { as: 'div' })}
                      key={header.id}
                      style={{
                        width:
                          header.getSize() === Number.MAX_SAFE_INTEGER ? 'auto' : header.getSize(),
                        ...(enableColumnResizing ? { position: 'relative' } : {})
                      }}
                      className={cx(
                        'group',
                        defaultStyling && [
                          'px-2 py-0.5 uno-layer-o:(border-r-0 border-l-0 border-t-0)',
                          'cell-tertiary color-primary',
                          header.column.columnDef.id !== 'actions'
                            ? 'text-left'
                            : centeredActionColumn && 'text-center'
                        ],
                        !isTableElement && header.getSize() === Number.MAX_SAFE_INTEGER && 'flex-1',
                        classNameGetters?.header?.(header)
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cx(
                            header.column.getCanSort() && 'cursor-pointer select-none',
                            'truncate'
                          )}
                          title={
                            header.column.getCanSort()
                              ? 'SHIFT-click to sort by multiple columns'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.column.getCanGroup() ? (
                            // If the header can be grouped, let's add a toggle
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                header.column.getToggleGroupingHandler()();
                              }}
                              className="btn btn-compact btn-icon cursor-pointer"
                              title={header.column.getIsGrouped() ? 'Ungroup' : 'Group'}
                            >
                              {header.column.getIsGrouped() ? '<>' : '><'}
                            </button>
                          ) : null}
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' △',
                            desc: ' ▽'
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                      {enableColumnResizing && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cx(
                            defaultStyling && [
                              'absolute right-0 top-0 h-full w-1 bg-gray',
                              'cursor-col-resize select-none touch-none',
                              'opacity-0 group-@hover:(opacity-100)',
                              // 'resizer'
                              header.column.getIsResizing() && 'isResizing bg-blue-70 opacity-100'
                            ]
                          )}
                        ></div>
                      )}
                    </THeader>
                  );
                })}
              </TRow>
            ))}
          </THead>
        )}
        <TBody {...(isTableElement ? {} : { as: 'div' })}>
          {!isBodyHidden && <Rows<T> rows={rows} isTableElement={isTableElement} />}
        </TBody>
        {!isFooterHidden && (
          <TFoot {...(isTableElement ? {} : { as: 'div' })}>
            {table.getFooterGroups().map((footerGroup) => (
              <TRow
                {...(isTableElement ? {} : { as: 'div' })}
                className={cx(isTableElement ? '' : 'flex')}
                key={footerGroup.id}
              >
                {footerGroup.headers.map(
                  (header) =>
                    !isNil(header.column.columnDef.footer) && (
                      <TCell
                        {...(isTableElement ? {} : { as: 'div' })}
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          ...(enableColumnResizing
                            ? { position: 'relative', width: header.getSize() }
                            : {})
                        }}
                        className={cx(
                          'group',
                          defaultStyling && [
                            'p-2 cell-primary',
                            header.column.columnDef.id !== 'actions'
                              ? 'text-left'
                              : centeredActionColumn && 'text-center'
                          ],
                          classNameGetters?.header?.(header)
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.footer, header.getContext())}
                      </TCell>
                    )
                )}
              </TRow>
            ))}
          </TFoot>
        )}
      </TElement>
      {debugAll && (
        <div className="flex flex-wrap flex-gap-2">
          <div>{table.getRowModel().rows.length} Rows</div>
          <button className="btn" onClick={rerender}>
            Force Rerender
          </button>
          <pre>{stringify(sorting)}</pre>
        </div>
      )}
    </article>
  );
};

const Table = <T,>(props: TableProps<T>) => {
  const tableCoreProps = useTableCore<T>(props);

  return <PlainTable {...props} {...tableCoreProps} />;
};

export default Table;
