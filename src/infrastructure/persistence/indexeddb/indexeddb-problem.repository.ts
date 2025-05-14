// src/infrastructure/persistence/indexeddb/indexeddb-problem.repository.ts
import type { Problem } from '@/domain/entities/problem.entity';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import { STORE_PROBLEMS } from '@/lib/constants';
import { performOperation, initDB } from './indexeddb-base.repository';

export class IndexedDBProblemRepository implements IProblemRepository {
  async findById(id: string): Promise<Problem | null> {
    const result = await performOperation<Problem | undefined>(STORE_PROBLEMS, 'readonly', store => store.get(id));
    return result || null;
  }

  async findBySpaceId(spaceId: string): Promise<Problem[]> {
    const result = await performOperation<Problem[]>(STORE_PROBLEMS, 'readonly', store => {
      const index = store.index('spaceId_idx');
      return index.getAll(spaceId);
    });
    return result || [];
  }

  async getAll(): Promise<Problem[]> {
    const result = await performOperation<Problem[]>(STORE_PROBLEMS, 'readonly', store => store.getAll());
    return result || [];
  }

  async save(problem: Problem): Promise<Problem> {
    await performOperation(STORE_PROBLEMS, 'readwrite', store => store.put(problem));
    return problem;
  }

  async delete(id: string): Promise<void> {
    await performOperation(STORE_PROBLEMS, 'readwrite', store => store.delete(id));
  }

  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
        return;
    }
    await performOperation(STORE_PROBLEMS, 'readwrite', store => {
        itemsToDelete.forEach(item => {
            store.delete(item.id);
        });
        return store.count(); 
    });
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_PROBLEMS, 'readwrite', store => store.clear());
  }
}
