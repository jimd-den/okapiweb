
// src/lib/db.ts
import type { AppDataExport, Space, Action, Problem, Todo, UserProgress, ClockEvent } from '@/lib/types';
import { DB_NAME, DB_VERSION, STORE_SPACES, STORE_ACTIONS, STORE_PROBLEMS, STORE_TODOS, STORE_USER_PROGRESS, STORE_CLOCK_EVENTS } from '@/lib/constants';

// This is a simplified stub. A full IndexedDB wrapper would be more robust.

/**
 * Initializes the IndexedDB database and creates object stores if they don't exist.
 * This function should be called once when the application loads.
 */
export async function initDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    console.warn("IndexedDB is not available.");
    return null;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SPACES)) {
        db.createObjectStore(STORE_SPACES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ACTIONS)) {
        const actionsStore = db.createObjectStore(STORE_ACTIONS, { keyPath: 'id' });
        actionsStore.createIndex('spaceId_idx', 'spaceId', { unique: false });
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
        db.createObjectStore(STORE_CLOCK_EVENTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * A helper function to perform generic DB operations.
 */
async function performOperation<T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<T[]>): Promise<T | T[] | undefined> {
  const db = await initDB();
  if (!db) return undefined;

  return new Promise((resolve, reject) => {
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
  });
}


// Example CRUD stubs - these would need to be implemented fully.

// Spaces
export const addSpaceDB = async (space: Space) => performOperation(STORE_SPACES, 'readwrite', store => store.add(space));
export const getAllSpacesDB = async (): Promise<Space[] | undefined> => performOperation(STORE_SPACES, 'readonly', store => store.getAll()) as Promise<Space[] | undefined>;
export const getSpaceDB = async (id: string): Promise<Space | undefined> => performOperation(STORE_SPACES, 'readonly', store => store.get(id)) as Promise<Space | undefined>;
export const updateSpaceDB = async (space: Space) => performOperation(STORE_SPACES, 'readwrite', store => store.put(space));
export const deleteSpaceDB = async (id: string) => performOperation(STORE_SPACES, 'readwrite', store => store.delete(id));

// --- Stubs for other stores (Actions, Problems, Todos, UserProgress, ClockEvents) would follow a similar pattern ---
// export const addActionDB = async (action: Action) => { /* ... */ };
// export const getActionsBySpaceDB = async (spaceId: string): Promise<Action[]> => { /* ... */ };


/**
 * Exports all data from IndexedDB to a JSON object.
 */
export async function exportData(): Promise<AppDataExport | null> {
  try {
    // This is a simplified version. In a real app, you'd fetch from all stores.
    const spaces = (await getAllSpacesDB()) || [];
    // const actions = await getAllActionsDB(); // etc.
    
    return {
      spaces,
      actions: [], // Placeholder
      problems: [], // Placeholder
      todos: [], // Placeholder
      userProgress: { userId: 'localUser', points: 0, level: 1, unlockedCustomizations: [] }, // Placeholder
      clockEvents: [], // Placeholder
      schemaVersion: DB_VERSION.toString(),
    };
  } catch (error) {
    console.error("Error exporting data:", error);
    return null;
  }
}

/**
 * Imports data from a JSON object into IndexedDB, clearing existing data.
 */
export async function importData(data: AppDataExport): Promise<boolean> {
  const db = await initDB();
  if (!db) return false;

  try {
    // This is highly simplified. A real import would clear stores and add new data carefully.
    const transaction = db.transaction([STORE_SPACES /*, other stores... */], 'readwrite');
    
    const spacesStore = transaction.objectStore(STORE_SPACES);
    await new Promise<void>((resolve, reject) => {
      const clearRequest = spacesStore.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    for (const space of data.spaces) {
      await new Promise<void>((resolve, reject) => {
        const addRequest = spacesStore.add(space);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    }
    // Repeat for other stores...

    return await new Promise<boolean>((resolve) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false); // Or reject with error
    });
  } catch (error) {
    console.error("Error importing data:", error);
    return false;
  }
}

// Call initDB on script load (or in a more appropriate app lifecycle hook)
if (typeof window !== 'undefined') {
  initDB().then(db => {
    if (db) {
      console.log(`${DB_NAME} initialized, version ${db.version}`);
    }
  }).catch(err => console.error("DB initialization failed:", err));
}