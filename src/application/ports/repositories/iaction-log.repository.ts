// src/application/ports/repositories/iaction-log.repository.ts
import type { ActionLog } from '@/domain/entities/action-log.entity';

export interface IActionLogRepository {
  findById(id: string): Promise<ActionLog | null>;
  findBySpaceId(spaceId: string): Promise<ActionLog[]>;
  findByActionDefinitionId(actionDefinitionId: string): Promise<ActionLog[]>;
  getAll(): Promise<ActionLog[]>;
  save(actionLog: ActionLog): Promise<ActionLog>; // Creates or updates a log entry
  delete(id: string): Promise<void>;
  deleteBySpaceId(spaceId: string): Promise<void>;
  clearAll(): Promise<void>;
}
