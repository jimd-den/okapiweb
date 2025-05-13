// src/infrastructure/persistence/indexeddb/indexeddb-action.repository.stub.ts
import type { Action } from '@/domain/entities/action.entity';
import type { IActionRepository } from '@/application/ports/repositories/iaction.repository';
import { STORE_ACTIONS } from '@/lib/constants';
import { performOperation } from './indexeddb-base.repository';

export class IndexedDBActionRepository implements IActionRepository {
  async findById(id: string): Promise<Action | null> {
    console.warn(`STUB: IndexedDBActionRepository.findById(${id})`);
    // const result = await performOperation<Action | undefined>(STORE_ACTIONS, 'readonly', store => store.get(id));
    // return result || null;
    return null;
  }

  async findBySpaceId(spaceId: string): Promise<Action[]> {
    console.warn(`STUB: IndexedDBActionRepository.findBySpaceId(${spaceId})`);
    // const result = await performOperation<Action[]>(STORE_ACTIONS, 'readonly', store => {
    //   const index = store.index('spaceId_idx');
    //   return index.getAll(spaceId);
    // });
    // return result || [];
    return [];
  }
  
  async getAll(): Promise<Action[]> {
    console.warn(`STUB: IndexedDBActionRepository.getAll()`);
    // const result = await performOperation<Action[]>(STORE_ACTIONS, 'readonly', store => store.getAll());
    // return result || [];
    return [];
  }

  async save(action: Action): Promise<Action> {
    console.warn(`STUB: IndexedDBActionRepository.save()`, action);
    // await performOperation(STORE_ACTIONS, 'readwrite', store => store.put(action));
    return action;
  }

  async delete(id: string): Promise<void> {
    console.warn(`STUB: IndexedDBActionRepository.delete(${id})`);
    // await performOperation(STORE_ACTIONS, 'readwrite', store => store.delete(id));
  }

  async deleteBySpaceId(spaceId: string): Promise<void> {
    console.warn(`STUB: IndexedDBActionRepository.deleteBySpaceId(${spaceId})`);
    // const actions = await this.findBySpaceId(spaceId);
    // for (const action of actions) {
    //   await this.delete(action.id);
    // }
  }
  
  async clearAll(): Promise<void> {
    console.warn(`STUB: IndexedDBActionRepository.clearAll()`);
    // await performOperation(STORE_ACTIONS, 'readwrite', store => store.clear());
  }
}
