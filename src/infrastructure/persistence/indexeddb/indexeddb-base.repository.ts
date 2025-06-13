// src/infrastructure/persistence/indexeddb/indexeddb-base.repository.ts
/**
 * @file Provides base functionality for IndexedDB interactions, including database initialization,
 * schema definition, and a generic operation performer. This module is central to the
 * IndexedDB persistence strategy.
 */

import {
  DB_NAME, DB_VERSION,
  STORE_SPACES, STORE_ACTION_DEFINITIONS, STORE_ACTION_LOGS,
  STORE_PROBLEMS, STORE_TODOS, STORE_USER_PROGRESS,
  STORE_CLOCK_EVENTS, STORE_DATA_ENTRIES
} from './indexeddb.constants';

/**
 * @type {Promise<IDBDatabase | null> | null} dbPromise
 * @description A singleton promise that resolves to the initialized IDBDatabase instance.
 * It's used to ensure the database is opened only once. Null if IndexedDB is not available or initialization fails.
 */
let dbPromise: Promise<IDBDatabase | null> | null = null;

/**
 * @function initDB
 * @description Initializes the IndexedDB database. This function handles the opening of the database,
 * schema creation and upgrades via the `onupgradeneeded` event, and success/error handling
 * for the database open request. It's designed to be called once and reuse the resulting database connection.
 * @returns {Promise<IDBDatabase | null>} A promise that resolves with the `IDBDatabase` instance
 * if successful, or `null` if IndexedDB is not available in the current environment.
 * Rejects if there's an error opening the database.
 * @remarks The `onupgradeneeded` event is critical for defining the database schema.
 * It creates object stores (equivalent to tables) and indexes for efficient querying.
 * Each object store corresponds to a domain entity.
 */
export function initDB(): Promise<IDBDatabase | null> {
  // Check if IndexedDB is available (e.g., not in a Node.js server environment without shims)
  if (typeof window === 'undefined' || !window.indexedDB) {
    console.warn("IndexedDB is not available.");
    return Promise.resolve(null); // Resolve with null if IndexedDB is not supported
  }

  // If the database promise already exists (meaning initialization has been attempted or completed),
  // return the existing promise to avoid re-opening the database.
  if (dbPromise) {
    return dbPromise;
  }

  // Create a new promise for database initialization.
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    /**
     * Handles the `onupgradeneeded` event, which fires when the database is first created
     * or when the `DB_VERSION` number changes. This is where the database schema
     * (object stores and indexes) is defined and modified.
     * @param {IDBVersionChangeEvent} event - The event object for the version change.
     */
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction; // Get transaction for upgrades

      // Helper to create store and indexes if they don't exist
      const createStoreWithIndexes = (storeName: string, keyPath: string, indexes: Array<{name: string, keyPath: string | string[], options?: IDBIndexParameters}>) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath });
          indexes.forEach(idx => store.createIndex(idx.name, idx.keyPath, idx.options));
        } else if (transaction) { // If store exists, check and create missing indexes within the upgrade transaction
          const store = transaction.objectStore(storeName);
          indexes.forEach(idx => {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath, idx.options);
            }
          });
        }
      };
      
      // Define schema for each object store
      createStoreWithIndexes(STORE_SPACES, 'id', [{ name: 'date_idx', keyPath: 'date' }]);
      createStoreWithIndexes(STORE_ACTION_DEFINITIONS, 'id', [
        { name: 'spaceId_idx', keyPath: 'spaceId' },
        { name: 'type_idx', keyPath: 'type' }
      ]);
      createStoreWithIndexes(STORE_ACTION_LOGS, 'id', [
        { name: 'spaceId_idx', keyPath: 'spaceId' },
        { name: 'actionDefinitionId_idx', keyPath: 'actionDefinitionId' },
        { name: 'timestamp_idx', keyPath: 'timestamp' }
      ]);
      createStoreWithIndexes(STORE_PROBLEMS, 'id', [{ name: 'spaceId_idx', keyPath: 'spaceId' }]);
      createStoreWithIndexes(STORE_TODOS, 'id', [
        { name: 'spaceId_idx', keyPath: 'spaceId' },
        { name: 'status_idx', keyPath: 'status' },
        { name: 'creationDate_idx', keyPath: 'creationDate' }
      ]);
      createStoreWithIndexes(STORE_USER_PROGRESS, 'userId', []); // Assuming userId is the keyPath
      createStoreWithIndexes(STORE_CLOCK_EVENTS, 'id', [
        { name: 'timestamp_idx', keyPath: 'timestamp' },
        { name: 'spaceId_idx', keyPath: 'spaceId' }
      ]);
      createStoreWithIndexes(STORE_DATA_ENTRIES, 'id', [
        { name: 'actionDefinitionId_idx', keyPath: 'actionDefinitionId' },
        { name: 'spaceId_idx', keyPath: 'spaceId' },
        { name: 'timestamp_idx', keyPath: 'timestamp' },
        { name: 'stepId_idx', keyPath: 'stepId' } // Index for stepId in data entries
      ]);
    };

    /**
     * Handles the `onsuccess` event, which fires when the database is successfully opened.
     * @param {Event} event - The success event.
     */
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log(`${DB_NAME} initialized, version ${db.version}`);
      resolve(db); // Resolve the main dbPromise with the database instance
    };

    /**
     * Handles the `onerror` event, which fires if there's an error opening the database.
     * @param {Event} event - The error event.
     */
    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      dbPromise = null; // Reset the dbPromise on error to allow retries if applicable
      reject((event.target as IDBOpenDBRequest).error); // Reject the main dbPromise
    };
  });
  return dbPromise; // Return the promise for this initialization attempt
}

