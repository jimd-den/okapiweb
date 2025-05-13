// src/application/dto/app-data-export.dto.ts
import type { Space } from '@/domain/entities/space.entity';
import type { Action } from '@/domain/entities/action.entity';
import type { Problem } from '@/domain/entities/problem.entity';
import type { Todo } from '@/domain/entities/todo.entity';
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';

/**
 * Represents an entire snapshot of the application's data for export/import.
 */
export interface AppDataExportDTO {
  spaces: Space[];
  actions: Action[];
  problems: Problem[];
  todos: Todo[];
  userProgress: UserProgress;
  clockEvents: ClockEvent[];
  schemaVersion: string;
}
