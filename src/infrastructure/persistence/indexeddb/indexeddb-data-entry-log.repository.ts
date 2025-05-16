// src/infrastructure/persistence/indexeddb/indexeddb-data-entry-log.repository.ts
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';
import { STORE_DATA_ENTRIES } from '@/lib/constants';
import { performOperation } from './indexeddb-base.repository';

export class IndexedDBDataEntryLogRepository implements IDataEntryLogRepository {
  async findById(id: string): Promise<DataEntryLog | null> {
    const result = await performOperation<DataEntryLog | undefined>(STORE_DATA_ENTRIES, 'readonly', store => store.get(id));
    return result || null;
  }

  async findByActionDefinitionId(actionDefinitionId: string): Promise<DataEntryLog[]> {
    const result = await performOperation<DataEntryLog[]>(STORE_DATA_ENTRIES, 'readonly', store => {
      const index = store.index('actionDefinitionId_idx');
      return index.getAll(actionDefinitionId);
    });
    return (result || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async findBySpaceId(spaceId: string): Promise<DataEntryLog[]> {
    const result = await performOperation<DataEntryLog[]>(STORE_DATA_ENTRIES, 'readonly', store => {
      const index = store.index('spaceId_idx');
      return index.getAll(spaceId);
    });
    return (result || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAll(): Promise<DataEntryLog[]> {
    const result = await performOperation<DataEntryLog[]>(STORE_DATA_ENTRIES, 'readonly', store => store.getAll());
    return result || [];
  }

  async save(dataEntryLog: DataEntryLog): Promise<DataEntryLog> {
    await performOperation(STORE_DATA_ENTRIES, 'readwrite', store => store.put(dataEntryLog));
    return dataEntryLog;
  }

  async delete(id: string): Promise<void> {
    await performOperation(STORE_DATA_ENTRIES, 'readwrite', store => store.delete(id));
  }
  
  async deleteByActionDefinitionId(actionDefinitionId: string): Promise<void> {
    const itemsToDelete = await this.findByActionDefinitionId(actionDefinitionId);
    if (itemsToDelete.length === 0) return;
    await performOperation(STORE_DATA_ENTRIES, 'readwrite', store => {
      itemsToDelete.forEach(item => store.delete(item.id));
      return store.count(); // Ensure transaction completes
    });
  }

  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) return;
    await performOperation(STORE_DATA_ENTRIES, 'readwrite', store => {
      itemsToDelete.forEach(item => store.delete(item.id));
      return store.count(); // Ensure transaction completes
    });
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_DATA_ENTRIES, 'readwrite', store => store.clear());
  }
}
