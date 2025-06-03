import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsDB } from './services/db';
import { notificationService } from './services/notificationService';
import SearchSuggestions from './components/SearchSuggestions';
import './News.css';

const News = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categories = [
    { id: 'all', name: 'All', color: 'bg-blue-500' },
    { id: 'technology', name: 'Technology', color: 'bg-purple-500' },
    { id: 'business', name: 'Business', color: 'bg-green-500' },
    { id: 'sports', name: 'Sports', color: 'bg-orange-500' },
    { id: 'health', name: 'Health', color: 'bg-red-500' },
    { id: 'entertainment', name: 'Entertainment', color: 'bg-teal-500' }
  ];

  // Debounced search function
  const debouncedSearch = useCallback((term) => {
    if (!term.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const searchTermLower = term.toLowerCase();
    const suggestions = newsData.filter(article => 
      article.title.toLowerCase().includes(searchTermLower) ||
      article.category.toLowerCase().includes(searchTermLower)
    ).slice(0, 5); // Limit to 5 suggestions

    setSearchSuggestions(suggestions);
  }, [newsData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    // Initialize IndexedDB and request notification permission
    const initServices = async () => {
      try {
        await newsDB.init();
        
        // Initialize notification service
        const isSupported = await notificationService.init();
        if (isSupported) {
          const hasPermission = await notificationService.requestPermission();
          if (hasPermission) {
            await notificationService.subscribeToPush();
          }
        }
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initServices();

    // Handle online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        if (isOffline) {
          // Load from IndexedDB when offline
          const cachedArticles = await newsDB.getAllArticles();
          setNewsData(cachedArticles);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/news${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        
        if (!data.news || !Array.isArray(data.news)) {
          throw new Error('Invalid data format received from server');
        }
        
        // Cache the articles in IndexedDB
        await newsDB.saveArticles(data.news);
        
        setNewsData(data.news);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNews();
  }, [selectedCategory, isOffline]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (article) => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  const handleSuggestionClose = () => {
    setShowSuggestions(false);
  };

  // Filter news by search only (category filtering is now handled by the API)
  const filteredNews = Array.isArray(newsData) ? newsData.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const featuredNews = Array.isArray(newsData) ? newsData.filter(article => article.featured) : [];
  const regularNews = filteredNews.filter(article => !article.featured);

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'bg-gray-500';
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleArticleClick = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="news-container">
      {isOffline && (
        <div className="offline-banner">
          You are currently offline. Showing cached content.
        </div>
      )}
      
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search news..."
          className="search-input"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && (
          <SearchSuggestions
            suggestions={searchSuggestions}
            onSelect={handleSuggestionSelect}
            onClose={handleSuggestionClose}
          />
        )}
      </div>

      {/* Category Filter */}
      <div className="categories-container">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Featured News */}
      {selectedCategory === 'all' && featuredNews.length > 0 && (
        <div className="featured-news">
          <h2>Featured News</h2>
          <div className="featured-grid">
            {featuredNews.map(article => (
              <div 
                key={article._id} 
                className="news-card featured"
                onClick={() => handleArticleClick(article._id)}
              >
                <img src={article.image} alt={article.title} />
                <div className="news-content">
                  <span className={`category-tag ${getCategoryColor(article.category)}`}>
                    {categories.find(c => c.id === article.category)?.name}
                  </span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div className="article-meta">
                    <span className="author">By {article.author}</span>
                    <span className="date">
                      {new Date(article.publishTime).toLocaleDateString()}
                    </span>
                    <span className="read-time">{article.readTime}</span>
                    <span className="views">{article.views} views</span>
                    <span className="likes">{article.likes} likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular News */}
      <div className="regular-news">
        <h2>{selectedCategory === 'all' ? 'Latest News' : `${categories.find(c => c.id === selectedCategory)?.name} News`}</h2>
        <div className="news-grid">
          {regularNews.map(article => (
            <div 
              key={article._id} 
              className="news-card"
              onClick={() => handleArticleClick(article._id)}
            >
              <img src={article.image} alt={article.title} />
              <div className="news-content">
                <span className={`category-tag ${getCategoryColor(article.category)}`}>
                  {categories.find(c => c.id === article.category)?.name}
                </span>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <div className="article-meta">
                  <span className="author">By {article.author}</span>
                  <span className="date">
                    {new Date(article.publishTime).toLocaleDateString()}
                  </span>
                  <span className="read-time">{article.readTime}</span>
                  <span className="views">{article.views} views</span>
                  <span className="likes">{article.likes} likes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default News; 