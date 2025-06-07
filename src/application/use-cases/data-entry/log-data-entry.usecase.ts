
// src/application/use-cases/data-entry/log-data-entry.usecase.ts
import type { DataEntryLog } from '@/domain/entities';
import type { IDataEntryLogRepository, IActionDefinitionRepository } from '@/application/ports/repositories';

export interface LogDataEntryInputDTO {
  spaceId: string;
  actionDefinitionId: string; 
  stepId?: string; 
  formData: Record<string, any>; 
}

export interface LogDataEntryResult {
  loggedDataEntry: DataEntryLog;
}

export class LogDataEntryUseCase {
  constructor(
    private readonly dataEntryLogRepository: IDataEntryLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
  ) {}

  async execute(data: LogDataEntryInputDTO): Promise<LogDataEntryResult> {
    const actionDefinition = await this.actionDefinitionRepository.findById(data.actionDefinitionId);
    if (!actionDefinition) {
      throw new Error('ActionDefinition not found');
    }
    if (!actionDefinition.isEnabled) {
      throw new Error('Parent ActionDefinition is not enabled');
    }

    let formFieldsToValidate;
    let pointsToAward = 0;

    if (actionDefinition.type === 'data-entry') {
      formFieldsToValidate = actionDefinition.formFields;
      pointsToAward = actionDefinition.pointsForCompletion; 
    } else if (actionDefinition.type === 'multi-step' && data.stepId) {
      const step = actionDefinition.steps?.find(s => s.id === data.stepId);
      if (!step) throw new Error(`Step with id ${data.stepId} not found in ActionDefinition ${actionDefinition.id}`);
      if (step.stepType !== 'data-entry') throw new Error(`Step ${data.stepId} is not a data-entry step.`);
      formFieldsToValidate = step.formFields;
      pointsToAward = 0; 
    } else {
      throw new Error('ActionDefinition is not of type data-entry, or stepId is missing for multi-step data entry.');
    }

    if (formFieldsToValidate) {
      for (const field of formFieldsToValidate) {
        if (field.isRequired && (data.formData[field.name] === undefined || String(data.formData[field.name]).trim() === '')) {
          throw new Error(`Field "${field.label}" is required.`);
        }
        if (field.fieldType === 'number' && data.formData[field.name] !== '' && data.formData[field.name] !== undefined && isNaN(Number(data.formData[field.name]))) {
          throw new Error(`Field "${field.label}" must be a valid number.`);
        }
      }
    }
    
    const newDataEntryLog: DataEntryLog = {
      id: self.crypto.randomUUID(),
      spaceId: data.spaceId,
      actionDefinitionId: data.actionDefinitionId, 
      stepId: data.stepId, 
      timestamp: new Date().toISOString(),
      data: data.formData,
      pointsAwarded: pointsToAward,
    };

    const loggedDataEntry = await this.dataEntryLogRepository.save(newDataEntryLog);
    return { loggedDataEntry };
  }
}
