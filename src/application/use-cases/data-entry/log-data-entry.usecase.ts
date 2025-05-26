
// src/application/use-cases/data-entry/log-data-entry.usecase.ts
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
// Removed IUserProgressRepository and related constants as global progress is deprecated

export interface LogDataEntryInputDTO {
  spaceId: string;
  actionDefinitionId: string;
  formData: Record<string, any>; 
}

export interface LogDataEntryResult {
  loggedDataEntry: DataEntryLog;
  // updatedUserProgress: UserProgress; // Removed
}

export class LogDataEntryUseCase {
  constructor(
    private readonly dataEntryLogRepository: IDataEntryLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
    // private readonly userProgressRepository: IUserProgressRepository, // Removed
  ) {}

  async execute(data: LogDataEntryInputDTO): Promise<LogDataEntryResult> {
    const actionDefinition = await this.actionDefinitionRepository.findById(data.actionDefinitionId);
    if (!actionDefinition) {
      throw new Error('ActionDefinition not found');
    }
    if (actionDefinition.type !== 'data-entry') {
      throw new Error('ActionDefinition is not of type data-entry');
    }
    if (!actionDefinition.isEnabled) {
      throw new Error('Action is not enabled');
    }

    if (actionDefinition.formFields) {
      for (const field of actionDefinition.formFields) {
        if (field.isRequired && (data.formData[field.name] === undefined || data.formData[field.name] === '')) {
          throw new Error(`Field "${field.label}" is required.`);
        }
      }
    }

    const pointsToAward = actionDefinition.pointsForCompletion;

    const newDataEntryLog: DataEntryLog = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      actionDefinitionId: data.actionDefinitionId,
      timestamp: new Date().toISOString(),
      data: data.formData,
      pointsAwarded: pointsToAward,
    };

    const loggedDataEntry = await this.dataEntryLogRepository.save(newDataEntryLog);

    // User Progress update logic removed

    return { loggedDataEntry }; // Return only loggedDataEntry
  }
}
