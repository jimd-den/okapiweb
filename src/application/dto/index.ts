// src/application/dto/index.ts
/**
 * @file This file serves as a barrel export for all Data Transfer Objects (DTOs)
 * defined within the `src/application/dto` directory.
 * It aggregates and re-exports all DTO interfaces and types,
 * making them easily importable into other parts of the application,
 * particularly use cases and potentially the presentation layer if needed.
 * This simplifies import paths and decouples consumers from the specific
 * file structure of the DTO directory.
 */

export * from './app-data-export.dto';
export * from './timeline-item.dto';
// Note: `export *` already includes types. Explicit `export type` for the same members is redundant.
