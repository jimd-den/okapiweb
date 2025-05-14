// src/application/use-cases/todo/get-todos-by-space.usecase.ts
import type { Todo } from '@/domain/entities/todo.entity';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';

export class GetTodosBySpaceUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(spaceId: string): Promise<Todo[]> {
    return this.todoRepository.findBySpaceId(spaceId);
  }
}
