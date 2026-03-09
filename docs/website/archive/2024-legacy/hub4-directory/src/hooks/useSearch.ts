import { useState, useMemo, useCallback } from 'react';
import { Service } from '../data/services';

interface UseSearchOptions {
  services: Service[];
  debounceMs?: number;
}

interface SearchResult {
  service: Service;
  score: number;
  matches: {
    name: boolean;
    description: boolean;
    category: boolean;
    features: boolean;
  };
}

export function useSearch({ services, debounceMs = 150 }: UseSearchOptions) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Debounce search query
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(value.toLowerCase().trim());
    }, debounceMs);
  }, [debounceMs]);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedCategories(new Set());
  }, []);

  // Calculate relevance score for a service
  const calculateScore = useCallback((service: Service, searchQuery: string): SearchResult | null => {
    if (!searchQuery) {
      return {
        service,
        score: service.popularity,
        matches: { name: false, description: false, category: false, features: false },
      };
    }

    let score = 0;
    const matches = {
      name: false,
      description: false,
      category: false,
      features: false,
    };

    const nameLower = service.name.toLowerCase();
    const descLower = service.description.toLowerCase();
    const catLower = service.category.toLowerCase();

    // Name match (highest weight)
    if (nameLower.includes(searchQuery)) {
      score += 100;
      matches.name = true;
      if (nameLower === searchQuery) score += 50;
      if (nameLower.startsWith(searchQuery)) score += 25;
    }

    // Description match
    if (descLower.includes(searchQuery)) {
      score += 30;
      matches.description = true;
    }

    // Category match
    if (catLower.includes(searchQuery)) {
      score += 20;
      matches.category = true;
    }

    // Features match
    if (service.features?.some(f => f.toLowerCase().includes(searchQuery))) {
      score += 15;
      matches.features = true;
    }

    if (score === 0) return null;

    // Boost by popularity
    score += service.popularity * 0.1;

    return { service, score, matches };
  }, []);

  const results = useMemo(() => {
    let filtered = services;

    // Filter by categories
    if (selectedCategories.size > 0) {
      filtered = filtered.filter((s) => selectedCategories.has(s.category));
    }

    // Search and score
    if (debouncedQuery) {
      const scored = filtered
        .map((s) => calculateScore(s, debouncedQuery))
        .filter((r): r is SearchResult => r !== null)
        .sort((a, b) => b.score - a.score);
      
      return scored;
    }

    // Sort by popularity if no search
    return filtered
      .sort((a, b) => b.popularity - a.popularity)
      .map((service) => ({
        service,
        score: service.popularity,
        matches: { name: false, description: false, category: false, features: false },
      }));
  }, [services, debouncedQuery, selectedCategories, calculateScore]);

  return {
    query,
    setQuery: handleQueryChange,
    debouncedQuery,
    selectedCategories,
    toggleCategory,
    clearFilters,
    results,
    hasActiveFilters: debouncedQuery > '' || selectedCategories.size > 0,
  };
}

// Import React at the top for useRef
import * as React from 'react';
