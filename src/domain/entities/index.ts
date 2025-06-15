// src/domain/entities/index.ts
/**
 * @file This file serves as a barrel export for all domain entities.
 * It aggregates and re-exports all entity definitions from this directory,
 * making it easier to import them into other parts of the application,
 * such as application layer use cases or infrastructure layer repositories.
 * This approach simplifies import statements and decouples the rest of the
 * application from the specific file structure within the `entities` directory.
 */

export * from './action-definition.entity';
// Note: `export *` already includes types. Explicit `export type` for the same members is redundant.
// For clarity on what is exported, specific named exports can be used if preferred over `export *`,
// e.g.: export type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from './action-definition.entity';
// However, `export *` is concise for barrel files.

export * from './action-log.entity';
export * from './clock-event.entity';
export * from './data-entry-log.entity';
export * from './problem.entity';
export * from './space.entity';
export * from './todo.entity';
export * from './user-progress.entity';
