// src/application/use-cases/problem/get-problems-by-space.usecase.ts
import type { Problem } from '@/domain/entities/problem.entity';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';

export class GetProblemsBySpaceUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(spaceId: string): Promise<Problem[]> {
    return this.problemRepository.findBySpaceId(spaceId);
  }
}
