// src/application/use-cases/data-entry/get-data-entries-by-space.usecase.ts
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';

export class GetDataEntriesBySpaceUseCase {
  constructor(private readonly dataEntryLogRepository: IDataEntryLogRepository) {}

  async execute(spaceId: string): Promise<DataEntryLog[]> {
    // Basic implementation, could add filtering/pagination later
    const entries = await this.dataEntryLogRepository.findBySpaceId(spaceId);
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