/**
 * @function performOperation
 * @template T
 * @description A generic helper function to perform operations (CRUD) on an IndexedDB object store.
 * It handles database initialization, transaction creation, and event handling (success, error, complete)
 * for common IndexedDB operations.
 * @param {string} storeName - The name of the object store to operate on.
 * @param {IDBTransactionMode} mode - The transaction mode ('readonly' or 'readwrite').
 * @param {(store: IDBObjectStore) => IDBRequest<T> | IDBRequest<T[]> | IDBRequest<IDBValidKey | undefined> | IDBRequest<number> | void | Promise<void>} operation - A callback function that receives the object store
 * and should perform the desired operation (e.g., `store.add()`, `store.get()`, `store.put()`, `store.delete()`, `store.clear()`, `store.count()`, `store.index().getAll()`).
 * The callback can return an `IDBRequest` (for most operations), `void` (if the operation doesn't return an IDBRequest, e.g., some complex multi-part operations within the transaction),
 * or a `Promise<void>` for asynchronous operations within the transaction.
 * @returns {Promise<T | T[] | undefined | void | number>} A promise that resolves with the result of the operation
 * (e.g., the retrieved item, an array of items, the key of an added item, count, or undefined/void for operations like delete/clear).
 * Rejects if the database is not available or if any error occurs during the transaction or operation.
 * @remarks This function simplifies repository implementations by abstracting common IndexedDB boilerplate.
 */
export async function performOperation<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<T[]> | IDBRequest<IDBValidKey | undefined> | IDBRequest<number> | void | Promise<void>
): Promise<T | T[] | undefined | void | number> {
  const db = await initDB(); // Ensure DB is initialized and get the instance
  if (!db) {
    // If db is null (IndexedDB not available), reject or return an appropriate value.
    // Throwing an error might be more explicit for repositories.
    throw new Error("IndexedDB is not available or failed to initialize.");
  }

  return new Promise((resolve, reject) => {
    try {
      // Start a new transaction on the specified store with the given mode.
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      // Execute the provided operation callback with the store.
      const requestOrVoidOrPromise = operation(store);

      // Handle operations that don't return an IDBRequest (e.g., void or Promise<void>)
      if (requestOrVoidOrPromise === undefined) { // Void operation
        transaction.oncomplete = () => resolve(undefined);
        transaction.onerror = (event) => {
          console.error(`Error in ${storeName} transaction (void operation):`, (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        return;
      }
      
      if (requestOrVoidOrPromise instanceof Promise) { // Async void operation (Promise<void>)
        requestOrVoidOrPromise
          .then(() => {
            // Check transaction error state after promise resolves, as it might have been set by an operation within the promise.
            if (transaction.error) {
               console.error(`Error in ${storeName} transaction (async void operation):`, transaction.error);
               reject(transaction.error);
            } else {
               // If the promise resolved and no transaction error, complete means success.
               transaction.oncomplete = () => resolve(undefined);
            }
          })
          .catch(err => {
             // Catch errors from the promise itself.
             console.error(`Error in ${storeName} async operation callback:`, err);
             if (transaction.error) { // Abort transaction if not already aborted due to the error.
                try { transaction.abort(); } catch (e) { /* ignore abort error */ }
             }
             reject(err);
          });
          // Handle transaction errors that might occur independently or be set by operations within the promise.
          transaction.onerror = (event) => {
            // Avoid double rejection if promise already rejected and set transaction.error
            if (!transaction.error) { // This check might be redundant if promise rejection also sets transaction.error
                console.error(`Error in ${storeName} transaction (async void wrapper):`, (event.target as IDBTransaction).error);
                reject((event.target as IDBTransaction).error);
            }
          };
          return;
      }
      
      // Standard IDBRequest handling
      const request = requestOrVoidOrPromise as IDBRequest<T>; // Cast to IDBRequest

      request.onsuccess = () => {
        resolve(request.result); // Resolve with the result of the IDBRequest
      };

      request.onerror = (event) => {
        console.error(`Error in ${storeName} IDBRequest operation:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error); // Reject with the error from the IDBRequest
      };
    } catch (error) {
      // Catch synchronous errors from starting the transaction or calling the operation.
      console.error(`Failed to start transaction or operation on ${storeName}:`, error);
      reject(error);
    }
  });
}

// Automatically initialize the database when this module is loaded in a browser environment.
// This helps ensure the dbPromise is initiated early.
if (typeof window !== 'undefined') {
  initDB().catch(err => console.error("DB initialization failed during module load:", err));
}
