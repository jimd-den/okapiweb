// src/infrastructure/persistence/indexeddb/indexeddb-action-log.repository.ts
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import { STORE_ACTION_LOGS } from '@/lib/constants';
import { performOperation, initDB } from './indexeddb-base.repository';

export class IndexedDBActionLogRepository implements IActionLogRepository {
  async findById(id: string): Promise<ActionLog | null> {
    const result = await performOperation<ActionLog | undefined>(STORE_ACTION_LOGS, 'readonly', store => store.get(id));
    return result || null;
  }

  async findBySpaceId(spaceId: string): Promise<ActionLog[]> {
    const result = await performOperation<ActionLog[]>(STORE_ACTION_LOGS, 'readonly', store => {
      const index = store.index('spaceId_idx');
      return index.getAll(spaceId);
    });
    return result || [];
  }
  
  async findByActionDefinitionId(actionDefinitionId: string): Promise<ActionLog[]> {
    const result = await performOperation<ActionLog[]>(STORE_ACTION_LOGS, 'readonly', store => {
      const index = store.index('actionDefinitionId_idx');
      return index.getAll(actionDefinitionId);
    });
    return result || [];
  }
  
  async getAll(): Promise<ActionLog[]> {
    const result = await performOperation<ActionLog[]>(STORE_ACTION_LOGS, 'readonly', store => store.getAll());
    return result || [];
  }

  async save(actionLog: ActionLog): Promise<ActionLog> {
    await performOperation(STORE_ACTION_LOGS, 'readwrite', store => store.put(actionLog));
    return actionLog;
  }

  async delete(id: string): Promise<void> {
    await performOperation(STORE_ACTION_LOGS, 'readwrite', store => store.delete(id));
  }

  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
        return;
    }
    await performOperation(STORE_ACTION_LOGS, 'readwrite', store => {
        itemsToDelete.forEach(item => {
            store.delete(item.id);
        });
        return store.count(); // Return a request to ensure transaction completion
    });
  }
  
  async clearAll(): Promise<void> {
    await performOperation(STORE_ACTION_LOGS, 'readwrite', store => store.clear());
  }
}
