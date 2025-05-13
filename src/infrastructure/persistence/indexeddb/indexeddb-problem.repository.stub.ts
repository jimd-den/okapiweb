// src/infrastructure/persistence/indexeddb/indexeddb-problem.repository.stub.ts
import type { Problem } from '@/domain/entities/problem.entity';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
// import { STORE_PROBLEMS } from '@/lib/constants';
// import { performOperation } from './indexeddb-base.repository';

export class IndexedDBProblemRepository implements IProblemRepository {
  async findById(id: string): Promise<Problem | null> {
    console.warn(`STUB: IndexedDBProblemRepository.findById(${id})`);
    return null;
  }
  async findBySpaceId(spaceId: string): Promise<Problem[]> {
    console.warn(`STUB: IndexedDBProblemRepository.findBySpaceId(${spaceId})`);
    return [];
  }
  async getAll(): Promise<Problem[]> {
    console.warn(`STUB: IndexedDBProblemRepository.getAll()`);
    return [];
  }
  async save(problem: Problem): Promise<Problem> {
    console.warn(`STUB: IndexedDBProblemRepository.save()`, problem);
    return problem;
  }
  async delete(id: string): Promise<void> {
    console.warn(`STUB: IndexedDBProblemRepository.delete(${id})`);
  }
  async deleteBySpaceId(spaceId: string): Promise<void> {
    console.warn(`STUB: IndexedDBProblemRepository.deleteBySpaceId(${spaceId})`);
  }
  async clearAll(): Promise<void> {
    console.warn(`STUB: IndexedDBProblemRepository.clearAll()`);
  }
}
