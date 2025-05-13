// src/application/ports/repositories/itodo.repository.ts
import type { Todo } from '@/domain/entities/todo.entity';

export interface ITodoRepository {
  findById(id: string): Promise<Todo | null>;
  findBySpaceId(spaceId: string): Promise<Todo[]>;
  getAll(): Promise<Todo[]>;
  save(todo: Todo): Promise<Todo>;
  delete(id: string): Promise<void>;
  deleteBySpaceId(spaceId: string): Promise<void>;
  clearAll(): Promise<void>;
}
