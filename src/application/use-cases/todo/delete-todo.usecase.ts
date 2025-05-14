// src/application/use-cases/todo/delete-todo.usecase.ts
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';

export class DeleteTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(id: string): Promise<void> {
    const existingTodo = await this.todoRepository.findById(id);
    if (!existingTodo) {
      // Optionally, decide if throwing an error or silently succeeding is better.
      // For now, let's be explicit.
      throw new Error('Todo not found for deletion.');
    }
    return this.todoRepository.delete(id);
  }
}
