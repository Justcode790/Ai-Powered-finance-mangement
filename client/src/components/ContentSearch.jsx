import React, { useState, useEffect, useCallback } from 'react';
import { getArticles } from '../services/api';
import { Search, Filter, BookOpen, Clock } from 'lucide-react';

const ContentSearch = ({ onArticleSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['all', 'budgeting', 'saving', 'investing', 'debt', 'income', 'planning'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Date' },
    { value: 'popularity', label: 'Popularity' }
  ];

  // Debounced search
  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 20 };
      
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (sortBy !== 'relevance') params.sort = sortBy;

      const data = await getArticles(params);
      setResults(data.articles || []);
    } catch (err) {
      console.error('Error searching:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [performSearch]);

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, idx) =>
      regex.test(part) ? (
        <mark key={idx} className="bg-emerald-500/20 text-emerald-300">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search articles, tips, and modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Filter size={14} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <p className="text-xs text-slate-500">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          results.map((article) => (
            <div
              key={article._id}
              onClick={() => onArticleSelect && onArticleSelect(article._id)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <BookOpen className="text-emerald-400 flex-shrink-0 mt-1" size={18} />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">
                    {searchQuery ? highlightText(article.title, searchQuery) : article.title}
                  </h3>
                  
                  {article.snippet && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                      {searchQuery ? highlightText(article.snippet, searchQuery) : article.snippet}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 capitalize">
                      {article.category}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 capitalize">
                      {article.difficulty}
                    </span>
                    {article.readingTimeMinutes && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={12} />
                        {article.readingTimeMinutes} min
                      </div>
                    )}
                    {article.viewCount > 0 && (
                      <span className="text-xs text-slate-500">
                        {article.viewCount} views
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400 mb-3">No results found</p>
            {searchQuery && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Try these suggestions:</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {['budgeting', 'saving', 'investing'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(suggestion);
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentSearch;
