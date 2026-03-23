/**
 * Replay Library Component
 * List, search, filter, and manage stored replays
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-E
 * Team: Replay 2.0 Core (TL-S2)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Play, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Tag,
  MoreVertical,
  X,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  HardDrive,
  AlertCircle,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { GameType } from '@/lib/replay/types';
import {
  queryReplays,
  getMetadata,
  deleteReplay,
  getStorageQuota,
  getUniqueMaps,
  getUniqueTags,
  addTags,
  removeTags,
  getThumbnail,
  type ReplayMetadata,
  type StorageFilters,
  type StorageSortOptions,
  type StorageQuota,
} from '@/lib/replay/storage/indexeddb';

// ============================================================================
// Utility Functions
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'grid' | 'list';

interface ReplayLibraryProps {
  onReplaySelect?: (replayId: string) => void;
  onReplayPlay?: (replayId: string) => void;
  selectedReplayId?: string;
  className?: string;
}

interface FilterState {
  gameType: GameType | 'all';
  mapName: string;
  tags: string[];
  dateFrom: string;
  dateTo: string;
  durationMin: number;
  durationMax: number;
}

// ============================================================================
// Components
// ============================================================================

export function ReplayLibrary({
  onReplaySelect,
  onReplayPlay,
  selectedReplayId,
  className,
}: ReplayLibraryProps) {
  // State
  const [replays, setReplays] = useState<ReplayMetadata[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    gameType: 'all',
    mapName: '',
    tags: [],
    dateFrom: '',
    dateTo: '',
    durationMin: 0,
    durationMax: 0,
  });
  const [availableMaps, setAvailableMaps] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Sort
  const [sort, setSort] = useState<StorageSortOptions>({
    field: 'timestamp',
    direction: 'desc',
  });
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  
  // Load replays
  const loadReplays = useCallback(async (reset = false) => {
    setLoading(true);
    
    try {
      const newPage = reset ? 0 : page;
      const pageSize = 20;
      
      const storageFilters: StorageFilters = {
        gameType: filters.gameType === 'all' ? undefined : filters.gameType,
        mapName: filters.mapName || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom).getTime() : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo).getTime() : undefined,
        durationMin: filters.durationMin || undefined,
        durationMax: filters.durationMax || undefined,
      };
      
      const result = await queryReplays(
        storageFilters,
        sort,
        { offset: newPage * pageSize, limit: pageSize }
      );
      
      if (reset) {
        setReplays(result.metadata);
        setPage(1);
      } else {
        setReplays(prev => [...prev, ...result.metadata]);
        setPage(prev => prev + 1);
      }
      
      setTotalCount(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load replays:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page]);
  
  // Initial load
  useEffect(() => {
    loadReplays(true);
    loadFilters();
    loadQuota();
  }, []);
  
  // Reload when filters or sort change
  useEffect(() => {
    loadReplays(true);
  }, [filters, sort]);
  
  // Load filter options
  const loadFilters = async () => {
    const [maps, tags] = await Promise.all([
      getUniqueMaps(),
      getUniqueTags(),
    ]);
    setAvailableMaps(maps);
    setAvailableTags(tags);
  };
  
  // Load quota
  const loadQuota = async () => {
    const q = await getStorageQuota();
    setQuota(q);
  };
  
  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this replay?')) return;
    
    const result = await deleteReplay(id);
    if (result.success) {
      setReplays(prev => prev.filter(r => r.id !== id));
      setTotalCount(prev => prev - 1);
      loadQuota();
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} replays?`)) return;
    
    for (const id of selectedIds) {
      await deleteReplay(id);
    }
    
    setSelectedIds(new Set());
    loadReplays(true);
    loadQuota();
  };
  
  // Handle export
  const handleExport = async (replay: ReplayMetadata) => {
    // Trigger download via parent or emit event
    console.log('Export replay:', replay.id);
  };
  
  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // Select all
  const selectAll = () => {
    setSelectedIds(new Set(replays.map(r => r.id)));
  };
  
  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };
  
  // Filtered replays by search
  const filteredReplays = useMemo(() => {
    if (!searchQuery) return replays;
    
    const query = searchQuery.toLowerCase();
    return replays.filter(replay =>
      replay.mapName.toLowerCase().includes(query) ||
      replay.matchId.toLowerCase().includes(query) ||
      replay.players.some(p => p.name.toLowerCase().includes(query)) ||
      replay.teams.some(t => t.name.toLowerCase().includes(query))
    );
  }, [replays, searchQuery]);
  
  return (
    <div className={cn('flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Replay Library</h2>
          <span className="text-sm text-gray-400">
            {totalCount} replay{totalCount !== 1 ? 's' : ''}
          </span>
          {quota && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <HardDrive className="w-4 h-4" />
              <span>{formatFileSize(quota.used)}</span>
              {quota.total > 0 && (
                <span className="text-gray-500">
                  / {formatFileSize(quota.total)}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
              showFilters ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>
      
      {/* Search and selection bar */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search replays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Game type */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Game</label>
              <select
                value={filters.gameType}
                onChange={(e) => setFilters(f => ({ ...f, gameType: e.target.value as GameType | 'all' }))}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Games</option>
                <option value="valorant">Valorant</option>
                <option value="cs2">CS2</option>
              </select>
            </div>
            
            {/* Map */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Map</label>
              <select
                value={filters.mapName}
                onChange={(e) => setFilters(f => ({ ...f, mapName: e.target.value }))}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">All Maps</option>
                {availableMaps.map(map => (
                  <option key={map} value={map}>{map}</option>
                ))}
              </select>
            </div>
            
            {/* Date from */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            
            {/* Date to */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Tags */}
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilters(f => ({
                    ...f,
                    tags: f.tags.includes(tag)
                      ? f.tags.filter(t => t !== tag)
                      : [...f.tags, tag]
                  }))}
                  className={cn(
                    'px-2 py-1 rounded text-xs transition-colors',
                    filters.tags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Sort bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-800 text-sm">
        <span className="text-gray-500">Sort by:</span>
        {(['timestamp', 'duration', 'fileSize', 'accessCount'] as const).map((field) => (
          <button
            key={field}
            onClick={() => setSort(s => ({
              field,
              direction: s.field === field && s.direction === 'desc' ? 'asc' : 'desc'
            }))}
            className={cn(
              'flex items-center gap-1 transition-colors',
              sort.field === field ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
            )}
          >
            {field === 'timestamp' && 'Date'}
            {field === 'duration' && 'Duration'}
            {field === 'fileSize' && 'Size'}
            {field === 'accessCount' && 'Views'}
            {sort.field === field && (
              sort.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
            )}
          </button>
        ))}
      </div>
      
      {/* Replay list */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredReplays.map(replay => (
              <ReplayCard
                key={replay.id}
                replay={replay}
                selected={selectedIds.has(replay.id)}
                isActive={selectedReplayId === replay.id}
                onSelect={() => toggleSelection(replay.id)}
                onClick={() => onReplaySelect?.(replay.id)}
                onPlay={() => onReplayPlay?.(replay.id)}
                onDelete={() => handleDelete(replay.id)}
                onExport={() => handleExport(replay)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReplays.map(replay => (
              <ReplayListItem
                key={replay.id}
                replay={replay}
                selected={selectedIds.has(replay.id)}
                isActive={selectedReplayId === replay.id}
                onSelect={() => toggleSelection(replay.id)}
                onClick={() => onReplaySelect?.(replay.id)}
                onPlay={() => onReplayPlay?.(replay.id)}
                onDelete={() => handleDelete(replay.id)}
                onExport={() => handleExport(replay)}
              />
            ))}
          </div>
        )}
        
        {filteredReplays.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p>No replays found</p>
            {(searchQuery || Object.values(filters).some(v => v !== '' && v !== 'all' && (!Array.isArray(v) || v.length > 0))) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    gameType: 'all',
                    mapName: '',
                    tags: [],
                    dateFrom: '',
                    dateTo: '',
                    durationMin: 0,
                    durationMax: 0,
                  });
                }}
                className="mt-2 text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {hasMore && !loading && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => loadReplays()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Replay Card (Grid View)
// ============================================================================

interface ReplayCardProps {
  replay: ReplayMetadata;
  selected: boolean;
  isActive: boolean;
  onSelect: () => void;
  onClick: () => void;
  onPlay: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function ReplayCard({
  replay,
  selected,
  isActive,
  onSelect,
  onClick,
  onPlay,
  onDelete,
  onExport,
}: ReplayCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  useEffect(() => {
    if (replay.thumbnailId) {
      getThumbnail(replay.id).then(blob => {
        if (blob) {
          setThumbnail(URL.createObjectURL(blob));
        }
      });
    }
  }, [replay.id, replay.thumbnailId]);
  
  return (
    <div
      className={cn(
        'group relative bg-gray-800 rounded-lg overflow-hidden transition-all cursor-pointer',
        isActive && 'ring-2 ring-blue-500',
        selected && 'ring-2 ring-blue-400',
        'hover:bg-gray-750'
      )}
    >
      {/* Thumbnail */}
      <div 
        className="relative aspect-video bg-gray-900"
        onClick={onClick}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={replay.mapName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Play className="w-12 h-12 text-gray-600" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </button>
        </div>
        
        {/* Checkbox */}
        <div 
          className="absolute top-2 left-2"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            selected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 bg-black/50'
          )}>
            {selected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
          </div>
        </div>
        
        {/* Game type badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
          {replay.gameType.toUpperCase()}
        </div>
        
        {/* Duration */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
          {formatDuration(replay.duration)}
        </div>
      </div>
      
      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{replay.mapName}</h3>
            <p className="text-sm text-gray-400 truncate">
              {replay.teams.map(t => t.name).join(' vs ')}
            </p>
          </div>
          
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-white"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 py-1">
                  <button
                    onClick={() => { onExport(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Meta */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(replay.timestamp)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatFileSize(replay.compressedSize || replay.fileSize)}
          </span>
        </div>
        
        {/* Tags */}
        {replay.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {replay.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300"
              >
                {tag}
              </span>
            ))}
            {replay.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-gray-500">
                +{replay.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Replay List Item
// ============================================================================

interface ReplayListItemProps extends ReplayCardProps {}

function ReplayListItem({
  replay,
  selected,
  isActive,
  onSelect,
  onClick,
  onPlay,
  onDelete,
  onExport,
}: ReplayListItemProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  
  useEffect(() => {
    if (replay.thumbnailId) {
      getThumbnail(replay.id).then(blob => {
        if (blob) {
          setThumbnail(URL.createObjectURL(blob));
        }
      });
    }
  }, [replay.id, replay.thumbnailId]);
  
  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-3 bg-gray-800 rounded-lg transition-all cursor-pointer',
        isActive && 'ring-2 ring-blue-500',
        selected && 'ring-2 ring-blue-400',
        'hover:bg-gray-750'
      )}
    >
      {/* Checkbox */}
      <div 
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
          selected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 hover:border-gray-300'
        )}
      >
        {selected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
      </div>
      
      {/* Thumbnail */}
      <div 
        className="relative w-24 h-14 bg-gray-900 rounded overflow-hidden shrink-0"
        onClick={onClick}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={replay.mapName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Play className="w-6 h-6 text-gray-600" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white truncate">{replay.mapName}</h3>
          <span className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
            {replay.gameType.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-gray-400 truncate">
          {replay.teams.map(t => `${t.name} (${t.score})`).join(' vs ')}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(replay.timestamp)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(replay.duration)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatFileSize(replay.compressedSize || replay.fileSize)}
          </span>
          {replay.tags.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {replay.tags.join(', ')}
            </span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onExport(); }}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ReplayLibrary;
