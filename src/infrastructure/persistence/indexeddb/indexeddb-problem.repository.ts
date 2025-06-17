// src/infrastructure/persistence/indexeddb/indexeddb-problem.repository.ts
import type { Problem } from '@/domain/entities/problem.entity';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import { STORE_PROBLEMS } from '@/lib/constants';
import { performOperation } from './indexeddb-base.repository';

export class IndexedDBProblemRepository implements IProblemRepository {
  async findById(id: string): Promise<Problem | null> {
    const result = await performOperation<Problem>(
      STORE_PROBLEMS,
      'readonly',
      (store) => store.get(id)
    );
    return (result as Problem | undefined) || null;
  }

  async findBySpaceId(spaceId: string): Promise<Problem[]> {
    const result = await performOperation<Problem[]>(
      STORE_PROBLEMS,
      'readonly',
      (store) => {
        const index = store.index('spaceId_idx');
        return index.getAll(spaceId);
      }
    );
    const problems = (result as Problem[]) || [];
    // Sort: unresolved first, then by creation date descending
    return problems.sort((a: Problem, b: Problem) => {
      if (a.resolved === b.resolved) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return a.resolved ? 1 : -1;
    });
  }

  async getAll(): Promise<Problem[]> {
    const result = await performOperation<Problem[]>(
      STORE_PROBLEMS,
      'readonly',
      (store) => store.getAll()
    );
    return (result as Problem[]) || [];
  }

  async save(problem: Problem): Promise<Problem> {
    const problemToSave = { ...problem, lastModifiedDate: new Date().toISOString() };
    await performOperation(STORE_PROBLEMS, 'readwrite', (store) =>
      store.put(problemToSave)
    );
    return problemToSave;
  }

  async delete(id: string): Promise<void> {
    await performOperation(STORE_PROBLEMS, 'readwrite', (store) =>
      store.delete(id)
    );
  }

  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
      return;
    }
    await performOperation(STORE_PROBLEMS, 'readwrite', (store) => {
      const tx = store.transaction;
      itemsToDelete.forEach((item) => {
        store.delete(item.id);
      });
      return tx.objectStore(STORE_PROBLEMS).count();
    });
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_PROBLEMS, 'readwrite', (store) => store.clear());
  }
}
