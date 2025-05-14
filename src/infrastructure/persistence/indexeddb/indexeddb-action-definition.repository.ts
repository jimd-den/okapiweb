// src/infrastructure/persistence/indexeddb/indexeddb-action-definition.repository.ts
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import { STORE_ACTION_DEFINITIONS } from '@/lib/constants';
import { performOperation } from './indexeddb-base.repository';

export class IndexedDBActionDefinitionRepository implements IActionDefinitionRepository {
  async findById(id: string): Promise<ActionDefinition | null> {
    const result = await performOperation<ActionDefinition | undefined>(STORE_ACTION_DEFINITIONS, 'readonly', store => store.get(id));
    return result || null;
  }

  async findBySpaceId(spaceId: string): Promise<ActionDefinition[]> {
    const result = await performOperation<ActionDefinition[]>(STORE_ACTION_DEFINITIONS, 'readonly', store => {
      const index = store.index('spaceId_idx');
      return index.getAll(spaceId);
    });
    return result || [];
  }
  
  async getAll(): Promise<ActionDefinition[]> {
    // console.warn(`STUB: IndexedDBActionDefinitionRepository.getAll()`);
    // This method is used by settings page for export. Implementing it.
    const result = await performOperation<ActionDefinition[]>(STORE_ACTION_DEFINITIONS, 'readonly', store => store.getAll());
    return result || [];
  }

  async save(actionDefinition: ActionDefinition): Promise<ActionDefinition> {
    await performOperation(STORE_ACTION_DEFINITIONS, 'readwrite', store => store.put(actionDefinition));
    return actionDefinition;
  }

  async delete(id: string): Promise<void> {
    console.warn(`STUB: IndexedDBActionDefinitionRepository.delete(${id})`);
    await performOperation(STORE_ACTION_DEFINITIONS, 'readwrite', store => store.delete(id));
  }

  async deleteBySpaceId(spaceId: string): Promise<void> {
    console.warn(`STUB: IndexedDBActionDefinitionRepository.deleteBySpaceId(${spaceId})`);
    const definitions = await this.findBySpaceId(spaceId);
    const db = await performOperation(STORE_ACTION_DEFINITIONS, 'readwrite', store => {
        const tx = store.transaction;
        definitions.forEach(def => store.delete(def.id));
        return tx.done; // Not standard, but a way to ensure transaction completes for multiple ops
    });
  }
  
  async clearAll(): Promise<void> {
    // console.warn(`STUB: IndexedDBActionDefinitionRepository.clearAll()`);
    // This method is used by settings page for import/clear. Implementing it.
    await performOperation(STORE_ACTION_DEFINITIONS, 'readwrite', store => store.clear());
  }
}
