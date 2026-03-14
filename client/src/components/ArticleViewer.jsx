import React, { useEffect, useState } from 'react';
import { getArticleById, getArticles } from '../services/api';
import { BookOpen, Clock, Tag, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const ArticleViewer = ({ articleId, onClose }) => {
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const data = await getArticleById(articleId);
      setArticle(data);

      // Increment view count
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const token = JSON.parse(localStorage.getItem('smartfin_auth'))?.token;
        await axios.post(
          `${API_BASE_URL}/education/articles/${articleId}/view`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Error incrementing view count:', err);
      }

      // Load related articles
      if (data.category) {
        const related = await getArticles({ category: data.category, limit: 3 });
        setRelatedArticles((related.articles || []).filter(a => a._id !== articleId));
      }
    } catch (err) {
      console.error('Error loading article:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-400">Article not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Education
        </button>
      )}

      {/* Article Header */}
      <div className="card">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="text-emerald-400" size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50 mb-2">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 capitalize">
                {article.category}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 capitalize">
                {article.difficulty}
              </span>
              {article.readingTimeMinutes && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} />
                  {article.readingTimeMinutes} min read
                </div>
              )}
              {article.author && (
                <span className="text-xs text-slate-500">by {article.author}</span>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Tag className="text-slate-500" size={14} />
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-lg bg-slate-900 text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <div
            className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="card">
          <p className="text-sm font-semibold text-slate-200 mb-4">Related Articles</p>
          <div className="space-y-3">
            {relatedArticles.map((related) => (
              <div
                key={related._id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 hover:border-emerald-500/30 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/education/article/${related._id}`}
              >
                <p className="text-sm font-medium text-slate-200 mb-1">{related.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 capitalize">
                    {related.category}
                  </span>
                  {related.readingTimeMinutes && (
                    <span className="text-xs text-slate-500">
                      {related.readingTimeMinutes} min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleViewer;
