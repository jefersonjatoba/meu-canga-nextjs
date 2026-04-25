'use client'

import * as React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Base Table Primitives ────────────────────────────────────────────────────

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700', className)}
      {...props}
    />
  )
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        'divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-[#1E1E1E]',
        className
      )}
      {...props}
    />
  )
}

export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        'border-t border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-800/50',
        'font-medium',
        className
      )}
      {...props}
    />
  )
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        'hover:bg-gray-50 dark:hover:bg-gray-800/40',
        'data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/20',
        className
      )}
      {...props}
    />
  )
}

// ─── Header Cell with optional sort ──────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sortDirection?: SortDirection
  onSort?: () => void
}

export function TableHead({
  className,
  sortable,
  sortDirection,
  onSort,
  children,
  ...props
}: TableHeadProps) {
  return (
    <th
      scope="col"
      onClick={sortable ? onSort : undefined}
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide',
        'text-gray-500 dark:text-gray-400',
        sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors',
        className
      )}
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
          ? 'descending'
          : sortable
          ? 'none'
          : undefined
      }
      {...props}
    >
      <span className="flex items-center gap-1.5">
        {children}
        {sortable && (
          <span className="text-gray-300 dark:text-gray-600" aria-hidden>
            {sortDirection === 'asc' ? (
              <ChevronUp size={13} />
            ) : sortDirection === 'desc' ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronsUpDown size={13} />
            )}
          </span>
        )}
      </span>
    </th>
  )
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 text-gray-700 dark:text-gray-300', className)}
      {...props}
    />
  )
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn('mt-4 text-xs text-gray-500 dark:text-gray-400', className)}
      {...props}
    />
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E]">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {from}–{to} de <span className="font-medium">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E1E] px-2 py-1"
            aria-label="Itens por página"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{s} por página</option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1" role="navigation" aria-label="Paginação">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Página anterior"
          >
            ‹
          </button>

          <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
