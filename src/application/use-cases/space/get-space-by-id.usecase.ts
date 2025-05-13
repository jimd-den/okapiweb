// src/application/use-cases/space/get-space-by-id.usecase.ts
import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';

export class GetSpaceByIdUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async execute(id: string): Promise<Space | null> {
    return this.spaceRepository.findById(id);
  }
}
