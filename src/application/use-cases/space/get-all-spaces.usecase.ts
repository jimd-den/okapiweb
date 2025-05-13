// src/application/use-cases/space/get-all-spaces.usecase.ts
import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';

export class GetAllSpacesUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async execute(): Promise<Space[]> {
    return this.spaceRepository.getAll();
  }
}
