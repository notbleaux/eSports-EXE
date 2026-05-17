// @ts-nocheck
/**
 * ForumPost Component
 * Individual post display with author sidebar and actions
 * 
 * [Ver001.000] - Initial implementation
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Quote,
  Heart,
  Edit3,
  Clock,
  Shield,
  Award,
  MessageSquare,
  Check,
  MoreHorizontal,
  Flag
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { ForumPostProps, ForumPost as ForumPostType } from './types';

// AREPO theme colors
const AREPO_THEME = {
  base: '#0066ff',
  glow: 'rgba(0, 102, 255, 0.4)',
  muted: '#0044cc',
};

/**
 * Simple markdown renderer
 * Handles basic formatting: bold, italic, code, links, lists
 */
function renderMarkdown(content: string): React.ReactNode {
  // Split content by lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const processInline = (text: string): React.ReactNode => {
    // Handle bold **text**
    let parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      // Handle italic *text*
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      // Handle inline code `code`
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

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      flushList();
      // Simple code block handling - just show as code
      return;
    }

    // Handle headers
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

    // Handle list items
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      inList = true;
      listItems.push(
        <li key={lineIndex} className="text-slate">
          {processInline(trimmedLine.slice(2))}
        </li>
      );
      return;
    }

    // Flush list if we hit a non-list item
    if (inList && trimmedLine.length > 0) {
      flushList();
    }

    // Handle empty lines
    if (trimmedLine.length === 0) {
      flushList();
      elements.push(<div key={lineIndex} className="h-2" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={lineIndex} className="text-slate leading-relaxed mb-2">
        {processInline(trimmedLine)}
      </p>
    );
  });

  flushList();
  return elements;
}

/**
 * Author sidebar component
 */
interface AuthorSidebarProps {
  author: ForumPostType['author'];
  isOriginalPost: boolean;
}

function AuthorSidebar({ author, isOriginalPost }: AuthorSidebarProps) {
  const joinDate = useMemo(() => {
    return new Date(author.joinDate).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }, [author.joinDate]);

  const getRoleIcon = () => {
    switch (author.role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-[#ff4655]" />;
      case 'moderator':
        return <Shield className="w-3.5 h-3.5 text-[#00ff88]" />;
      default:
        return null;
    }
  };

  const getRoleColor = () => {
    switch (author.role) {
      case 'admin':
        return '#ff4655';
      case 'moderator':
        return '#00ff88';
      default:
        return '#a0a0b0';
    }
  };

  return (
    <div className="flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-4 p-4 bg-white/5 rounded-xl">
      {/* Avatar */}
      <div className="relative">
        <img 
          src={author.avatar} 
          alt={author.name}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/10"
        />
        {isOriginalPost && (
          <div 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: AREPO_THEME.base }}
          >
            <MessageSquare className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Author info */}
      <div className="flex-1 sm:text-center">
        <div className="flex items-center sm:justify-center gap-1.5">
          <h4 className="font-semibold text-white truncate max-w-[120px]">
            {author.name}
          </h4>
          {getRoleIcon()}
        </div>
        
        <span 
          className="text-xs px-2 py-0.5 rounded-full inline-block mt-1 capitalize"
          style={{ 
            backgroundColor: `${getRoleColor()}20`,
            color: getRoleColor(),
          }}
        >
          {author.role}
        </span>

        {/* Stats - hidden on mobile */}
        <div className="hidden sm:block mt-3 space-y-1 text-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate">
            <Award className="w-3.5 h-3.5" />
            <span>{author.reputation.toLocaleString()} rep</span>
          </div>
          <div className="text-slate/70">
            Joined {joinDate}
          </div>
          <div className="text-slate/70">
            {author.postCount} posts
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Post actions component
 */
interface PostActionsProps {
  post: ForumPostType;
  isOriginalPost: boolean;
  onQuote: () => void;
  onLike: () => void;
  onEdit?: () => void;
  liked: boolean;
}

function PostActions({ post, isOriginalPost, onQuote, onLike, onEdit, liked }: PostActionsProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Quote button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onQuote}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                 text-slate hover:text-white hover:bg-white/5 transition-colors"
      >
        <Quote className="w-4 h-4" />
        <span className="hidden sm:inline">Quote</span>
      </motion.button>

      {/* Like button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onLike}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
          ${liked 
            ? 'text-[#ff4655] bg-[#ff4655]/10' 
            : 'text-slate hover:text-white hover:bg-white/5'
          }
        `}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
        <span>{post.likes}</span>
      </motion.button>

      {/* Edit button */}
      {onEdit && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                   text-slate hover:text-white hover:bg-white/5 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">Edit</span>
        </motion.button>
      )}

      {/* More menu */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg text-slate hover:text-white hover:bg-white/5 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </motion.button>

        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 bottom-full mb-2 w-40 py-1 rounded-lg 
                       bg-[#1a1a25] border border-white/10 shadow-xl z-50"
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  console.log('Report post:', post.id);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate hover:text-white 
                         hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Report
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Main ForumPost component
 */
function ForumPost({
  post,
  isOriginalPost,
  onQuote,
  onLike,
  onEdit,
}: ForumPostProps) {
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likes);

  const formattedDate = useMemo(() => {
    return new Date(post.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [post.createdAt]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike(post.id);
  };

  const handleQuote = () => {
    onQuote(post);
  };

  return (
    <GlassCard 
      className={`
        overflow-hidden
        ${isOriginalPost ? 'border-[#0066ff]/30' : ''}
      `}
      hoverGlow={isOriginalPost ? AREPO_THEME.glow : undefined}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Author sidebar */}
        <div className="sm:w-48 sm:border-r border-white/5">
          <AuthorSidebar author={post.author} isOriginalPost={isOriginalPost} />
        </div>

        {/* Post content */}
        <div className="flex-1 p-4 sm:p-6">
          {/* Post header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-slate">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
              {post.isEdited && (
                <>
                  <span>•</span>
                  <span className="italic">Edited</span>
                </>
              )}
            </div>

            {/* Post number indicator */}
            {isOriginalPost && (
              <span 
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ 
                  backgroundColor: `${AREPO_THEME.base}20`,
                  color: AREPO_THEME.base,
                }}
              >
                Original Post
              </span>
            )}
          </div>

          {/* Post body */}
          <div className="prose prose-invert max-w-none">
            {renderMarkdown(post.content)}
          </div>

          {/* Post footer with actions */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <PostActions
              post={{ ...post, likes: likeCount }}
              isOriginalPost={isOriginalPost}
              onQuote={handleQuote}
              onLike={handleLike}
              onEdit={onEdit}
              liked={liked}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default ForumPost;
