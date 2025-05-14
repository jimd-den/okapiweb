// src/application/use-cases/todo/update-todo.usecase.ts
import type { Todo } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';

export interface UpdateTodoInputDTO {
  id: string;
  description?: string;
  completed?: boolean;
  order?: number;
}

export class UpdateTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(data: UpdateTodoInputDTO): Promise<Todo> {
    const existingTodo = await this.todoRepository.findById(data.id);
    if (!existingTodo) {
      throw new Error('Todo not found.');
    }

    const updatedTodo: Todo = { ...existingTodo };

    if (data.description !== undefined) {
      if (!data.description.trim()) {
        throw new Error('Todo description cannot be empty.');
      }
      updatedTodo.description = data.description.trim();
    }

    if (data.completed !== undefined) {
      updatedTodo.completed = data.completed;
      updatedTodo.completionDate = data.completed ? new Date().toISOString() : undefined;
    }
    
    if (data.order !== undefined) {
        updatedTodo.order = data.order;
    }

    updatedTodo.lastModifiedDate = new Date().toISOString();

    return this.todoRepository.save(updatedTodo);
  }
}
