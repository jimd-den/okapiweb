// src/application/use-cases/space/create-space.usecase.ts
import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';

export interface CreateSpaceInputDTO extends Omit<Space, 'id' | 'creationDate'> {
  // any additional input transformation if needed
}

export class CreateSpaceUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async execute(data: CreateSpaceInputDTO): Promise<Space> {
    const newSpace: Space = {
      ...data,
      id: self.crypto.randomUUID(),
      creationDate: new Date().toISOString(),
      tags: data.tags || [],
    };
    return this.spaceRepository.save(newSpace);
  }
}

