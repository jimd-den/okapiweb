// src/application/use-cases/problem/update-problem.usecase.ts
import type { Problem } from '@/domain/entities/problem.entity';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';

export interface UpdateProblemInputDTO {
  id: string;
  description?: string;
  type?: 'Waste' | 'Blocker' | 'Issue';
  resolved?: boolean;
  resolutionNotes?: string;
}

export class UpdateProblemUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(data: UpdateProblemInputDTO): Promise<Problem> {
    const existingProblem = await this.problemRepository.findById(data.id);
    if (!existingProblem) {
      throw new Error('Problem not found.');
    }

    const updatedProblem: Problem = { ...existingProblem };

    if (data.description !== undefined) {
      if (!data.description.trim()) {
        throw new Error('Problem description cannot be empty.');
      }
      updatedProblem.description = data.description.trim();
    }
    if (data.type !== undefined) {
      updatedProblem.type = data.type;
    }
    if (data.resolved !== undefined) {
      updatedProblem.resolved = data.resolved;
    }
    if (data.resolutionNotes !== undefined) {
      updatedProblem.resolutionNotes = data.resolutionNotes.trim() || undefined;
    }
    
    updatedProblem.lastModifiedDate = new Date().toISOString();

    return this.problemRepository.save(updatedProblem);
  }
}
