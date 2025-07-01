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
        const offlineInitialized = await offlineService.init();
        if (!offlineInitialized) {
          console.warn('Offline service initialization failed');
        }
      } catch (err) {
        console.error('Error initializing services:', err);
      }
    };

    initServices();

    // Handle online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      // Re-initialize offline service when coming back online
      offlineService.init().catch(err => {
        console.error('Error re-initializing offline service:', err);
      });
    };
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
      setLoading(true); // Set loading to true at the start of fetch
      setError(null); // Clear previous errors

      try {
        // Reset view tracking when article ID changes
        viewTracked.current = false;

        // Ensure database is initialized
        if (!newsDB.db) {
          await newsDB.init();
        }

        let fetchedArticle = null;
        let fetchError = null;

        if (navigator.onLine) {
          try {
            // Attempt to fetch from network first when online
            console.log('Attempting to fetch article from network...');
            const response = await fetch(`/api/news/${id}`);
            const data = await response.json();

            if (!response.ok) {
              fetchError = data.message || 'Failed to fetch article from network';
              console.error('Network fetch failed:', fetchError);
            } else {
              fetchedArticle = data;
              // Cache the article in IndexedDB
              await newsDB.saveArticle(fetchedArticle);
              console.log('Article fetched from network and cached.');
            }
          } catch (err) {
            fetchError = 'Network request failed: ' + err.message;
            console.error('Network request failed:', err);
          }
        }

        if (!fetchedArticle) {
          // If network fetch failed or offline, try to load from IndexedDB
          console.log('Attempting to load article from cache...');
          const cachedArticle = await newsDB.getArticle(id);
          if (cachedArticle) {
            fetchedArticle = cachedArticle;
            console.log('Article loaded from cache.');
          } else if (fetchError) {
            // If there was a network error and no cache, set the network error
            setError(fetchError);
          } else {
            // If offline and no cache
            setError('Article not available offline.');
          }
        }

        if (fetchedArticle) {
          setArticle(fetchedArticle);

          // Check if article was liked (use latest state if available, otherwise cached)
          const isLiked = await newsDB.isArticleLiked(id);
          setLiked(isLiked);

          // Track view only if online and it hasn't been tracked yet
          if (navigator.onLine && !viewTracked.current) {
            try {
              const viewResponse = await fetch(`/api/news/${id}/view`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              });

              if (viewResponse.ok) {
                const viewData = await viewResponse.json();
                // Update the article's view count optimistically or from response
                setArticle(prev => ({
                  ...prev,
                  views: viewData.views !== undefined ? viewData.views : (prev?.views || 0) + 1 // Optimistic update fallback
                }));
                viewTracked.current = true;
                console.log('View tracked successfully.');
              } else {
                 console.warn('Failed to track view, status:', viewResponse.status);
              }
            } catch (err) {
              console.error('Error tracking view:', err);
            }
          }
        }

        setLoading(false);

      } catch (err) {
        console.error('Error during article fetch process:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]); // Removed isOffline from dependency array to trigger fetch on ID change regardless of offline state

  const handleLike = async () => {
    try {
      const endpoint = liked ? 'unlike' : 'like';
      const action = {
        url: `/api/news/${id}/${endpoint}`,
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