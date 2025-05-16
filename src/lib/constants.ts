// src/lib/constants.ts

export const APP_NAME = "Okapi Workflow Game";
export const APP_VERSION = "0.1.0";

export const DB_NAME = "OkapiWorkflowGameDB";
export const DB_VERSION = 6; // Incremented for new STORE_DATA_ENTRIES

// Store names for IndexedDB
export const STORE_SPACES = "spaces";
export const STORE_ACTION_DEFINITIONS = "actionDefinitions";
export const STORE_ACTION_LOGS = "actionLogs";
export const STORE_PROBLEMS = "problems";
export const STORE_TODOS = "todos";
export const STORE_USER_PROGRESS = "userProgress";
export const STORE_CLOCK_EVENTS = "clockEvents";
export const STORE_DATA_ENTRIES = "dataEntries"; // New store

export const DEFAULT_USER_ID = "localUser";

export const DEFAULT_SPACE_COLOR_SCHEMES = [
  { id: 'default', name: 'Default Theme Colors' },
  { id: 'forest', name: 'Forest Green', primary: '#228B22', secondary: '#8FBC8F' },
  { id: 'ocean', name: 'Ocean Blue', primary: '#0077BE', secondary: '#ADD8E6' },
  { id: 'sunset', name: 'Sunset Orange', primary: '#FF8C00', secondary: '#FFDAB9' },
  { id: 'lavender', name: 'Lavender Bliss', primary: '#9370DB', secondary: '#E6E6FA' },
];

export const POINTS_TO_LEVEL_UP_BASE = 100;
