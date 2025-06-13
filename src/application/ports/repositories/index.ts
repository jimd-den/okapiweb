// src/application/ports/repositories/index.ts
/**
 * @file This file serves as a barrel export for all repository interfaces
 * defined within the `src/application/ports/repositories` directory.
 * It aggregates and re-exports these interfaces, making them easily importable
 * into use cases and infrastructure layer implementations.
 * This simplifies import paths and helps maintain a clear separation of concerns
 * by providing a single point of access for repository contracts.
 */

export type { IActionDefinitionRepository } from './iaction-definition.repository';
export type { IActionLogRepository } from './iaction-log.repository';
export type { IClockEventRepository } from './iclock-event.repository';
export type { IDataEntryLogRepository } from './idata-entry-log.repository';
export type { IProblemRepository } from './iproblem.repository';
export type { ISpaceRepository } from './ispace.repository';
export type { ITodoRepository } from './itodo.repository';
export type { IUserProgressRepository } from './iuser-progress.repository';
