const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const News = require('../models/News');
const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');

// @route   GET api/news
// @desc    Get all news articles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const category = req.query.category;
    const search = req.query.search;

    let query = {};
    if (category) {
      query.category = category.toLowerCase();
    }
    if (search) {
      query.$text = { $search: search };
    }

    const news = await News.find(query)
      .sort({ createdAt: -1 });

    res.json({
      news,
      totalNews: news.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/news/featured
// @desc    Get featured news articles
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredNews = await News.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(featuredNews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/news/category/:category
// @desc    Get news articles by category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const news = await News.find({ category: req.params.category })
      .sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/news/:id
// @desc    Get news article by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching article with ID:', id);
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ID format:', id);
      return res.status(400).json({ message: 'Invalid article ID format' });
    }

    console.log('Attempting to find article in database...');
    const news = await News.findById(id);
    console.log('Database query result:', news ? 'Article found' : 'Article not found');

    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    res.json(news);
  } catch (err) {
    console.error('Detailed error in GET /:id:', {
      error: err,
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      message: 'Error fetching article',
      error: err.message,
      type: err.name
    });
  }
});

// @route   GET api/news/:id/comments
// @desc    Get comments for a news article
// @access  Public
router.get('/:id/comments', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Sort comments by date, newest first
    const sortedComments = news.comments.sort((a, b) => b.createdAt - a.createdAt);
    res.json(sortedComments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/news
// @desc    Create a news article
// @access  Private (Author/Admin only)
router.post('/', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('excerpt', 'Excerpt is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('image', 'Image URL is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, excerpt, content, category, image, featured } = req.body;

    const news = new News({
      title,
      excerpt,
      content,
      category,
      image,
      featured: featured || false,
      author: req.user.id,
      publishTime: new Date().toISOString(),
      readTime: '5 min', // You might want to calculate this based on content length
      views: 0,
      likes: 0
    });

    const newNews = await news.save();

    // Send push notification to all subscribers
    try {
      await notificationService.sendNotification(
        'New Article Published',
        title,
        `${process.env.FRONTEND_URL || 'https://skii36.io.vn'}/news/${newNews._id}`
      );
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json(newNews);
  } catch (err) {
    console.error('Error creating news:', err);
    res.status(400).json({ message: err.message });
  }
});

// @route   PUT api/news/:id
// @desc    Update a news article
// @access  Private (Author/Admin only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Check if user is the author or admin
    if (news.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    Object.keys(req.body).forEach(key => {
      news[key] = req.body[key];
    });

    const updatedNews = await news.save();
    res.json(updatedNews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE api/news/:id
// @desc    Delete a news article
// @access  Private (Author/Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Check if user is the author or admin
    if (news.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await news.remove();
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/news/:id/view
// @desc    Increment views for a news article
// @access  Private
router.post('/:id/view', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    news.views += 1;
    await news.save();
    res.json({ views: news.views });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/news/:id/like
// @desc    Like/Unlike a news article
// @access  Public
router.post('/:id/like', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Increment likes
    news.likes += 1;
    await news.save();

    res.json({ likes: news.likes });
  } catch (err) {
    console.error('Error updating likes:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/news/:id/unlike
// @desc    Unlike a news article
// @access  Public
router.post('/:id/unlike', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Decrement likes (but not below 0)
    if (news.likes > 0) {
      news.likes -= 1;
      await news.save();
    }

    res.json({ likes: news.likes });
  } catch (err) {
    console.error('Error updating likes:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/news/:id/comment
// @desc    Add a comment to a news article
// @access  Public
router.post('/:id/comment', [
  check('text', 'Comment text is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    const newComment = {
      text: req.body.text,
      createdAt: new Date()
    };

    news.comments.push(newComment);
    await news.save();

    res.json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/news/health
// @desc    Check database connection health
// @access  Public
router.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      status: 'ok',
      database: {
        state: states[state],
        readyState: state
      }
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

module.exports = router;