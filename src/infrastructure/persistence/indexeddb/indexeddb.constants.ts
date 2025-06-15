// src/infrastructure/persistence/indexeddb/indexeddb.constants.ts
/**
 * @file Defines constants used for the IndexedDB setup and configuration.
 * This includes the database name, version, and names of the object stores
 * used to persist domain entities. Centralizing these constants helps maintain
 * consistency and makes updates to the database schema easier to manage.
 */

/** @constant {string} DB_NAME - The name of the IndexedDB database. */
export const DB_NAME = "OkapiWorkflowDB";

/**
 * @constant {number} DB_VERSION - The current version of the IndexedDB database schema.
 * This version number must be an integer and should be incremented whenever
 * the database schema changes (e.g., adding new object stores, new indexes, or modifying existing ones).
 * The `onupgradeneeded` event in IndexedDB uses this version to trigger schema migrations.
 * Current version 8 reason: Incremented for STORE_DATA_ENTRIES.stepId_idx
 */
export const DB_VERSION = 8;

// --- Object Store Names ---
// These constants define the names for each object store within the IndexedDB database.
// Each store typically corresponds to a domain entity.

/** @constant {string} STORE_SPACES - Object store name for {@link Space} entities. */
export const STORE_SPACES = "spaces";
/** @constant {string} STORE_ACTION_DEFINITIONS - Object store name for {@link ActionDefinition} entities. */
export const STORE_ACTION_DEFINITIONS = "actionDefinitions";
/** @constant {string} STORE_ACTION_LOGS - Object store name for {@link ActionLog} entities. */
export const STORE_ACTION_LOGS = "actionLogs";
/** @constant {string} STORE_PROBLEMS - Object store name for {@link Problem} entities. */
export const STORE_PROBLEMS = "problems";
/** @constant {string} STORE_TODOS - Object store name for {@link Todo} entities. */
export const STORE_TODOS = "todos";
/** @constant {string} STORE_USER_PROGRESS - Object store name for {@link UserProgress} entities. */
export const STORE_USER_PROGRESS = "userProgress";
/** @constant {string} STORE_CLOCK_EVENTS - Object store name for {@link ClockEvent} entities. */
export const STORE_CLOCK_EVENTS = "clockEvents";
/** @constant {string} STORE_DATA_ENTRIES - Object store name for {@link DataEntryLog} entities. */
export const STORE_DATA_ENTRIES = "dataEntries";
