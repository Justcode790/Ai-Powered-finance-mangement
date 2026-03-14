import React, { useEffect, useState } from 'react';
import { getRecommendations, getLearningProgress, getArticles } from '../services/api';
import { BookOpen, TrendingUp, Award, Search } from 'lucide-react';

const EducationDashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [progress, setProgress] = useState(null);
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'budgeting', 'saving', 'investing', 'debt', 'income', 'planning'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [recsData, progressData] = await Promise.all([
        getRecommendations(),
        getLearningProgress()
      ]);
      setRecommendations(recsData.recommendations || []);
      setProgress(progressData);
    } catch (err) {
      console.error('Error loading education data:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchArticles = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      params.limit = 10;

      const data = await getArticles(params);
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error searching articles:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    searchArticles();
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading education content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
          Financial Education
        </h2>
        <p className="text-xs md:text-sm text-gray-600">
          Learn better money habits with personalized content and interactive modules.
        </p>
      </div>

      {/* Learning Progress */}
      {progress && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-green-600" size={20} />
            <p className="text-sm font-semibold text-gray-900">Your Learning Progress</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Modules Completed</p>
              <p className="text-2xl font-semibold text-green-600">
                {progress.completedModules?.length || 0}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Overall Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {progress.overallProgress || 0}%
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Last Activity</p>
              <p className="text-sm text-gray-700">
                {progress.lastActivityDate
                  ? new Date(progress.lastActivityDate).toLocaleDateString()
                  : 'No activity yet'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-blue-600" size={20} />
            <p className="text-sm font-semibold text-gray-900">Recommended for You</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((item) => (
              <div
                key={item._id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 capitalize">
                    {item.difficulty || item.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {item.content || item.description}
                </p>
                {item.readingTimeMinutes && (
                  <p className="text-xs text-gray-500 mt-2">
                    {item.readingTimeMinutes} min read
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Search className="text-blue-600" size={20} />
          <p className="text-sm font-semibold text-gray-900">Explore Content</p>
        </div>

        <div className="space-y-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search articles, tips, and modules..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-600 mb-2 block font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-600 mb-2 block font-medium">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-3 mt-4">
            {articles.length > 0 ? (
              articles.map((article) => (
                <div
                  key={article._id}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 rounded-lg bg-gray-200 text-gray-700 capitalize">
                          {article.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 capitalize">
                          {article.difficulty}
                        </span>
                        {article.readingTimeMinutes && (
                          <span className="text-xs text-gray-500">
                            {article.readingTimeMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <BookOpen className="text-gray-400" size={16} />
                  </div>
                  {article.snippet && (
                    <p className="text-xs text-gray-600 line-clamp-2">{article.snippet}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600 text-center py-8">
                No articles found. Try adjusting your search or filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationDashboard;
