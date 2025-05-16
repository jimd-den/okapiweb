// src/infrastructure/persistence/indexeddb/indexeddb-base.repository.ts
import { DB_NAME, DB_VERSION, STORE_SPACES, STORE_ACTION_DEFINITIONS, STORE_ACTION_LOGS, STORE_PROBLEMS, STORE_TODOS, STORE_USER_PROGRESS, STORE_CLOCK_EVENTS, STORE_DATA_ENTRIES } from '@/lib/constants';

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
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      // STORE_SPACES
      if (!db.objectStoreNames.contains(STORE_SPACES)) {
        db.createObjectStore(STORE_SPACES, { keyPath: 'id' });
      }

      // STORE_ACTION_DEFINITIONS
      if (!db.objectStoreNames.contains(STORE_ACTION_DEFINITIONS)) {
        const actionDefinitionsStore = db.createObjectStore(STORE_ACTION_DEFINITIONS, { keyPath: 'id' });
        actionDefinitionsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        actionDefinitionsStore.createIndex('type_idx', 'type', { unique: false });
      } else {
        const actionDefinitionsStore = transaction?.objectStore(STORE_ACTION_DEFINITIONS);
        if (actionDefinitionsStore && !actionDefinitionsStore.indexNames.contains('spaceId_idx')) {
            actionDefinitionsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        }
        if (actionDefinitionsStore && !actionDefinitionsStore.indexNames.contains('type_idx')) {
            actionDefinitionsStore.createIndex('type_idx', 'type', { unique: false });
        }
      }
      
      // STORE_ACTION_LOGS
      if (!db.objectStoreNames.contains(STORE_ACTION_LOGS)) {
        const actionLogsStore = db.createObjectStore(STORE_ACTION_LOGS, { keyPath: 'id' });
        actionLogsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        actionLogsStore.createIndex('actionDefinitionId_idx', 'actionDefinitionId', { unique: false });
        actionLogsStore.createIndex('timestamp_idx', 'timestamp', {unique: false});
      } else {
        const actionLogsStore = transaction?.objectStore(STORE_ACTION_LOGS);
        if (actionLogsStore && !actionLogsStore.indexNames.contains('spaceId_idx')) {
            actionLogsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        }
        if (actionLogsStore && !actionLogsStore.indexNames.contains('actionDefinitionId_idx')) {
            actionLogsStore.createIndex('actionDefinitionId_idx', 'actionDefinitionId', { unique: false });
        }
        if (actionLogsStore && !actionLogsStore.indexNames.contains('timestamp_idx')) {
            actionLogsStore.createIndex('timestamp_idx', 'timestamp', {unique: false});
        }
      }
      
      // STORE_PROBLEMS
      if (!db.objectStoreNames.contains(STORE_PROBLEMS)) {
        const problemsStore = db.createObjectStore(STORE_PROBLEMS, { keyPath: 'id' });
        problemsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
      } else {
         const problemsStore = transaction?.objectStore(STORE_PROBLEMS);
         if (problemsStore && !problemsStore.indexNames.contains('spaceId_idx')) {
            problemsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        }
      }

      // STORE_TODOS
      if (!db.objectStoreNames.contains(STORE_TODOS)) {
        const todosStore = db.createObjectStore(STORE_TODOS, { keyPath: 'id' });
        todosStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        todosStore.createIndex('completed_idx', 'completed', {unique: false});
        todosStore.createIndex('creationDate_idx', 'creationDate', {unique: false});

      } else {
        const todosStore = transaction?.objectStore(STORE_TODOS);
        if (todosStore && !todosStore.indexNames.contains('spaceId_idx')) {
            todosStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        }
        if (todosStore && !todosStore.indexNames.contains('completed_idx')) {
             todosStore.createIndex('completed_idx', 'completed', {unique: false});
        }
        if (todosStore && !todosStore.indexNames.contains('creationDate_idx')) {
             todosStore.createIndex('creationDate_idx', 'creationDate', {unique: false});
        }
      }

      // STORE_USER_PROGRESS
      if (!db.objectStoreNames.contains(STORE_USER_PROGRESS)) {
        db.createObjectStore(STORE_USER_PROGRESS, { keyPath: 'userId' });
      }

      // STORE_CLOCK_EVENTS
      if (!db.objectStoreNames.contains(STORE_CLOCK_EVENTS)) {
        const clockEventsStore = db.createObjectStore(STORE_CLOCK_EVENTS, { keyPath: 'id' });
        clockEventsStore.createIndex('timestamp_idx', 'timestamp', {unique: false });
        clockEventsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
      } else {
        const clockEventsStore = transaction?.objectStore(STORE_CLOCK_EVENTS);
        if (clockEventsStore && !clockEventsStore.indexNames.contains('timestamp_idx')) {
             clockEventsStore.createIndex('timestamp_idx', 'timestamp', {unique: false });
        }
         if (clockEventsStore && !clockEventsStore.indexNames.contains('spaceId_idx')) {
             clockEventsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        }
      }

      // STORE_DATA_ENTRIES (New)
      if (!db.objectStoreNames.contains(STORE_DATA_ENTRIES)) {
        const dataEntriesStore = db.createObjectStore(STORE_DATA_ENTRIES, { keyPath: 'id' });
        dataEntriesStore.createIndex('actionDefinitionId_idx', 'actionDefinitionId', { unique: false });
        dataEntriesStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        dataEntriesStore.createIndex('timestamp_idx', 'timestamp', { unique: false });
      } else {
        const dataEntriesStore = transaction?.objectStore(STORE_DATA_ENTRIES);
        if (dataEntriesStore && !dataEntriesStore.indexNames.contains('actionDefinitionId_idx')) {
          dataEntriesStore.createIndex('actionDefinitionId_idx', 'actionDefinitionId', { unique: false });
        }
        if (dataEntriesStore && !dataEntriesStore.indexNames.contains('spaceId_idx')) {
          dataEntriesStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
        }
        if (dataEntriesStore && !dataEntriesStore.indexNames.contains('timestamp_idx')) {
          dataEntriesStore.createIndex('timestamp_idx', 'timestamp', { unique: false });
        }
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

export async function performOperation<T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<T[]> | IDBRequest<IDBValidKey | undefined> | IDBRequest<number> | void | Promise<void>): Promise<T | T[] | undefined | void | number> {
  const db = await initDB();
  if (!db) return undefined;

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const requestOrVoidOrPromise = operation(store);

      if (requestOrVoidOrPromise === undefined) { 
        transaction.oncomplete = () => resolve(undefined);
        transaction.onerror = (event) => {
          console.error(`Error in ${storeName} transaction (void):`, (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        return;
      }
      
      if (requestOrVoidOrPromise instanceof Promise) { 
        requestOrVoidOrPromise
          .then(() => { 
            if (transaction.error) { 
               console.error(`Error in ${storeName} transaction (async void):`, transaction.error);
               reject(transaction.error);
            } else {
               transaction.oncomplete = () => resolve(undefined);
            }
          })
          .catch(err => {
             console.error(`Error in ${storeName} async operation:`, err);
             reject(err);
          });
          transaction.onerror = (event) => { 
            if (!transaction.error) { 
                console.error(`Error in ${storeName} transaction (async void catch):`, (event.target as IDBTransaction).error);
                reject((event.target as IDBTransaction).error);
            }
          };
          return;
      }
      
      const request = requestOrVoidOrPromise as IDBRequest<T>; 

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

if (typeof window !== 'undefined') {
  initDB().catch(err => console.error("DB initialization failed during load:", err));
}
