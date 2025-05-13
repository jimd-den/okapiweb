// src/infrastructure/persistence/indexeddb/indexeddb-todo.repository.stub.ts
import type { Todo } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
// import { STORE_TODOS } from '@/lib/constants';
// import { performOperation } from './indexeddb-base.repository';

export class IndexedDBTodoRepository implements ITodoRepository {
  async findById(id: string): Promise<Todo | null> {
    console.warn(`STUB: IndexedDBTodoRepository.findById(${id})`);
    return null;
  }
  async findBySpaceId(spaceId: string): Promise<Todo[]> {
    console.warn(`STUB: IndexedDBTodoRepository.findBySpaceId(${spaceId})`);
    return [];
  }
  async getAll(): Promise<Todo[]> {
    console.warn(`STUB: IndexedDBTodoRepository.getAll()`);
    return [];
  }
  async save(todo: Todo): Promise<Todo> {
    console.warn(`STUB: IndexedDBTodoRepository.save()`, todo);
    return todo;
  }
  async delete(id: string): Promise<void> {
    console.warn(`STUB: IndexedDBTodoRepository.delete(${id})`);
  }
  async deleteBySpaceId(spaceId: string): Promise<void> {
    console.warn(`STUB: IndexedDBTodoRepository.deleteBySpaceId(${spaceId})`);
  }
  async clearAll(): Promise<void> {
    console.warn(`STUB: IndexedDBTodoRepository.clearAll()`);
  }
}
