// src/infrastructure/persistence/indexeddb/indexeddb-todo.repository.ts
import type { Todo } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import { STORE_TODOS } from '@/lib/constants';
import { performOperation } from './indexeddb-base.repository';

export class IndexedDBTodoRepository implements ITodoRepository {
  async findById(id: string): Promise<Todo | null> {
    const result = await performOperation<Todo | undefined>(
      STORE_TODOS,
      'readonly',
      (store) => store.get(id)
    );
    return result || null;
  }

  async findBySpaceId(spaceId: string): Promise<Todo[]> {
    const result = await performOperation<Todo[]>(
      STORE_TODOS,
      'readonly',
      (store) => {
        const index = store.index('spaceId_idx');
        return index.getAll(spaceId);
      }
    );
    const todos = result || [];
    // Default sort: incomplete first, then by creation date descending (newest first)
    return todos.sort((a, b) => {
      if (a.completed === b.completed) {
        return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
      }
      return a.completed ? 1 : -1;
    });
  }

  async getAll(): Promise<Todo[]> {
    const result = await performOperation<Todo[]>(
      STORE_TODOS,
      'readonly',
      (store) => store.getAll()
    );
    return result || [];
  }

  async save(todo: Todo): Promise<Todo> {
    // Ensure lastModifiedDate is updated on every save
    const todoToSave = { ...todo, lastModifiedDate: new Date().toISOString() };
    await performOperation(STORE_TODOS, 'readwrite', (store) =>
      store.put(todoToSave)
    );
    return todoToSave;
  }

  async delete(id: string): Promise<void> {
    await performOperation(STORE_TODOS, 'readwrite', (store) =>
      store.delete(id)
    );
  }

  async deleteBySpaceId(spaceId: string): Promise<void> {
    const itemsToDelete = await this.findBySpaceId(spaceId);
    if (itemsToDelete.length === 0) {
      return;
    }
    await performOperation(STORE_TODOS, 'readwrite', (store) => {
      const tx = store.transaction;
      itemsToDelete.forEach((item) => {
        store.delete(item.id);
      });
      // Ensure transaction completes for multiple ops
      // For IDB, operations are queued on the transaction. When all requests complete, the transaction auto-commits.
      // Returning a promise from one of the operations or tx.done (if available) can help.
      // Since performOperation already handles promise resolution, this should be fine.
      return tx.objectStore(STORE_TODOS).count(); // Example operation to ensure tx continues
    });
  }

  async clearAll(): Promise<void> {
    await performOperation(STORE_TODOS, 'readwrite', (store) => store.clear());
  }
}
