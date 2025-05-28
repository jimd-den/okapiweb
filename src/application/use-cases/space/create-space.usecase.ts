// src/application/use-cases/space/create-space.usecase.ts
import type { Space } from '@/domain/entities/space.entity';
import type { ISpaceRepository } from '@/application/ports/repositories/ispace.repository';

export interface CreateSpaceInputDTO extends Omit<Space, 'id' | 'creationDate'> {
  // date is now a required field in the Space entity
}

export class CreateSpaceUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async execute(data: CreateSpaceInputDTO): Promise<Space> {
    if (!data.date) {
      throw new Error('Date is required to create a space.');
    }
    const newSpace: Space = {
      ...data,
      id: self.crypto.randomUUID(),
      creationDate: new Date().toISOString(), // This is the record creation time
      tags: data.tags || [],
      // date is passed in data
    };
    return this.spaceRepository.save(newSpace);
  }
}
