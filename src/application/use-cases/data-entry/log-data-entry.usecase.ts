// src/application/use-cases/data-entry/log-data-entry.usecase.ts
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IUserProgressRepository } from '@/application/ports/repositories/iuser-progress.repository';
import { DEFAULT_USER_ID, POINTS_TO_LEVEL_UP_BASE } from '@/lib/constants';
import type { UserProgress } from '@/domain/entities/user-progress.entity';


export interface LogDataEntryInputDTO {
  spaceId: string;
  actionDefinitionId: string;
  formData: Record<string, any>; // { fieldName: value }
}

export interface LogDataEntryResult {
  loggedDataEntry: DataEntryLog;
  updatedUserProgress: UserProgress;
}

export class LogDataEntryUseCase {
  constructor(
    private readonly dataEntryLogRepository: IDataEntryLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly userProgressRepository: IUserProgressRepository,
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

    // Basic validation: check if all required fields are present
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

    // Update User Progress
    let userProgress = await this.userProgressRepository.findByUserId(DEFAULT_USER_ID);
    if (!userProgress) {
      userProgress = { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] };
    }
    userProgress.points += pointsToAward;
    const pointsNeededForNextLevel = (userProgress.level * POINTS_TO_LEVEL_UP_BASE) * 1.5;
    if (userProgress.points >= pointsNeededForNextLevel && pointsToAward > 0) {
      userProgress.level += 1;
    }
    const updatedUserProgress = await this.userProgressRepository.save(userProgress);

    return { loggedDataEntry, updatedUserProgress };
  }
}
