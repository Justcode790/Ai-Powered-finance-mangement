const Article = require('../models/Article');
const Tip = require('../models/Tip');
const Module = require('../models/Module');
const ModuleProgress = require('../models/ModuleProgress');
const User = require('../models/User');
const { generateRecommendations } = require('../services/recommendationService');
const { getContextualTip, markTipHelpful } = require('../services/tipService');

// GET /api/education/articles
exports.getArticles = async (req, res) => {
  try {
    const { category, difficulty, search, limit = 20, sort = 'recent' } = req.query;

    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    let sortOption = { createdAt: -1 }; // default: recent
    
    if (search) {
      query.$text = { $search: search };
      sortOption = { score: { $meta: 'textScore' } }; // relevance for search
    } else if (sort === 'popular') {
      sortOption = { viewCount: -1 };
    } else if (sort === 'date') {
      sortOption = { createdAt: -1 };
    }

    let articles = await Article.find(query)
      .limit(parseInt(limit))
      .sort(sortOption)
      .lean();

    // Add search snippets with highlighted terms if searching
    if (search) {
      articles = articles.map(article => {
        const snippet = generateSnippet(article.content, search);
        return { ...article, snippet };
      });
    }

    res.json({ articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to generate search snippet with highlighted terms
function generateSnippet(content, searchTerm, maxLength = 200) {
  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerContent.indexOf(lowerTerm);
  
  if (index === -1) {
    return content.substring(0, maxLength) + '...';
  }
  
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + searchTerm.length + 150);
  let snippet = content.substring(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  
  // Highlight the search term (case-insensitive)
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  snippet = snippet.replace(regex, '<mark>$1</mark>');
  
  return snippet;
}

// GET /api/education/articles/:id
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/education/tips
exports.getTips = async (req, res) => {
  try {
    const { category, context } = req.query;

    const query = {};
    if (category) query.category = category;
    if (context) query.context = context;

    const tips = await Tip.find(query)
      .sort({ priority: -1 })
      .limit(10)
      .lean();

    res.json({ tips });
  } catch (error) {
    console.error('Error fetching tips:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/education/modules
exports.getModules = async (req, res) => {
  try {
    const { difficulty } = req.query;

    const query = {};
    if (difficulty) query.difficulty = difficulty;

    const modules = await Module.find(query)
      .sort({ difficulty: 1, createdAt: -1 })
      .lean();

    res.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/education/modules/:id
exports.getModuleById = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).lean();
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Get user's progress for this module if authenticated
    if (req.userId) {
      const progress = await ModuleProgress.findOne({
        userId: req.userId,
        moduleId: req.params.id
      }).lean();

      module.userProgress = progress;
    }

    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/education/modules/:id/progress
exports.updateModuleProgress = async (req, res) => {
  try {
    const { lessonId, completed, quizScore } = req.body;
    const moduleId = req.params.id;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get the module to calculate progress
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Find or create progress record
    let progress = await ModuleProgress.findOne({ userId, moduleId });
    
    if (!progress) {
      progress = new ModuleProgress({
        userId,
        moduleId,
        startedAt: new Date()
      });
    }

    // Update lesson completion
    if (completed && lessonId && !progress.lessonsCompleted.includes(lessonId)) {
      progress.lessonsCompleted.push(lessonId);
    }

    // Update quiz score
    if (quizScore !== undefined && lessonId) {
      const existingScoreIndex = progress.quizScores.findIndex(
        (s) => s.lessonId === lessonId
      );
      
      if (existingScoreIndex >= 0) {
        progress.quizScores[existingScoreIndex].score = quizScore;
        progress.quizScores[existingScoreIndex].completedAt = new Date();
      } else {
        progress.quizScores.push({
          lessonId,
          score: quizScore,
          completedAt: new Date()
        });
      }

      // Update user's financial literacy score if quiz score > 80%
      if (quizScore > 80) {
        const user = await User.findById(userId);
        if (user && user.financial_literacy_score < 10) {
          user.financial_literacy_score = Math.min(
            10,
            (user.financial_literacy_score || 5) + 0.5
          );
          await user.save();
        }
      }
    }

    // Calculate overall progress
    const totalLessons = module.lessons.length;
    progress.overallProgress = totalLessons > 0
      ? Math.round((progress.lessonsCompleted.length / totalLessons) * 100)
      : 0;

    // Mark module as completed if all lessons are done
    if (progress.overallProgress === 100 && !progress.completedAt) {
      progress.completedAt = new Date();

      // Update user's learning progress
      const user = await User.findById(userId);
      if (user) {
        if (!user.learningProgress) {
          user.learningProgress = {
            completedModules: [],
            totalModulesCompleted: 0
          };
        }
        
        if (!user.learningProgress.completedModules.includes(moduleId)) {
          user.learningProgress.completedModules.push(moduleId);
          user.learningProgress.totalModulesCompleted += 1;
        }
        
        user.learningProgress.lastActivityDate = new Date();
        await user.save();
      }
    }

    await progress.save();

    res.json({ progress });
  } catch (error) {
    console.error('Error updating module progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/education/progress
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId)
      .select('learningProgress')
      .lean();

    const progressRecords = await ModuleProgress.find({ userId })
      .populate('moduleId', 'title category difficulty')
      .lean();

    res.json({
      learningProgress: user?.learningProgress || {
        completedModules: [],
        totalModulesCompleted: 0
      },
      moduleProgress: progressRecords
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/education/search
exports.searchContent = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = { $text: { $search: q } };

    const [articles, modules] = await Promise.all([
      Article.find(searchQuery)
        .limit(parseInt(limit))
        .sort({ score: { $meta: 'textScore' } })
        .select('title category difficulty readingTimeMinutes')
        .lean(),
      Module.find(searchQuery)
        .limit(parseInt(limit))
        .sort({ score: { $meta: 'textScore' } })
        .select('title category difficulty estimatedHours')
        .lean()
    ]);

    const results = [
      ...articles.map(a => ({ ...a, type: 'article' })),
      ...modules.map(m => ({ ...m, type: 'module' }))
    ];

    // If no results, provide suggestions
    let suggestions = [];
    if (results.length === 0) {
      const allCategories = ['budgeting', 'saving', 'investing', 'debt', 'income', 'planning'];
      suggestions = allCategories.map(cat => `Try searching for "${cat}"`);
    }

    res.json({
      results,
      count: results.length,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/education/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const recommendations = await generateRecommendations(userId);

    res.json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/education/tips/contextual
exports.getContextualTip = async (req, res) => {
  try {
    const userId = req.userId;
    const { context, category } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!context) {
      return res.status(400).json({ message: 'Context is required' });
    }

    const tip = await getContextualTip(userId, context, category);

    if (!tip) {
      return res.json({ tip: null, message: 'No tips available at this time' });
    }

    res.json({ tip });
  } catch (error) {
    console.error('Error fetching contextual tip:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/education/tips/:id/helpful
exports.markTipAsHelpful = async (req, res) => {
  try {
    const userId = req.userId;
    const tipId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const success = await markTipHelpful(userId, tipId);

    if (success) {
      res.json({ message: 'Tip marked as helpful' });
    } else {
      res.status(500).json({ message: 'Failed to mark tip as helpful' });
    }
  } catch (error) {
    console.error('Error marking tip helpful:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
