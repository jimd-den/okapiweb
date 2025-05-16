// src/application/ports/repositories/idata-entry-log.repository.ts
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';

export interface IDataEntryLogRepository {
  findById(id: string): Promise<DataEntryLog | null>;
  findByActionDefinitionId(actionDefinitionId: string): Promise<DataEntryLog[]>;
  findBySpaceId(spaceId: string): Promise<DataEntryLog[]>;
  getAll(): Promise<DataEntryLog[]>;
  save(dataEntryLog: DataEntryLog): Promise<DataEntryLog>;
  delete(id: string): Promise<void>;
  deleteBySpaceId(spaceId: string): Promise<void>;
  deleteByActionDefinitionId(actionDefinitionId: string): Promise<void>;
  clearAll(): Promise<void>;
}
