// src/application/use-cases/todo/update-todo.usecase.ts
import type { Todo, TodoStatus } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';

export interface UpdateTodoInputDTO {
  id: string;
  description?: string;
  status?: TodoStatus; // Allow updating status
  completed?: boolean; // Keep for compatibility, but status takes precedence
  order?: number;
  beforeImageDataUri?: string | null; // Use null to signify removal of image
  afterImageDataUri?: string | null;  // Use null to signify removal of image
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

    if (data.status !== undefined) {
      updatedTodo.status = data.status;
      if (data.status === 'done') {
        updatedTodo.completed = true;
        updatedTodo.completionDate = existingTodo.completionDate || new Date().toISOString();
      } else {
        updatedTodo.completed = false;
        updatedTodo.completionDate = undefined;
      }
    } else if (data.completed !== undefined && data.status === undefined) {
      // Handle updates via 'completed' if status is not directly provided
      updatedTodo.completed = data.completed;
      if (data.completed) {
        updatedTodo.status = 'done';
        updatedTodo.completionDate = existingTodo.completionDate || new Date().toISOString();
      } else {
        // If un-completing, revert to 'todo' or 'doing' based on previous non-'done' status
        // For simplicity, we'll revert to 'todo' if it was 'done'.
        // A more sophisticated approach might remember the previous state.
        updatedTodo.status = existingTodo.status === 'done' ? 'todo' : existingTodo.status;
        updatedTodo.completionDate = undefined;
      }
    }
    
    if (data.order !== undefined) {
        updatedTodo.order = data.order;
    }

    if (data.beforeImageDataUri !== undefined) {
      updatedTodo.beforeImageDataUri = data.beforeImageDataUri === null ? undefined : data.beforeImageDataUri;
    }
    if (data.afterImageDataUri !== undefined) {
      updatedTodo.afterImageDataUri = data.afterImageDataUri === null ? undefined : data.afterImageDataUri;
    }

    updatedTodo.lastModifiedDate = new Date().toISOString();

    return this.todoRepository.save(updatedTodo);
  }
}
