import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import News from './News';
import NewsArticle from './NewsArticle';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<News />} />
          <Route path="/article/:id" element={<NewsArticle />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
