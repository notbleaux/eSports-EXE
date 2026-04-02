// @ts-nocheck
/**
 * ForumEditor Component
 * Create new thread form with title, category select, and content editor
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
  Bold,
  Italic,
  Code,
  List,
  Quote as QuoteIcon,
  ChevronDown,
  Hash,
  Loader2,
  BookOpen,
  Trophy,
  Brain,
  MessageSquare
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { ForumEditorProps, ForumCategory, CreateThreadData } from './types';

// AREPO theme colors
const AREPO_THEME = {
  base: '#0066ff',
  glow: 'rgba(0, 102, 255, 0.4)',
  muted: '#0044cc',
};

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 20000;

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Trophy,
  Brain,
  MessageSquare,
};

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
 * Category selector component
 */
interface CategorySelectorProps {
  categories: ForumCategory[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
  disabled?: boolean;
}

function CategorySelector({ 
  categories, 
  selectedCategoryId, 
  onSelect, 
  disabled 
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate mb-2">
        Category <span className="text-[#ff4655]">*</span>
      </label>
      
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-lg
          bg-void-mid border border-mist 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#0066ff]/50 cursor-pointer'}
          focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
          transition-colors
        `}
      >
        <div className="flex items-center gap-3">
          {selectedCategory && (
            <>
              {(() => {
                const Icon = ICON_MAP[selectedCategory.icon] || MessageSquare;
                return <Icon className="w-5 h-5 text-[#0066ff]" />;
              })()}
              <span className="text-white">{selectedCategory.name}</span>
            </>
          )}
          {!selectedCategory && (
            <span className="text-slate">Select a category</span>
          )}
        </div>
        <ChevronDown className={`
          w-5 h-5 text-slate transition-transform duration-200
          ${isOpen ? 'rotate-180' : ''}
        `} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 py-2 rounded-lg 
                       bg-[#1a1a25] border border-white/10 shadow-xl z-50 max-h-60 overflow-y-auto"
            >
              {categories.map(category => {
                const Icon = ICON_MAP[category.icon] || MessageSquare;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleSelect(category.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left
                      hover:bg-white/5 transition-colors
                      ${category.id === selectedCategoryId ? 'bg-[#0066ff]/10' : ''}
                    `}
                  >
                    <Icon className={`
                      w-5 h-5
                      ${category.id === selectedCategoryId ? 'text-[#0066ff]' : 'text-slate'}
                    `} />
                    <div className="flex-1">
                      <div className={`
                        font-medium
                        ${category.id === selectedCategoryId ? 'text-white' : 'text-slate'}
                      `}>
                        {category.name}
                      </div>
                      <div className="text-xs text-slate/70">
                        {category.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Title input component
 */
interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  error?: string | null;
}

function TitleInput({ value, onChange, maxLength, error }: TitleInputProps) {
  const charCount = value.length;
  const isOverLimit = charCount > maxLength;

  return (
    <div>
      <label className="block text-sm font-medium text-slate mb-2">
        Title <span className="text-[#ff4655]">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter a descriptive title for your thread"
          maxLength={maxLength}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-void-mid border 
            ${error || isOverLimit ? 'border-[#ff4655]' : 'border-mist focus:border-[#0066ff]'}
            focus:outline-none focus:ring-1 
            ${error || isOverLimit ? 'focus:ring-[#ff4655]' : 'focus:ring-[#0066ff]'}
            text-white placeholder-slate transition-colors
          `}
        />
        <div className={`
          absolute right-3 top-1/2 -translate-y-1/2 text-xs
          ${isOverLimit ? 'text-[#ff4655]' : 'text-slate'}
        `}>
          {charCount}/{maxLength}
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-[#ff4655]">{error}</p>
      )}
    </div>
  );
}

/**
 * Tag input component
 */
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = input.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (tag && !tags.includes(tag) && tags.length < 5) {
        onChange([...tags, tag]);
        setInput('');
      }
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate mb-2">
        Tags <span className="text-slate/50">(optional)</span>
      </label>
      <div className={`
        flex flex-wrap items-center gap-2 px-4 py-2 rounded-lg
        bg-void-mid border border-mist 
        focus-within:border-[#0066ff] focus-within:ring-1 focus-within:ring-[#0066ff]
        transition-colors
      `}>
        {tags.map(tag => (
          <span 
            key={tag}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#0066ff]/20 text-[#0066ff] text-sm"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length < 5 && (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? "Add tags (press Enter)" : "Add more..."}
            className="flex-1 min-w-[120px] bg-transparent text-white placeholder-slate 
                     focus:outline-none text-sm py-1"
          />
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate/50">
        Press Enter or comma to add tags (max 5)
      </p>
    </div>
  );
}

/**
 * Main ForumEditor component
 */
function ForumEditor({
  categories,
  initialCategoryId,
  onSubmit,
  onCancel,
  loading = false,
}: ForumEditorProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId || categories[0]?.id || '');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const contentCharCount = content.length;
  const isContentOverLimit = contentCharCount > MAX_CONTENT_LENGTH;

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be less than ${MAX_TITLE_LENGTH} characters`;
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.length > MAX_CONTENT_LENGTH) {
      newErrors.content = `Content must be less than ${MAX_CONTENT_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, content]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const data: CreateThreadData = {
      categoryId,
      title: title.trim(),
      content: content.trim(),
      tags,
    };

    onSubmit(data);
  }, [categoryId, title, content, tags, validate, onSubmit]);

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

  const isSubmitDisabled = loading || !title.trim() || !content.trim() || isContentOverLimit;

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-white">
            Create New Thread
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-slate hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category selector */}
        <CategorySelector
          categories={categories}
          selectedCategoryId={categoryId}
          onSelect={setCategoryId}
          disabled={loading}
        />

        {/* Title input */}
        <TitleInput
          value={title}
          onChange={setTitle}
          maxLength={MAX_TITLE_LENGTH}
          error={errors.title}
        />

        {/* Tag input */}
        <TagInput tags={tags} onChange={setTags} />

        {/* Content editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate">
              Content <span className="text-[#ff4655]">*</span>
            </label>
            
            {/* Toolbar */}
            <div className="flex items-center gap-1">
              {toolbarActions.map(({ icon, title, action }) => (
                <ToolbarButton
                  key={title}
                  icon={icon}
                  title={title}
                  onClick={action}
                />
              ))}
              <div className="w-px h-6 bg-white/10 mx-1" />
              <ToolbarButton
                icon={showPreview ? Edit3 : Eye}
                title={showPreview ? 'Edit' : 'Preview'}
                onClick={() => setShowPreview(!showPreview)}
                active={showPreview}
              />
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {errors.content && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-4 py-2 mb-3 rounded-lg bg-[#ff4655]/10 
                         border border-[#ff4655]/30 text-[#ff4655] text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.content}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content area */}
          <div className={`
            rounded-lg bg-void-mid border 
            ${errors.content || isContentOverLimit ? 'border-[#ff4655]' : 'border-mist focus-within:border-[#0066ff]'}
            focus-within:ring-1 
            ${errors.content || isContentOverLimit ? 'focus-within:ring-[#ff4655]' : 'focus-within:ring-[#0066ff]'}
            transition-all duration-200
          `}>
            {showPreview ? (
              <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                <MarkdownPreview content={content} />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thread content here... Use markdown for formatting."
                maxLength={MAX_CONTENT_LENGTH}
                disabled={loading}
                className="w-full p-4 min-h-[300px] bg-transparent text-white placeholder-slate 
                         resize-none focus:outline-none disabled:opacity-50"
              />
            )}
          </div>

          {/* Character count */}
          <div className={`
            mt-2 text-sm text-right transition-colors
            ${isContentOverLimit ? 'text-[#ff4655]' : 'text-slate'}
          `}>
            {contentCharCount.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg font-medium text-sm
                     text-slate hover:text-white hover:bg-white/5 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            Cancel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm
                     bg-[#0066ff] text-white hover:bg-[#0066ff]/90 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Thread
              </>
            )}
          </motion.button>
        </div>
      </div>
    </GlassCard>
  );
}

export default ForumEditor;
