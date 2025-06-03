const DB_NAME = 'newsAppDB';
const DB_VERSION = 2;
const STORE_NAME = 'articles';
const LIKED_ARTICLES_STORE = 'likedArticles';

class NewsDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: '_id' });
        }
        if (!db.objectStoreNames.contains(LIKED_ARTICLES_STORE)) {
          db.createObjectStore(LIKED_ARTICLES_STORE, { keyPath: 'articleId' });
        }
      };
    });
  }

  async saveArticle(article) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(article);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getArticle(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveArticles(articles) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      articles.forEach(article => {
        store.put(article);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllArticles() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveLikedArticle(articleId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([LIKED_ARTICLES_STORE], 'readwrite');
      const store = transaction.objectStore(LIKED_ARTICLES_STORE);
      const request = store.put({ articleId, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeLikedArticle(articleId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([LIKED_ARTICLES_STORE], 'readwrite');
      const store = transaction.objectStore(LIKED_ARTICLES_STORE);
      const request = store.delete(articleId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async isArticleLiked(articleId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([LIKED_ARTICLES_STORE], 'readonly');
      const store = transaction.objectStore(LIKED_ARTICLES_STORE);
      const request = store.get(articleId);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const newsDB = new NewsDB(); 