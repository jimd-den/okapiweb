// src/application/use-cases/data-entry/update-data-entry.usecase.ts
import type { DataEntryLog, FormFieldDefinition } from '@/domain/entities';
import type { IDataEntryLogRepository, IActionDefinitionRepository } from '@/application/ports/repositories';

export interface UpdateDataEntryInputDTO {
  id: string; // ID of the DataEntryLog to update
  formData: Record<string, any>;
  // spaceId and actionDefinitionId/stepId are not directly updatable, they are for context
}

export class UpdateDataEntryUseCase {
  constructor(
    private readonly dataEntryLogRepository: IDataEntryLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository
  ) {}

  async execute(data: UpdateDataEntryInputDTO): Promise<DataEntryLog> {
    const existingEntry = await this.dataEntryLogRepository.findById(data.id);
    if (!existingEntry) {
      throw new Error('DataEntryLog not found for update.');
    }

    const actionDefinition = await this.actionDefinitionRepository.findById(existingEntry.actionDefinitionId);
    if (!actionDefinition) {
      throw new Error('Associated ActionDefinition not found.');
    }

    let formFieldsToValidate: FormFieldDefinition[] | undefined;
    if (actionDefinition.type === 'data-entry') {
      formFieldsToValidate = actionDefinition.formFields;
    } else if (actionDefinition.type === 'multi-step' && existingEntry.stepId) {
      const step = actionDefinition.steps?.find(s => s.id === existingEntry.stepId);
      if (!step || step.stepType !== 'data-entry') {
        throw new Error('Associated step for data entry not found or not of type data-entry.');
      }
      formFieldsToValidate = step.formFields;
    } else {
      throw new Error('Could not determine form fields for validation.');
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

    const updatedEntry: DataEntryLog = {
      ...existingEntry,
      data: data.formData,
      timestamp: new Date().toISOString(), // Update timestamp on edit
    };

    return this.dataEntryLogRepository.save(updatedEntry);
  }
}
