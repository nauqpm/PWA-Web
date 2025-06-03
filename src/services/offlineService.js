class OfflineService {
  constructor() {
    this.serviceWorkerRegistration = null;
    this.db = null;
  }

  async init() {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.log('Background Sync is not supported');
      return false;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      // Initialize the database
      await this.openDB();
      return true;
    } catch (error) {
      console.error('Error initializing offline service:', error);
      return false;
    }
  }

  async queueAction(action) {
    if (!navigator.onLine) {
      try {
        // Ensure database is initialized
        if (!this.db) {
          await this.openDB();
        }

        const transaction = this.db.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        return new Promise((resolve, reject) => {
          const request = store.add({
            url: action.url,
            method: action.method,
            headers: action.headers,
            body: action.body,
            timestamp: Date.now()
          });

          request.onsuccess = async () => {
            try {
              // Register for background sync
              await this.serviceWorkerRegistration.sync.register('sync-actions');
              resolve(true);
            } catch (error) {
              console.error('Error registering sync:', error);
              reject(error);
            }
          };

          request.onerror = () => {
            console.error('Error adding action to store:', request.error);
            reject(request.error);
          };

          transaction.oncomplete = () => {
            // Don't close the database here, as we want to keep it open for future operations
          };

          transaction.onerror = () => {
            console.error('Transaction error:', transaction.error);
            reject(transaction.error);
          };
        });
      } catch (error) {
        console.error('Error queueing action:', error);
        return false;
      }
    }
    return false;
  }

  openDB() {
    return new Promise((resolve, reject) => {
      // Close existing connection if any
      if (this.db) {
        this.db.close();
      }

      const request = indexedDB.open('newsAppDB', 2);
      
      request.onerror = () => {
        console.error('Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        console.log('Upgrading database...');
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('offlineActions')) {
          console.log('Creating offlineActions store...');
          db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Cleanup method to close database connection
  cleanup() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const offlineService = new OfflineService(); 