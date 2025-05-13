// src/infrastructure/persistence/indexeddb/indexeddb-space.repository.ts
import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';
import { STORE_SPACES } from '@/lib/constants';
import { performOperation } from './indexeddb-base.repository';

export class IndexedDBSpaceRepository implements ISpaceRepository {
  async findById(id: string): Promise<Space | null> {
    const result = await performOperation<Space | undefined>(STORE_SPACES, 'readonly', store => store.get(id));
    return result || null;
  }

  async getAll(): Promise<Space[]> {
    const result = await performOperation<Space[]>(STORE_SPACES, 'readonly', store => store.getAll());
    return result || [];
  }

  async save(space: Space): Promise<Space> {
    await performOperation(STORE_SPACES, 'readwrite', store => store.put(space));
    return space;
  }

  async delete(id: string): Promise<void> {
    await performOperation(STORE_SPACES, 'readwrite', store => store.delete(id));
  }
  
  async clearAll(): Promise<void> {
    await performOperation(STORE_SPACES, 'readwrite', store => store.clear());
  }
}
