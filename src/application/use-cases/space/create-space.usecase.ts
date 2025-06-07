
// src/application/use-cases/space/create-space.usecase.ts
import type { Space } from '@/domain/entities';
import type { ISpaceRepository } from '@/application/ports/repositories';

export interface CreateSpaceInputDTO extends Omit<Space, 'id' | 'creationDate' | 'date'> { // date is now handled outside
}

export class CreateSpaceUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async execute(data: CreateSpaceInputDTO & { date: string }): Promise<Space> { // date is explicitly passed in
    if (!data.date) {
      throw new Error('Date is required to create a space.');
    }
    const newSpace: Space = {
      ...data,
      id: self.crypto.randomUUID(),
      creationDate: new Date().toISOString(), 
      tags: data.tags || [],
    };
    return this.spaceRepository.save(newSpace);
  }
}
