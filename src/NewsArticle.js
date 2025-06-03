import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newsDB } from './services/db';
import { offlineService } from './services/offlineService';
import Comments from './components/Comments';
import './NewsArticle.css';

const NewsArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const viewTracked = useRef(false);

  useEffect(() => {
    // Initialize IndexedDB and offline service
    const initServices = async () => {
      try {
        await newsDB.init();
        await offlineService.init();
      } catch (err) {
        console.error('Error initializing services:', err);
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
    const fetchArticle = async () => {
      try {
        // Reset view tracking when article ID changes
        viewTracked.current = false;
        
        // Ensure database is initialized
        if (!newsDB.db) {
          await newsDB.init();
        }

        if (isOffline) {
          // Load from IndexedDB when offline
          const cachedArticle = await newsDB.getArticle(id);
          if (cachedArticle) {
            setArticle(cachedArticle);
            // Check if article was liked
            const isLiked = await newsDB.isArticleLiked(id);
            setLiked(isLiked);
            setLoading(false);
            return;
          }
          throw new Error('Article not available offline');
        }

        const response = await fetch(`http://localhost:5000/api/news/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch article');
        }
        
        // Cache the article in IndexedDB
        await newsDB.saveArticle(data);
        
        // Check if article was liked
        const isLiked = await newsDB.isArticleLiked(id);
        setLiked(isLiked);
        
        setArticle(data);
        setLoading(false);

        // Track view only if it hasn't been tracked yet
        if (navigator.onLine && !viewTracked.current) {
          try {
            const viewResponse = await fetch(`http://localhost:5000/api/news/${id}/view`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            if (viewResponse.ok) {
              const viewData = await viewResponse.json();
              // Update the article's view count
              setArticle(prev => ({
                ...prev,
                views: viewData.views
              }));
              viewTracked.current = true;
            }
          } catch (err) {
            console.error('Error tracking view:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, isOffline]);

  const handleLike = async () => {
    try {
      const endpoint = liked ? 'unlike' : 'like';
      const action = {
        url: `http://localhost:5000/api/news/${id}/${endpoint}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (!navigator.onLine) {
        // Queue the action for background sync
        const queued = await offlineService.queueAction(action);
        if (queued) {
          // Update UI optimistically
          setArticle(prev => ({
            ...prev,
            likes: liked ? prev.likes - 1 : prev.likes + 1
          }));
          setLiked(!liked);
          return;
        }
      }

      // If online, proceed with the request
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      setArticle(prev => ({
        ...prev,
        likes: data.likes
      }));

      // Update liked state in IndexedDB
      if (liked) {
        await newsDB.removeLikedArticle(id);
      } else {
        await newsDB.saveLikedArticle(id);
      }

      setLiked(!liked);
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={() => navigate('/')}>Back to News</button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="error-container">
        <p>Article not found</p>
        <button onClick={() => navigate('/')}>Back to News</button>
      </div>
    );
  }

  return (
    <div className="article-container">
      {isOffline && (
        <div className="offline-banner">
          You are currently offline. Showing cached content.
        </div>
      )}
      
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to News
      </button>
      
      <article className="article-content">
        <div className="article-header">
          <span className={`category-tag ${article.category}`}>
            {article.category}
          </span>
          <h1>{article.title}</h1>
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

        <img 
          src={article.image} 
          alt={article.title} 
          className="article-image"
        />

        <div className="article-body">
          {article.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="article-actions">
          <button 
            className={`like-button ${liked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            {liked ? '❤️ Liked' : '🤍 Like'}
          </button>
        </div>
      </article>

      {/* Comments Section */}
      <Comments articleId={id} />
    </div>
  );
};

export default NewsArticle; 