// src/application/dto/app-data-export.dto.ts
import type { Space } from '@/domain/entities/space.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { Problem } from '@/domain/entities/problem.entity';
import type { Todo } from '@/domain/entities/todo.entity';
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity'; // New

/**
 * Represents an entire snapshot of the application's data for export/import.
 */
export interface AppDataExportDTO {
  spaces: Space[];
  actionDefinitions: ActionDefinition[];
  actionLogs: ActionLog[];
  problems: Problem[];
  todos: Todo[];
  userProgress: UserProgress;
  clockEvents: ClockEvent[];
  dataEntries: DataEntryLog[]; // New
  schemaVersion: string;
}
