// src/lib/constants.ts

export const APP_NAME = "Okapi Workflow Game";
export const APP_VERSION = "0.2.0"; // Incremented for schema change

export const DB_NAME = "OkapiWorkflowGameDB";
export const DB_VERSION = 7; // Incremented for new STORE_SPACES.date_idx & STORE_TODOS.status_idx

// Store names for IndexedDB
export const STORE_SPACES = "spaces";
export const STORE_ACTION_DEFINITIONS = "actionDefinitions";
export const STORE_ACTION_LOGS = "actionLogs";
export const STORE_PROBLEMS = "problems";
export const STORE_TODOS = "todos";
export const STORE_USER_PROGRESS = "userProgress";
export const STORE_CLOCK_EVENTS = "clockEvents";
export const STORE_DATA_ENTRIES = "dataEntries";

export const DEFAULT_USER_ID = "localUser";

export const DEFAULT_SPACE_COLOR_SCHEMES = [
  { id: 'default', name: 'Default Theme Colors' },
  { id: 'forest', name: 'Forest Green', primary: '#228B22', secondary: '#8FBC8F' },
  { id: 'ocean', name: 'Ocean Blue', primary: '#0077BE', secondary: '#ADD8E6' },
  { id: 'sunset', name: 'Sunset Orange', primary: '#FF8C00', secondary: '#FFDAB9' },
  { id: 'lavender', name: 'Lavender Bliss', primary: '#9370DB', secondary: '#E6E6FA' },
];

// Animation Class Constants
export const ANIMATION_ITEM_NEWLY_ADDED = "animate-in fade-in-50 slide-in-from-top-5 duration-500 ease-out";
export const ANIMATION_ITEM_FADE_OUT = "animate-out fade-out duration-300";
