import React, { useState, useEffect } from 'react';
import { offlineService } from '../services/offlineService';
import './Comments.css';

const Comments = ({ articleId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/news/${articleId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      // Ensure we have an array of comments, even if empty
      setComments(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.message);
      setComments([]); // Set empty array on error
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentData = {
      text: newComment,
      createdAt: new Date().toISOString()
    };

    const action = {
      url: `http://localhost:5000/api/news/${articleId}/comment`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: commentData
    };

    try {
      if (!navigator.onLine) {
        // Queue the action for background sync
        const queued = await offlineService.queueAction(action);
        if (queued) {
          // Update UI optimistically
          setComments(prev => [...prev, { ...commentData, _id: Date.now() }]);
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
        setComments(prev => [...prev, data]);
      }
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading comments...</div>;
  if (error) return <div className="error">Error: {error}</div>;

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