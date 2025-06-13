// src/application/dto/app-data-export.dto.ts
/**
 * @file Defines the Data Transfer Object (DTO) for exporting and importing application data.
 * This DTO serves as a structured container for all relevant domain entities
 * that need to be serialized for backup, migration, or sharing purposes.
 */

import type { Space } from '@/domain/entities/space.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { Problem } from '@/domain/entities/problem.entity';
import type { Todo } from '@/domain/entities/todo.entity';
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';

/**
 * @interface AppDataExportDTO
 * @description Represents a complete snapshot of the application's user-specific data.
 * This structure is used by the `ExportAppDataUseCase` to package data for export
 * and by the `ImportAppDataUseCase` to receive data for import.
 * It includes all major domain entities.
 */
export interface AppDataExportDTO {
  /** @property {Space[]} spaces - An array of all {@link Space} entities. */
  spaces: Space[];
  /** @property {ActionDefinition[]} actionDefinitions - An array of all {@link ActionDefinition} entities. */
  actionDefinitions: ActionDefinition[];
  /** @property {ActionLog[]} actionLogs - An array of all {@link ActionLog} entities. */
  actionLogs: ActionLog[];
  /** @property {Problem[]} problems - An array of all {@link Problem} entities. */
  problems: Problem[];
  /** @property {Todo[]} todos - An array of all {@link Todo} entities. */
  todos: Todo[];
  /** @property {UserProgress} userProgress - The {@link UserProgress} entity for the user. */
  userProgress: UserProgress;
  /** @property {ClockEvent[]} clockEvents - An array of all {@link ClockEvent} entities. */
  clockEvents: ClockEvent[];
  /** @property {DataEntryLog[]} dataEntries - An array of all {@link DataEntryLog} entities. */
  dataEntries: DataEntryLog[];
  /** @property {string} schemaVersion - A version string indicating the schema of the exported data. This is crucial for handling migrations and compatibility if the data structure evolves over time. */
  schemaVersion: string;
}
