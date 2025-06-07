
// src/application/use-cases/todo/update-todo.usecase.ts
import type { Todo, TodoStatus } from '@/domain/entities';
import type { ITodoRepository } from '@/application/ports/repositories';

export interface UpdateTodoInputDTO {
  id: string;
  description?: string;
  status?: TodoStatus; 
  completed?: boolean; 
  order?: number;
  beforeImageDataUri?: string | null; 
  afterImageDataUri?: string | null;  
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
      updatedTodo.completed = data.completed;
      if (data.completed) {
        updatedTodo.status = 'done';
        updatedTodo.completionDate = existingTodo.completionDate || new Date().toISOString();
      } else {
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
