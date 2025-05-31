
// src/application/use-cases/data-entry/log-data-entry.usecase.ts
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

export interface LogDataEntryInputDTO {
  spaceId: string;
  actionDefinitionId: string; // ID of the parent ActionDefinition (could be 'data-entry' or 'multi-step')
  stepId?: string; // Optional: ID of the ActionStep if this entry is for a step in a 'multi-step' action
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
      pointsToAward = actionDefinition.pointsForCompletion; // Points from parent action for top-level data entry
    } else if (actionDefinition.type === 'multi-step' && data.stepId) {
      const step = actionDefinition.steps?.find(s => s.id === data.stepId);
      if (!step) throw new Error(`Step with id ${data.stepId} not found in ActionDefinition ${actionDefinition.id}`);
      if (step.stepType !== 'data-entry') throw new Error(`Step ${data.stepId} is not a data-entry step.`);
      formFieldsToValidate = step.formFields;
      // For data entry within a step, points are typically awarded for completing the step itself,
      // not separately for the data entry part of the step unless specifically designed.
      // If step-specific data entry should award points, this needs to come from `step.pointsPerStep`
      // or a new field like `step.pointsForDataEntry`. For now, assume data entry within a step
      // does not award separate points *through this use case*. Step completion points are handled by LogActionUseCase.
      // We can still set points here if the overall ActionDefinition.pointsForCompletion is intended to cover this.
      // For now, let's assume no specific points for sub-step data entry via this direct log, it's part of step completion.
      // However, the `DataEntryLog` entity has `pointsAwarded`, so we might want to set it if needed in future.
      // Let's set to 0 for sub-step data entries, as the step completion will award points.
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
      actionDefinitionId: data.actionDefinitionId, // Parent ActionDef ID
      stepId: data.stepId, // Optional: Step ID if part of multi-step
      timestamp: new Date().toISOString(),
      data: data.formData,
      pointsAwarded: pointsToAward,
    };

    const loggedDataEntry = await this.dataEntryLogRepository.save(newDataEntryLog);
    return { loggedDataEntry };
  }
}
