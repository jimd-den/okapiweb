// src/application/use-cases/problem/delete-problem.usecase.ts
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';

export class DeleteProblemUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(id: string): Promise<void> {
    const existingProblem = await this.problemRepository.findById(id);
    if (!existingProblem) {
      throw new Error('Problem not found for deletion.');
    }
    return this.problemRepository.delete(id);
  }
}
