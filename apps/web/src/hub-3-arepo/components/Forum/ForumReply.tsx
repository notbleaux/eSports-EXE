/**
 * ForumReply Component
 * Reply input form with markdown editor and preview
 * 
 * [Ver001.000] - Initial implementation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send,
  X,
  Eye,
  Edit3,
  AlertCircle,
  CornerDownRight,
  Bold,
  Italic,
  Code,
  List,
  Quote as QuoteIcon,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { ForumReplyProps, ForumPost } from './types';

// AREPO theme colors
const AREPO_THEME = {
  base: '#0066ff',
  glow: 'rgba(0, 102, 255, 0.4)',
  muted: '#0044cc',
};

const MAX_LENGTH = 10000;

/**
 * Toolbar button component
 */
interface ToolbarButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  title: string;
  active?: boolean;
}

function ToolbarButton({ icon: Icon, onClick, title, active }: ToolbarButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={title}
      className={`
        p-2 rounded-lg transition-colors
        ${active 
          ? 'bg-[#0066ff]/20 text-[#0066ff]' 
          : 'text-slate hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
}

/**
 * Markdown preview component
 */
function MarkdownPreview({ content }: { content: string }) {
  const renderMarkdown = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];

    const processInline = (line: string): React.ReactNode => {
      let parts = line.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-[#00d4ff] font-mono text-sm">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });
    };

    const flushList = () => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 ml-2">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={lineIndex} className="text-lg font-semibold text-white mt-4 mb-2">
            {processInline(trimmedLine.slice(4))}
          </h3>
        );
        return;
      }

      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={lineIndex} className="text-xl font-semibold text-white mt-4 mb-2">
            {processInline(trimmedLine.slice(3))}
          </h2>
        );
        return;
      }

      if (trimmedLine.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={lineIndex} className="text-2xl font-bold text-white mt-4 mb-2">
            {processInline(trimmedLine.slice(2))}
          </h1>
        );
        return;
      }

      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        inList = true;
        listItems.push(
          <li key={lineIndex} className="text-slate">
            {processInline(trimmedLine.slice(2))}
          </li>
        );
        return;
      }

      if (inList && trimmedLine.length > 0) {
        flushList();
      }

      if (trimmedLine.length === 0) {
        flushList();
        elements.push(<div key={lineIndex} className="h-2" />);
        return;
      }

      elements.push(
        <p key={lineIndex} className="text-slate leading-relaxed mb-2">
          {processInline(trimmedLine)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  if (!content.trim()) {
    return (
      <div className="text-slate/50 italic py-8 text-center">
        Nothing to preview
      </div>
    );
  }

  return (
    <div className="prose prose-invert max-w-none">
      {renderMarkdown(content)}
    </div>
  );
}

/**
 * Replying to indicator
 */
function ReplyingTo({ post, onClear }: { post: ForumPost; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-t-lg border-b border-white/5">
      <div className="flex items-center gap-2 text-sm">
        <CornerDownRight className="w-4 h-4 text-[#0066ff]" />
        <span className="text-slate">Replying to</span>
        <span className="font-medium text-white">{post.author.name}</span>
      </div>
      <button
        onClick={onClear}
        className="p-1 rounded hover:bg-white/10 text-slate hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Main ForumReply component
 */
function ForumReply({
  onSubmit,
  onCancel,
  replyingTo,
  placeholder = "Write your reply... Use markdown for formatting",
  maxLength = MAX_LENGTH,
}: ForumReplyProps) {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > maxLength;
  const isEmpty = !content.trim();

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (error) setError(null);
  };

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (isEmpty) {
      setError('Please enter some content');
      return;
    }
    if (isOverLimit) {
      setError(`Content exceeds maximum length of ${maxLength.toLocaleString()} characters`);
      return;
    }
    onSubmit(content);
    setContent('');
  }, [content, isEmpty, isOverLimit, maxLength, onSubmit]);

  // Insert markdown
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    setContent(newContent);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarActions = [
    { icon: Bold, title: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: Italic, title: 'Italic', action: () => insertMarkdown('*', '*') },
    { icon: Code, title: 'Code', action: () => insertMarkdown('`', '`') },
    { icon: List, title: 'List', action: () => insertMarkdown('- ') },
    { icon: QuoteIcon, title: 'Quote', action: () => insertMarkdown('> ') },
  ];

  return (
    <GlassCard className="overflow-hidden">
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ReplyingTo post={replyingTo} onClear={onCancel} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-1">
            {toolbarActions.map(({ icon, title, action }) => (
              <ToolbarButton
                key={title}
                icon={icon}
                title={title}
                onClick={action}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={showPreview ? Edit3 : Eye}
              title={showPreview ? 'Edit' : 'Preview'}
              onClick={() => setShowPreview(!showPreview)}
              active={showPreview}
            />
            <ToolbarButton
              icon={isExpanded ? Minimize2 : Maximize2}
              title={isExpanded ? 'Collapse' : 'Expand'}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-4 py-2 mb-3 rounded-lg bg-[#ff4655]/10 
                       border border-[#ff4655]/30 text-[#ff4655] text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div className={`
          relative rounded-lg bg-void-mid border border-mist 
          focus-within:border-[#0066ff] focus-within:ring-1 focus-within:ring-[#0066ff]
          transition-all duration-200
        `}>
          {showPreview ? (
            <div className={`
              p-4 overflow-y-auto
              ${isExpanded ? 'min-h-[400px] max-h-[600px]' : 'min-h-[150px] max-h-[300px]'}
            `}>
              <MarkdownPreview content={content} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`
                w-full p-4 bg-transparent text-white placeholder-slate resize-none
                focus:outline-none
                ${isExpanded ? 'min-h-[400px]' : 'min-h-[150px]'}
              `}
            />
          )}
        </div>

        {/* Footer with character count and actions */}
        <div className="flex items-center justify-between mt-4">
          <div className={`
            text-sm transition-colors
            ${isOverLimit ? 'text-[#ff4655]' : 'text-slate'}
          `}>
            {charCount.toLocaleString()} / {maxLength.toLocaleString()} characters
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className="px-4 py-2 rounded-lg font-medium text-sm
                       text-slate hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isEmpty || isOverLimit}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm
                       bg-[#0066ff] text-white hover:bg-[#0066ff]/90 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              <Send className="w-4 h-4" />
              Post Reply
            </motion.button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default ForumReply;
