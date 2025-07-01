const mongoose = require('mongoose');
const News = require('../models/News');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Validate category
const validCategories = ['technology', 'business', 'sports', 'health', 'entertainment'];

// Create article function
const createArticle = async (articleData) => {
  try {
    // Validate category
    if (!validCategories.includes(articleData.category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    const article = new News({
      title: articleData.title,
      excerpt: articleData.excerpt,
      content: articleData.content,
      category: articleData.category,
      image: articleData.image,
      featured: articleData.featured || false,
      author: articleData.author,
      publishTime: new Date().toISOString(),
      readTime: articleData.readTime || '5 min',
      views: 0,
      likes: 0
    });

    const savedArticle = await article.save();
    console.log('Article created successfully:', savedArticle);
    process.exit(0);
  } catch (error) {
    console.error('Error creating article:', error);
    process.exit(1);
  }
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const articleData = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    articleData[key] = value;
  }

  // Validate required fields
  const requiredFields = ['title', 'excerpt', 'content', 'category', 'image', 'author'];
  const missingFields = requiredFields.filter(field => !articleData[field]);

  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields.join(', '));
    console.log('\nUsage: node createArticle.js --title "Article Title" --excerpt "Article excerpt" --content "Article content" --category "technology" --image "image-url" --author "author-id" [--featured true/false] [--readTime "5 min"]');
    process.exit(1);
  }

  return articleData;
};

// Run the script
const articleData = parseArgs();
createArticle(articleData); 