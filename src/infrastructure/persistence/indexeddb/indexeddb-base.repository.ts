// src/infrastructure/persistence/indexeddb/indexeddb-base.repository.ts
import { DB_NAME, DB_VERSION, STORE_SPACES, STORE_ACTION_DEFINITIONS, STORE_ACTION_LOGS, STORE_PROBLEMS, STORE_TODOS, STORE_USER_PROGRESS, STORE_CLOCK_EVENTS } from '@/lib/constants';

let dbPromise: Promise<IDBDatabase | null> | null = null;

export function initDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    console.warn("IndexedDB is not available.");
    return Promise.resolve(null);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SPACES)) {
        db.createObjectStore(STORE_SPACES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_ACTION_DEFINITIONS)) {
        const actionDefinitionsStore = db.createObjectStore(STORE_ACTION_DEFINITIONS, { keyPath: 'id' });
        actionDefinitionsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        actionDefinitionsStore.createIndex('type_idx', 'type', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_ACTION_LOGS)) {
        const actionLogsStore = db.createObjectStore(STORE_ACTION_LOGS, { keyPath: 'id' });
        actionLogsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        actionLogsStore.createIndex('actionDefinitionId_idx', 'actionDefinitionId', { unique: false });
        actionLogsStore.createIndex('timestamp_idx', 'timestamp', {unique: false});
      }
      
      if (!db.objectStoreNames.contains(STORE_PROBLEMS)) {
        const problemsStore = db.createObjectStore(STORE_PROBLEMS, { keyPath: 'id' });
        problemsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_TODOS)) {
        const todosStore = db.createObjectStore(STORE_TODOS, { keyPath: 'id' });
        todosStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_USER_PROGRESS)) {
        db.createObjectStore(STORE_USER_PROGRESS, { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains(STORE_CLOCK_EVENTS)) {
        const clockEventsStore = db.createObjectStore(STORE_CLOCK_EVENTS, { keyPath: 'id' });
        // Ensure timestamp_idx is created for STORE_CLOCK_EVENTS
        clockEventsStore.createIndex('timestamp_idx', 'timestamp', {unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log(`${DB_NAME} initialized, version ${db.version}`);
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      dbPromise = null; // Reset promise on error
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
  return dbPromise;
}

export async function performOperation<T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<T[]> | IDBRequest<IDBValidKey | undefined> | IDBRequest<number>): Promise<T | T[] | undefined | void | number> {
  const db = await initDB();
  if (!db) return undefined;

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error(`Error in ${storeName} operation:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    } catch (error) {
      console.error(`Failed to start transaction or operation on ${storeName}:`, error);
      reject(error);
    }
  });
}

// Call initDB on script load to ensure it's ready
if (typeof window !== 'undefined') {
  initDB().catch(err => console.error("DB initialization failed during load:", err));
}
