/** [Ver001.000] */
/**
 * Wiki Article Viewer
 * ===================
 * Displays a wiki article with markdown rendering and feedback.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  Eye, 
  Tag, 
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton as Button } from '@/components/ui/GlowButton';
import { WikiArticle, ArticleFeedback } from './types';

interface WikiArticleViewerProps {
  article: WikiArticle;
  onFeedback?: (feedback: ArticleFeedback) => void;
  showNavigation?: boolean;
}

export const WikiArticleViewer: React.FC<WikiArticleViewerProps> = ({
  article,
  onFeedback,
  showNavigation = true,
}) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleFeedback = (isHelpful: boolean) => {
    if (isHelpful) {
      onFeedback?.({ is_helpful: true });
      setFeedbackSubmitted(true);
    } else {
      setShowFeedbackForm(true);
      setFeedbackSubmitted(false);
    }
  };

  const submitNegativeFeedback = () => {
    onFeedback?.({ is_helpful: false, feedback: feedbackText });
    setShowFeedbackForm(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Article Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Breadcrumbs */}
        {article.category && (
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <span>Help Center</span>
            <span>/</span>
            <span className="text-white/80">{article.category.name}</span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {article.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Updated {formatDate(article.updated_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{article.view_count.toLocaleString()} views</span>
          </div>
          {article.version > 1 && (
            <span className="text-white/40">Version {article.version}</span>
          )}
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-white/10 text-white/70 rounded-full flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Article Content */}
      <GlassCard className="p-6 md:p-8 mb-8" glowColor="#9d4edd">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none wiki-content"
          dangerouslySetInnerHTML={{ 
            __html: article.content_html || article.content 
          }}
        />
      </GlassCard>

      {/* Feedback Section */}
      <GlassCard className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Was this article helpful?
          </h3>
          
          {feedbackSubmitted === null ? (
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                onClick={() => handleFeedback(true)}
                className="flex items-center gap-2 hover:bg-green-500/20 hover:border-green-500/50"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes, helpful
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFeedback(false)}
                className="flex items-center gap-2 hover:bg-red-500/20 hover:border-red-500/50"
              >
                <ThumbsDown className="w-4 h-4" />
                No, not helpful
              </Button>
            </div>
          ) : feedbackSubmitted === true ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-green-400 mt-4"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Thanks for your feedback!</span>
            </motion.div>
          ) : showFeedbackForm ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="How can we improve this article?"
                className="w-full px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#9d4edd] resize-none"
                rows={3}
              />
              <div className="flex justify-center gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setShowFeedbackForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={submitNegativeFeedback}>
                  Submit Feedback
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-white/60 mt-4"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Thanks for helping us improve!</span>
            </motion.div>
          )}

          {/* Helpfulness Stats */}
          {(article.helpful_count > 0 || article.not_helpful_count > 0) && (
            <div className="mt-6 pt-4 border-t border-white/10 text-sm text-white/50">
              <div className="flex justify-center gap-6">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {article.helpful_count} found helpful
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsDown className="w-3 h-3" />
                  {article.not_helpful_count} not helpful
                </span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <style>{`
        .wiki-content h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem;
          color: white;
        }
        .wiki-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
          color: white;
        }
        .wiki-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
          color: rgba(255,255,255,0.9);
        }
        .wiki-content p {
          margin: 0.75rem 0;
          line-height: 1.7;
          color: rgba(255,255,255,0.85);
        }
        .wiki-content ul, .wiki-content ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        .wiki-content li {
          margin: 0.25rem 0;
          color: rgba(255,255,255,0.85);
        }
        .wiki-content code {
          background: rgba(255,255,255,0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.9em;
        }
        .wiki-content pre {
          background: rgba(0,0,0,0.5);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .wiki-content pre code {
          background: none;
          padding: 0;
        }
        .wiki-content a {
          color: #9d4edd;
          text-decoration: none;
        }
        .wiki-content a:hover {
          text-decoration: underline;
        }
        .wiki-content strong {
          color: white;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default WikiArticleViewer;
