/**
 * Admin Panel Components
 *
 * Review Queue interface for data verification and decision management
 *
 * [Ver001.000]
 */

import { useState } from 'react';
import { useReviewQueue, useSubmitReviewDecision, type ReviewQueueItem } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function ReviewQueuePanel() {
  const { data, isLoading } = useReviewQueue();
  const [filter, setFilter] = useState<'high-priority' | 'all'>('high-priority');

  const items = data?.data || [];
  const highPriority = items.filter((item: ReviewQueueItem) => item.confidence < 0.5);
  const displayItems = filter === 'high-priority' ? highPriority : items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Review Queue</h2>
        <div className="text-sm font-mono text-white/50">
          {highPriority.length} high priority
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('high-priority')}
          className={`px-4 py-2 rounded text-sm font-bold transition-all ${
            filter === 'high-priority'
              ? 'bg-red-500/20 border border-red-500/50 text-red-400'
              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
          }`}
        >
          High Priority ({highPriority.length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded text-sm font-bold transition-all ${
            filter === 'all'
              ? 'bg-white/10 border border-white/20 text-white'
              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
          }`}
        >
          All Items ({items.length})
        </button>
      </div>

      {/* Items list */}
      {isLoading ? (
        <div className="text-center py-8 text-white/50">Loading items...</div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-8 text-white/50">No items to review</div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item: ReviewQueueItem) => (
            <ReviewQueueItemCard key={item.item_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewQueueItemCardProps {
  item: ReviewQueueItem;
}

function ReviewQueueItemCard({ item }: ReviewQueueItemCardProps) {
  const [decision, setDecision] = useState<string | null>(null);
  const submitDecision = useSubmitReviewDecision();

  const handleDecision = (decision: 'approve' | 'reject' | 'needs_more_data') => {
    setDecision(decision);
    submitDecision.mutate({
      itemId: item.item_id,
      decision,
      notes: `Reviewed on ${new Date().toISOString()}`,
    });
  };

  const isHighPriority = item.confidence < 0.5;
  const borderColor = isHighPriority ? 'border-red-500/20' : 'border-white/10';
  const bgColor = isHighPriority ? 'bg-red-500/[0.05]' : 'bg-white/[0.02]';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 border ${borderColor} ${bgColor} rounded-lg`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <AlertCircle className={`w-5 h-5 ${isHighPriority ? 'text-red-400' : 'text-yellow-400'}`} />
          <div>
            <p className="font-bold text-white">{item.item_id}</p>
            <p className="text-xs text-white/50">{item.data_type} • {item.game}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${isHighPriority ? 'text-red-400' : 'text-yellow-400'}`}>
            {(item.confidence * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-white/40">Confidence</p>
        </div>
      </div>

      {/* Issues */}
      {item.issues.length > 0 && (
        <div className="mb-4 space-y-1 pl-8">
          {item.issues.map((issue, idx) => (
            <p key={idx} className="text-xs text-white/60">
              • {issue}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleDecision('approve')}
          disabled={submitDecision.isPending}
          className="flex-1 px-3 py-2 bg-kunst-green/20 border border-kunst-green/50 rounded text-sm font-bold text-kunst-green hover:bg-kunst-green/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Approve
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleDecision('reject')}
          disabled={submitDecision.isPending}
          className="flex-1 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded text-sm font-bold text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleDecision('needs_more_data')}
          disabled={submitDecision.isPending}
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm font-bold text-white/70 hover:bg-white/10 disabled:opacity-50 transition-all"
        >
          More Data
        </motion.button>
      </div>

      {/* Status feedback */}
      {submitDecision.isPending && decision === 'approve' && (
        <p className="text-xs text-kunst-green mt-2">Submitting approval...</p>
      )}
      {submitDecision.isSuccess && (
        <p className="text-xs text-kunst-green mt-2">✓ Decision submitted</p>
      )}
      {submitDecision.isError && (
        <p className="text-xs text-red-400 mt-2">✗ Failed to submit</p>
      )}
    </motion.div>
  );
}

/**
 * Stats card component for admin dashboard
 */
interface StatCardProps {
  label: string;
  value: string;
  color?: 'white' | 'red' | 'green';
}

export function StatCard({ label, value, color = 'white' }: StatCardProps) {
  const colorClass = {
    white: 'text-white',
    red: 'text-red-400',
    green: 'text-kunst-green',
  }[color];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-6 border border-white/10 bg-white/[0.02] rounded-lg"
    >
      <p className="text-sm font-mono text-white/50 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </motion.div>
  );
}
