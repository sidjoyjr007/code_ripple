import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { BrutalSpinner } from "./BrutalSpinner";
import { BrutalSearchInput } from "./BrutalSearchInput";
import { RotateCw } from 'lucide-react';

export const BrutalTable = React.forwardRef(({
  columns = [],
  data = [],
  className,
  isLoading = false,
  loading = false,
  loadingText = "Loading records...",
  onRefresh,
  showSearch = true,
  searchPlaceholder = "Search table...",
  searchValue,
  onSearchChange,
  manualFiltering = false,
  showRefresh = true,
  title,
  actions,
  pageSize = 10,
  ...props
}, ref) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const isServerFiltered = manualFiltering || Boolean(onSearchChange);
  const currentSearch = searchValue !== undefined ? searchValue : globalFilter;
  const [isInternalRefreshing, setIsInternalRefreshing] = useState(false);

  const isTableLoading = isLoading || loading || isInternalRefreshing;

  const table = useReactTable({
    data: data || [],
    columns: columns || [],
    state: {
      globalFilter: isServerFiltered ? '' : globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    manualFiltering: isServerFiltered,
    getCoreRowModel: getCoreRowModel(),
    ...(isServerFiltered ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const handleRefreshClick = async () => {
    if (onRefresh) {
      const result = onRefresh();
      if (result instanceof Promise) {
        setIsInternalRefreshing(true);
        try {
          await result;
        } finally {
          setIsInternalRefreshing(false);
        }
      }
    } else {
      // Demo simulated refresh spinner
      setIsInternalRefreshing(true);
      setTimeout(() => {
        setIsInternalRefreshing(false);
      }, 700);
    }
  };

  const totalRows = isServerFiltered ? (data?.length || 0) : table.getFilteredRowModel().rows.length;

  return (
    <div 
      ref={ref} 
      className={cn("w-full flex flex-col border-[3px] border-border shadow-brutal bg-surface rounded-md", className)} 
      {...props}
    >
      {/* Table Toolbar: Search & Refresh */}
      {(showSearch || showRefresh || title || actions) && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 border-b-[3px] border-border bg-card">
          <div className="flex items-center gap-3 flex-1">
            {title && (
              <h4 className="font-black uppercase tracking-wider text-sm whitespace-nowrap">
                {title}
              </h4>
            )}
            
            {showSearch && (
              <div className="flex-1 max-w-md">
                <BrutalSearchInput
                  value={currentSearch}
                  onChange={(e) => {
                    if (onSearchChange) {
                      onSearchChange(e.target.value);
                    } else {
                      setGlobalFilter(e.target.value);
                    }
                  }}
                  onClear={() => {
                    if (onSearchChange) {
                      onSearchChange('');
                    } else {
                      setGlobalFilter('');
                    }
                  }}
                  placeholder={searchPlaceholder}
                  size="sm"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <span className="text-[11px] font-black uppercase tracking-widest px-2 py-1 bg-muted border-[2px] border-black hidden sm:inline-block">
              {totalRows} {totalRows === 1 ? 'Record' : 'Records'}
            </span>

            {actions}

            {(showRefresh || onRefresh) && (
              <button
                type="button"
                onClick={handleRefreshClick}
                disabled={isTableLoading}
                className={cn(
                  "px-3 py-1.5 border-[2px] border-black bg-secondary hover:bg-secondary/80 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5 transition-all cursor-pointer",
                  isTableLoading && "opacity-75 cursor-not-allowed"
                )}
                title="Refresh table data"
              >
                <RotateCw 
                  className={cn("w-3.5 h-3.5", isTableLoading && "animate-spin")} 
                  strokeWidth={3} 
                />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table Wrapper */}
      <div className="w-full overflow-x-auto relative">
        {/* Loading Overlay when Refreshing */}
        {isTableLoading && (
          <div className="absolute inset-0 bg-surface/85 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center p-6 min-h-[220px]">
            <BrutalSpinner size="lg" variant="warning" text={loadingText} />
          </div>
        )}

        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-info border-b-[3px] border-border">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-4 font-black uppercase tracking-widest border-r-[3px] border-border last:border-r-0">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b-[3px] border-border last:border-b-0 hover:bg-muted/50 transition-colors group">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 font-bold border-r-[3px] border-border last:border-r-0 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="font-black uppercase tracking-widest text-base">
                      {globalFilter ? "No matching records found" : "No Data Available"}
                    </p>
                    {globalFilter && (
                      <button
                        onClick={() => setGlobalFilter('')}
                        className="text-xs font-black uppercase tracking-wider underline hover:text-primary mt-1"
                      >
                        Clear search query
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Reusable Pagination Controls */}
      <div className="flex items-center justify-between p-4 border-t-[3px] border-border bg-muted">
        <div className="font-black uppercase text-sm tracking-widest hidden sm:block">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </div>
        <Pagination className="w-auto mx-0 flex-none">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (table.getCanPreviousPage()) table.previousPage();
                }}
                className={cn(
                  "border-[3px] border-border rounded-md hover:bg-warning font-bold uppercase tracking-wide cursor-pointer",
                  !table.getCanPreviousPage() && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
                href="#"
              />
            </PaginationItem>
            
            {[...Array(Math.max(1, table.getPageCount()))].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    table.setPageIndex(i);
                  }}
                  isActive={table.getState().pagination.pageIndex === i}
                  className={cn(
                    "rounded-md font-bold",
                    table.getState().pagination.pageIndex === i 
                      ? "border-[3px] border-border hover:bg-warning bg-card"
                      : "border-[3px] border-transparent hover:border-border hover:bg-warning"
                  )}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (table.getCanNextPage()) table.nextPage();
                }}
                className={cn(
                  "border-[3px] border-border rounded-md hover:bg-warning font-bold uppercase tracking-wide cursor-pointer",
                  !table.getCanNextPage() && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
                href="#"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
});

BrutalTable.displayName = "BrutalTable";

// --- Shadcn-style Primitive Table Components ---

export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto border-[3px] border-border bg-surface shadow-brutal-sm rounded-md">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b-[3px] [&_tr]:border-border bg-muted/40", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b-[3px] border-border transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted", className)} {...props} />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-12 px-4 text-left align-middle text-[10px] font-black uppercase tracking-widest text-foreground", className)} {...props} />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
));
TableCell.displayName = "TableCell";

export default BrutalTable;
