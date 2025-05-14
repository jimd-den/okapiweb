// src/application/use-cases/problem/create-problem.usecase.ts
import type { Problem } from '@/domain/entities/problem.entity';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';

export interface CreateProblemInputDTO {
  spaceId: string;
  type: 'Waste' | 'Blocker' | 'Issue';
  description: string;
}

export class CreateProblemUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(data: CreateProblemInputDTO): Promise<Problem> {
    if (!data.description.trim()) {
      throw new Error('Problem description cannot be empty.');
    }

    const now = new Date().toISOString();
    const newProblem: Problem = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      type: data.type,
      description: data.description.trim(),
      timestamp: now,
      lastModifiedDate: now,
      resolved: false,
    };

    return this.problemRepository.save(newProblem);
  }
}
