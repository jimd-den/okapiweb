// src/infrastructure/persistence/indexeddb/indexeddb-todo.repository.ts
import type { Todo } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import { STORE_TODOS } from '@/lib/constants';
import { performOperation, initDB } from './indexeddb-base.repository';

export class IndexedDBTodoRepository implements ITodoRepository {
  async findById(id: string): Promise<Todo | null> {
    const result = await performOperation<Todo | undefined>(STORE_TODOS, 'readonly', store => store.get(id));
    return result || null;
  }

  async findBySpaceId(spaceId: string): Promise<Todo[]> {
    const result = await performOperation<Todo[]>(STORE_TODOS, 'readonly', store => {
      const index = store.index('spaceId_idx');
      return index.getAll(spaceId);
    });
    return result || [];
  }

  async getAll(): Promise<Todo[]> {
    const result = await performOperation<Todo[]>(STORE_TODOS, 'readonly', store => store.getAll());
    return result || [];
  }

  async save(todo: Todo): Promise<Todo> {
    await performOperation(STORE_TODOS, 'readwrite', store => store.put(todo));
    return todo;
  }

  async delete(id: string): Promise<void> {
    await performOperation(STORE_TODOS, 'readwrite', store => store.delete(id));
  }

  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
        return;
    }
    await performOperation(STORE_TODOS, 'readwrite', store => {
        itemsToDelete.forEach(item => {
            store.delete(item.id);
        });
        return store.count();
    });
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_TODOS, 'readwrite', store => store.clear());
  }
}
