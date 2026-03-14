/**
 * RankingTable Component
 * Reusable sortable ranking table with pagination
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import type { RankingTableProps, ColumnDef } from './types';

const OPERA_COLOR = '#9d4edd';
const OPERA_GLOW = 'rgba(157, 78, 221, 0.4)';

function RankingTable<T extends Record<string, unknown>>({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  rowRenderer,
  loading = false,
  emptyMessage = 'No data available',
  pageSize = 20,
}: RankingTableProps<T>): JSX.Element {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handleSort = (columnKey: keyof T | string) => {
    const column = columns.find(c => c.key === columnKey);
    if (column?.sortable !== false) {
      onSort(columnKey);
    }
  };

  const getSortIcon = (columnKey: keyof T | string) => {
    if (sortColumn !== columnKey) {
      return <ChevronUp className="w-3 h-3 opacity-30" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3" style={{ color: OPERA_COLOR }} />
      : <ChevronDown className="w-3 h-3" style={{ color: OPERA_COLOR }} />;
  };

  if (loading) {
    return (
      <GlassCard className="p-8">
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 rounded-full"
            style={{ borderColor: `${OPERA_COLOR} transparent ${OPERA_COLOR} transparent` }}
          />
        </div>
      </GlassCard>
    );
  }

  if (data.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <ChevronDown className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-sm opacity-60">{emptyMessage}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="overflow-hidden" hoverGlow={OPERA_GLOW}>
        {/* Header */}
        <div className="grid gap-2 p-3 border-b border-white/10 text-xs font-medium opacity-60"
          style={{
            gridTemplateColumns: columns.map(c => c.width || '1fr').join(' '),
          }}
        >
          {columns.map((column) => (
            <button
              key={String(column.key)}
              onClick={() => handleSort(column.key)}
              className={cn(
                'flex items-center gap-1 transition-colors',
                column.sortable !== false && 'hover:opacity-100 cursor-pointer',
                column.align === 'center' && 'justify-center',
                column.align === 'right' && 'justify-end',
              )}
              disabled={column.sortable === false}
            >
              {column.header}
              {column.sortable !== false && getSortIcon(column.key)}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {paginatedData.map((item, index) => (
            <motion.div
              key={String(item.id || index)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="hover:bg-white/5 transition-colors"
            >
              {rowRenderer(item, (currentPage - 1) * pageSize + index)}
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4">
          <div className="text-sm opacity-60">
            Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, data.length)} of {data.length}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === 1 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-white/10'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      currentPage === pageNum
                        ? 'text-white'
                        : 'hover:bg-white/10 opacity-60'
                    )}
                    style={currentPage === pageNum ? { backgroundColor: `${OPERA_COLOR}30`, color: OPERA_COLOR } : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === totalPages 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-white/10'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RankingTable;
