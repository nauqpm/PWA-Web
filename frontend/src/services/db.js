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

      request.onerror = () => {
        console.error('Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: '_id' });
        }
        if (!db.objectStoreNames.contains(LIKED_ARTICLES_STORE)) {
          db.createObjectStore(LIKED_ARTICLES_STORE, { keyPath: 'articleId' });
        }
        if (!db.objectStoreNames.contains('comments')) {
          db.createObjectStore('comments', { keyPath: 'articleId' });
        }
        if (!db.objectStoreNames.contains('offlineActions')) {
          db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async saveArticle(article) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(article);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getArticle(id) {
    if (!this.db) await this.init();
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
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([LIKED_ARTICLES_STORE], 'readwrite');
      const store = transaction.objectStore(LIKED_ARTICLES_STORE);
      const request = store.put({ articleId, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeLikedArticle(articleId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([LIKED_ARTICLES_STORE], 'readwrite');
      const store = transaction.objectStore(LIKED_ARTICLES_STORE);
      const request = store.delete(articleId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async isArticleLiked(articleId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([LIKED_ARTICLES_STORE], 'readonly');
      const store = transaction.objectStore(LIKED_ARTICLES_STORE);
      const request = store.get(articleId);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveComments(articleId, comments) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['comments'], 'readwrite');
      const store = transaction.objectStore('comments');
      const request = store.put({ articleId, comments, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getComments(articleId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['comments'], 'readonly');
      const store = transaction.objectStore('comments');
      const request = store.get(articleId);

      request.onsuccess = () => resolve(request.result?.comments || []);
      request.onerror = () => reject(request.error);
    });
  }
}

export const newsDB = new NewsDB(); 