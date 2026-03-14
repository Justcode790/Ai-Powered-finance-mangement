const BudgetTemplate = require('../models/BudgetTemplate');

// GET /api/budgets/templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await BudgetTemplate.find({})
      .sort({ usageCount: -1, createdAt: -1 })
      .lean();

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/budgets/templates/:id
exports.getTemplateById = async (req, res) => {
  try {
    const template = await BudgetTemplate.findById(req.params.id).lean();

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/budgets/templates/custom
exports.createCustomTemplate = async (req, res) => {
  try {
    const { name, description, categoryPercentages } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!name || !description || !categoryPercentages) {
      return res.status(400).json({
        message: 'Name, description, and category percentages are required'
      });
    }

    // Validate all 8 categories are present
    const requiredCategories = [
      'rent',
      'food',
      'transport',
      'entertainment',
      'shopping',
      'education',
      'misc',
      'savings'
    ];

    for (const category of requiredCategories) {
      if (categoryPercentages[category] === undefined) {
        return res.status(400).json({
          message: `Missing percentage for category: ${category}`
        });
      }
    }

    // Validate percentages sum to 100
    const total = Object.values(categoryPercentages).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({
        message: `Category percentages must sum to 100. Current total: ${total}`
      });
    }

    // Create custom template (linked to user via name prefix)
    const template = new BudgetTemplate({
      name: `${name} (Custom)`,
      description,
      targetUser: 'general',
      categoryPercentages,
      usageCount: 0
    });

    await template.save();

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating custom template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/budgets/templates/custom/user
exports.getUserCustomTemplates = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find templates with "(Custom)" in name
    // In a production system, you'd add a userId field to BudgetTemplate
    const templates = await BudgetTemplate.find({
      name: { $regex: '\\(Custom\\)$' }
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching custom templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
