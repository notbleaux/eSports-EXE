/** [Ver001.000] */
/**
 * Wiki Editor
 * ===========
 * Markdown-based editor for wiki articles.
 */

import React, { useState, useCallback } from 'react';
import { _motion } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Heading, 
  List, 
  Link, 
  _Image, 
  Code, 
  Eye, 
  Edit3,
  Save,
  X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton as Button } from '@/components/ui/GlowButton';
import { WikiArticle, WikiCategory } from './types';

interface WikiEditorProps {
  article?: Partial<WikiArticle>;
  categories: WikiCategory[];
  onSave: (article: Partial<WikiArticle>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const WikiEditor: React.FC<WikiEditorProps> = ({
  article,
  categories,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(article?.category_id);
  const [tags, setTags] = useState(article?.tags?.join(', ') || '');
  const [isPreview, setIsPreview] = useState(false);
  const [excerpt, setExcerpt] = useState(article?.excerpt || '');

  const handleSave = async () => {
    await onSave({
      title,
      content,
      category_id: categoryId,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      excerpt: excerpt || undefined,
    });
  };

  const insertMarkdown = useCallback((before: string, after: string = '') => {
    const textarea = document.getElementById('wiki-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }, [content]);

  const renderPreview = () => {
    // Simple markdown to HTML conversion for preview
    let html = content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br />');

    return { __html: html };
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {article?.id ? 'Edit Article' : 'Create New Article'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !title.trim() || !content.trim()}>
            <Save className="w-4 h-4 mr-1" />
            {isLoading ? 'Saving...' : 'Save Article'}
          </Button>
        </div>
      </div>

      {/* Article Metadata */}
      <GlassCard className="p-6" glowColor="#9d4edd">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Article Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              className="w-full px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#9d4edd]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Category</label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#9d4edd]"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="getting started, tutorial, guide..."
              className="w-full px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#9d4edd]"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Excerpt (optional - auto-generated if empty)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the article..."
              rows={2}
              className="w-full px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#9d4edd] resize-none"
            />
          </div>
        </div>
      </GlassCard>

      {/* Editor Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('**', '**')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('*', '*')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('# ', '')}
            title="Heading 1"
          >
            <Heading className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('- ', '')}
            title="List"
          >
            <List className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('[', '](url)')}
            title="Link"
          >
            <Link className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('`', '`')}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? (
            <>
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </>
          )}
        </Button>
      </div>

      {/* Editor / Preview Area */}
      <GlassCard className="p-0 overflow-hidden" glowColor="#9d4edd">
        {isPreview ? (
          <div className="p-6 min-h-[400px]">
            <h1 className="text-2xl font-bold text-white mb-4">{title || 'Untitled'}</h1>
            <div 
              className="prose prose-invert max-w-none wiki-preview"
              dangerouslySetInnerHTML={renderPreview()}
            />
          </div>
        ) : (
          <textarea
            id="wiki-editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Write your article here...\n\nUse markdown formatting:\n- **Bold text**\n- *Italic text*\n- # Headings\n- - List items"
            className="w-full h-[400px] px-6 py-4 bg-transparent text-white placeholder-white/30 resize-none focus:outline-none font-mono text-sm leading-relaxed"
            spellCheck={false}
          />
        )}
      </GlassCard>

      {/* Help Text */}
      <div className="text-sm text-white/50 flex items-center gap-4">
        <span>Markdown supported</span>
        <span>•</span>
        <span>{content.length} characters</span>
        <span>•</span>
        <span>{content.split(/\s+/).filter(w => w).length} words</span>
      </div>
    </div>
  );
};

export default WikiEditor;
