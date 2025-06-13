// src/infrastructure/persistence/indexeddb/index.ts
/**
 * @file This file serves as a barrel export for the IndexedDB persistence layer.
 * It aggregates and re-exports all concrete repository implementations that use IndexedDB,
 * as well as core IndexedDB utility functions like `initDB` and `performOperation`.
 * This allows other parts of the application, particularly the dependency injection setup
 * or service locators, to easily access any IndexedDB repository or utility from a single import path.
 *
 * Re-exporting these components simplifies the import statements in higher-level modules
 * and decouples them from the specific file names within this directory.
 */

export { IndexedDBActionDefinitionRepository } from './indexeddb-action-definition.repository';
export { IndexedDBActionLogRepository } from './indexeddb-action-log.repository';
export { IndexedDBClockEventRepository } from './indexeddb-clock-event.repository';
export { IndexedDBDataEntryLogRepository } from './indexeddb-data-entry-log.repository';
export { IndexedDBProblemRepository } from './indexeddb-problem.repository';
export { IndexedDBSpaceRepository } from './indexeddb-space.repository';
export { IndexedDBTodoRepository } from './indexeddb-todo.repository';
export { IndexedDBUserProgressRepository } from './indexeddb-user-progress.repository';

// Also re-export core DB utilities if they are intended to be accessible
// for more advanced scenarios or direct DB interaction outside repositories, though this is less common.
export { initDB, performOperation } from './indexeddb-base.repository';
