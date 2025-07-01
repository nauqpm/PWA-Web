import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchSuggestions.css';

const SearchSuggestions = ({ suggestions, onSelect, onClose }) => {
  const navigate = useNavigate();

  if (!suggestions.length) return null;

  const handleSuggestionClick = (article) => {
    onSelect(article);
    navigate(`/article/${article._id}`);
  };

  return (
    <div className="search-suggestions">
      <div className="suggestions-header">
        <h3>Search Results</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="suggestions-list">
        {suggestions.map(article => (
          <div
            key={article._id}
            className="suggestion-item"
            onClick={() => handleSuggestionClick(article)}
          >
            <div className="suggestion-content">
              <h4>{article.title}</h4>
              <span className={`category-tag ${article.category}`}>
                {article.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchSuggestions; 