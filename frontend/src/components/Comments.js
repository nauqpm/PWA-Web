import React, { useState, useEffect } from 'react';
import { offlineService } from '../services/offlineService';
import { newsDB } from '../services/db';
import './Comments.css';

const Comments = ({ articleId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineServiceInitialized, setOfflineServiceInitialized] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize offline service
        const initialized = await offlineService.init();
        setOfflineServiceInitialized(initialized);
        
        // Initialize newsDB
        await newsDB.init();
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initializeServices();

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
    if (offlineServiceInitialized) {
      fetchComments();
    }
  }, [articleId, offlineServiceInitialized]);

  const fetchComments = async () => {
    try {
      if (isOffline) {
        // Try to get comments from IndexedDB
        const cachedComments = await newsDB.getComments(articleId);
        if (cachedComments) {
          setComments(cachedComments);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`https://skii36.io.vn/api/news/${articleId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      // Ensure we have an array of comments, even if empty
      const commentsArray = Array.isArray(data) ? data : [];
      setComments(commentsArray);
      
      // Cache comments in IndexedDB
      await newsDB.saveComments(articleId, commentsArray);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching comments:', err);
      if (isOffline) {
        // If offline and no cached comments, show empty state
        setComments([]);
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentData = {
      text: newComment,
      createdAt: new Date().toISOString(),
      _id: Date.now().toString() // Temporary ID for offline mode
    };

    const action = {
      url: `https://skii36.io.vn/api/news/${articleId}/comment`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: commentData
    };

    try {
      if (!navigator.onLine) {
        if (!offlineServiceInitialized) {
          throw new Error('Offline service not initialized');
        }
        // Queue the action for background sync
        const queued = await offlineService.queueAction(action);
        if (queued) {
          // Update UI optimistically
          const updatedComments = [...comments, commentData];
          setComments(updatedComments);
          // Cache the updated comments
          await newsDB.saveComments(articleId, updatedComments);
          setNewComment('');
          return;
        }
      }

      // If online, proceed with the request
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: JSON.stringify(action.body)
      });

      if (!response.ok) throw new Error('Failed to post comment');
      
      const data = await response.json();
      // Ensure we have a valid comment object
      if (data && typeof data === 'object') {
        const updatedComments = [...comments, data];
        setComments(updatedComments);
        // Cache the updated comments
        await newsDB.saveComments(articleId, updatedComments);
      }
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      if (!isOffline) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div className="loading">Loading comments...</div>;
  if (error && !isOffline) return <div className="error">Error: {error}</div>;

  return (
    <div className="comments-section">
      <h3>Comments {comments.length > 0 && `(${comments.length})`}</h3>
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          required
        />
        <button type="submit">Post Comment</button>
      </form>
      <div className="comments-list">
        {comments && comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment._id || Date.now()} className="comment">
              <div className="comment-header">
                <span className="comment-author">Anonymous User</span>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="comment-content">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
};

export default Comments; 