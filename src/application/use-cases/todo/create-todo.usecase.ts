// src/application/use-cases/todo/create-todo.usecase.ts
import type { Todo } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';

export interface CreateTodoInputDTO {
  spaceId: string;
  description: string;
  order?: number;
}

export class CreateTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(data: CreateTodoInputDTO): Promise<Todo> {
    if (!data.description.trim()) {
      throw new Error('Todo description cannot be empty.');
    }

    const now = new Date().toISOString();
    const newTodo: Todo = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      description: data.description.trim(),
      completed: false,
      creationDate: now,
      lastModifiedDate: now,
      order: data.order,
      // beforeImageUrl and afterImageUrl are optional and not handled in this basic version
    };

    return this.todoRepository.save(newTodo);
  }
}
