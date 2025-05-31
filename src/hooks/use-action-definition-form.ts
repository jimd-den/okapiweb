// src/hooks/use-action-definition-form.ts
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase, CreateActionDefinitionInputDTO } from '@/application/use-cases';
import type { UpdateActionDefinitionUseCase, UpdateActionDefinitionInputDTO } from '@/application/use-cases';

interface UseActionDefinitionFormProps {
  spaceId: string;
  initialActionDefinition?: ActionDefinition | null;
  createActionDefinition?: CreateActionDefinitionUseCase;
  updateActionDefinition?: UpdateActionDefinitionUseCase;
  onSuccess: (actionDefinition: ActionDefinition) => void;
}

const defaultInitialType: ActionType = 'single';

export function useActionDefinitionForm({
  spaceId,
  initialActionDefinition = null,
  createActionDefinition,
  updateActionDefinition,
  onSuccess,
}: UseActionDefinitionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActionType>(defaultInitialType);
  const [pointsForCompletion, setPointsForCompletion] = useState<number>(10);
  const [steps, setSteps] = useState<Array<Partial<Omit<ActionStep, 'order' | 'formFields'>> & { id?: string, formFields?: Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }> }>>([]);
  const [formFields, setFormFields] = useState<Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>>([]);
  const [order, setOrder] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // For wizard-like UI

  const isEditing = !!initialActionDefinition;

  const totalStepsForWizard = (type === 'single' || type === 'timer') ? 1 : 2; // Basic Info -> Type-Specific Details

  const populateForm = useCallback(() => {
    if (initialActionDefinition) {
      setName(initialActionDefinition.name);
      setDescription(initialActionDefinition.description || '');
      setType(initialActionDefinition.type);
      setPointsForCompletion(initialActionDefinition.pointsForCompletion);
      setOrder(initialActionDefinition.order || 0);
      setIsEnabled(initialActionDefinition.isEnabled);
      setSteps(initialActionDefinition.type === 'multi-step' && initialActionDefinition.steps ?
        initialActionDefinition.steps.map(s => ({
          ...s,
          formFields: s.formFields ? s.formFields.map(f => ({ ...f })) : []
        })) :
        [{ description: '', pointsPerStep: 0, stepType: 'description', formFields: [] }]
      );
      setFormFields(initialActionDefinition.type === 'data-entry' && initialActionDefinition.formFields ?
        initialActionDefinition.formFields.map(f => ({ ...f })) :
        [{ name: '', label: '', fieldType: 'text', isRequired: false, placeholder: '' }]
      );
    } else {
      setName('');
      setDescription('');
      setType(defaultInitialType);
      setPointsForCompletion(10);
      setSteps([{ description: '', pointsPerStep: 0, stepType: 'description', formFields: [] }]);
      setFormFields([{ name: '', label: '', fieldType: 'text', isRequired: false, placeholder: '' }]);
      setOrder(0);
      setIsEnabled(true);
    }
    setCurrentStepIndex(0);
  }, [initialActionDefinition]);

  useEffect(() => {
    populateForm();
  }, [populateForm]);

  // For top-level form fields (when type is 'data-entry')
  const handleAddFormField = useCallback(() => {
    setFormFields(prevFields => [...prevFields, { name: `field${prevFields.length + 1}`, label: `Field ${prevFields.length + 1}`, fieldType: 'text', order: prevFields.length, isRequired: false, placeholder: '' }]);
  }, []);
  const handleRemoveFormField = useCallback((index: number) => {
    setFormFields(prevFields => prevFields.filter((_, i) => i !== index));
  }, []);
  const handleFormFieldChange = useCallback((index: number, field: keyof Omit<FormFieldDefinition, 'order'>, value: string | boolean | FormFieldDefinition['fieldType']) => {
    setFormFields(prevFields => prevFields.map((ff, i) => {
        if (i === index) {
            const updatedField = { ...ff };
            (updatedField as any)[field] = value;
            return updatedField;
        }
        return ff;
    }));
  }, []);

  // For steps (when type is 'multi-step')
  const handleAddStep = useCallback(() => {
    setSteps(prevSteps => [...prevSteps, { description: '', pointsPerStep: 0, stepType: 'description', formFields: [], order: prevSteps.length }]);
  }, []);
  const handleRemoveStep = useCallback((index: number) => {
    setSteps(prevSteps => prevSteps.filter((_, i) => i !== index));
  }, []);
  const handleStepChange = useCallback((index: number, field: keyof Omit<ActionStep, 'order' | 'formFields'>, value: string | number | ActionStep['stepType']) => {
    setSteps(prevSteps => prevSteps.map((s, i) => {
      if (i === index) {
        const updatedStep = { ...s };
        if (field === 'pointsPerStep' && typeof value === 'string') {
          updatedStep.pointsPerStep = parseInt(value, 10) || 0;
        } else if ((field === 'description' || field === 'id' || field === 'stepType') && typeof value === 'string') {
          (updatedStep as any)[field] = value;
        } else if (typeof value === 'number') {
             (updatedStep as any)[field] = value;
        }
        if (field === 'stepType' && value !== 'data-entry') {
          updatedStep.formFields = []; // Clear form fields if not data-entry type
        }
        return updatedStep;
      }
      return s;
    }));
  }, []);

  // For form fields within a step
  const handleAddFormFieldToStep = useCallback((stepIndex: number) => {
    setSteps(prevSteps => prevSteps.map((step, i) => {
      if (i === stepIndex) {
        const newFormFields = [...(step.formFields || []), { name: `field${(step.formFields || []).length + 1}`, label: `Field ${(step.formFields || []).length + 1}`, fieldType: 'text', isRequired: false, placeholder: '' }];
        return { ...step, formFields: newFormFields };
      }
      return step;
    }));
  }, []);
  const handleRemoveFormFieldFromStep = useCallback((stepIndex: number, fieldIndex: number) => {
    setSteps(prevSteps => prevSteps.map((step, i) => {
      if (i === stepIndex) {
        const newFormFields = (step.formFields || []).filter((_, fi) => fi !== fieldIndex);
        return { ...step, formFields: newFormFields };
      }
      return step;
    }));
  }, []);
  const handleFormFieldChangeInStep = useCallback((stepIndex: number, fieldIndex: number, fieldName: keyof Omit<FormFieldDefinition, 'order'>, value: string | boolean | FormFieldDefinition['fieldType']) => {
    setSteps(prevSteps => prevSteps.map((step, i) => {
      if (i === stepIndex) {
        const newFormFields = (step.formFields || []).map((formField, fi) => {
          if (fi === fieldIndex) {
            const updatedFormField = { ...formField };
            (updatedFormField as any)[fieldName] = value;
            return updatedFormField;
          }
          return formField;
        });
        return { ...step, formFields: newFormFields };
      }
      return step;
    }));
  }, []);

  const nextWizardStep = useCallback(() => {
    if (currentStepIndex === 0 && !name.trim()) {
        throw new Error("Action name is required to proceed.");
    }
    setCurrentStepIndex(prev => Math.min(prev + 1, totalStepsForWizard - 1));
  }, [currentStepIndex, name, totalStepsForWizard]);

  const prevWizardStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async (event?: FormEvent): Promise<ActionDefinition> => {
    event?.preventDefault();
    setIsLoading(true);

    if (!name.trim()) {
      setIsLoading(false);
      throw new Error("Action name is required.");
    }
    if (pointsForCompletion < 0) {
      setIsLoading(false);
      throw new Error("Points for completion cannot be negative.");
    }
    if (type === 'multi-step') {
      for (const step of steps) {
        if (!(step.description || '').trim()) {
          setIsLoading(false);
          throw new Error("All step descriptions are required for multi-step actions.");
        }
        if (step.stepType === 'data-entry') {
          for (const ff of (step.formFields || [])) {
            if (!(ff.name || '').trim() || !(ff.label || '').trim()) {
              setIsLoading(false);
              throw new Error(`All form field names and labels are required for step: "${step.description}".`);
            }
          }
        }
      }
    }
    if (type === 'data-entry' && formFields.some(f => !(f.name || '').trim() || !(f.label || '').trim())) {
      setIsLoading(false);
      throw new Error("All form field names and labels are required for data-entry actions.");
    }

    try {
      let resultActionDefinition: ActionDefinition;
      const processedSteps = type === 'multi-step' ? steps.map((s, i) => ({
        id: s.id || undefined,
        description: s.description || '',
        pointsPerStep: s.pointsPerStep || 0,
        order: i,
        stepType: s.stepType || 'description',
        formFields: s.stepType === 'data-entry' ? (s.formFields || []).map((ff, fi) => ({
          id: ff.id || undefined,
          name: ff.name || '',
          label: ff.label || '',
          fieldType: ff.fieldType || 'text',
          isRequired: !!ff.isRequired,
          placeholder: ff.placeholder || '',
          order: fi,
        })) : undefined,
      })) : undefined;

      const processedFormFields = type === 'data-entry' ? formFields.map((f, i) => ({
        id: f.id || undefined,
        name: f.name || '',
        label: f.label || '',
        fieldType: f.fieldType || 'text',
        isRequired: !!f.isRequired,
        placeholder: f.placeholder || '',
        order: i,
      })) : undefined;

      if (initialActionDefinition && updateActionDefinition) {
        const updateData: UpdateActionDefinitionInputDTO = {
          id: initialActionDefinition.id,
          name: name.trim(),
          description: description.trim() || null,
          type,
          pointsForCompletion,
          steps: processedSteps,
          formFields: processedFormFields,
          order,
          isEnabled,
        };
        resultActionDefinition = await updateActionDefinition.execute(updateData);
      } else if (createActionDefinition) {
        const createData: CreateActionDefinitionInputDTO = {
          spaceId,
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          pointsForCompletion,
          steps: processedSteps?.map(s => ({...s, id: undefined})), // Ensure IDs are not passed for creation
          formFields: processedFormFields?.map(f => ({...f, id: undefined})), // Ensure IDs are not passed for creation
          order,
        };
        resultActionDefinition = await createActionDefinition.execute(createData);
      } else {
        throw new Error("Appropriate action definition use case (create or update) not provided to the form hook.");
      }
      onSuccess(resultActionDefinition);
      if (!initialActionDefinition) populateForm();
      return resultActionDefinition;
    } catch (error: any) {
      console.error("Failed to save action definition:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    spaceId, initialActionDefinition, name, description, type, pointsForCompletion, steps, formFields, order, isEnabled,
    createActionDefinition, updateActionDefinition, onSuccess, populateForm
  ]);

  const resetForm = useCallback(() => populateForm(), [populateForm]);

  return {
    name, setName,
    description, setDescription,
    type, setType,
    pointsForCompletion, setPointsForCompletion,
    steps, setSteps,
    formFields, setFormFields,
    order, setOrder,
    isEnabled, setIsEnabled,
    isLoading,
    resetForm,
    handleAddStep, handleRemoveStep, handleStepChange,
    handleAddFormField, handleRemoveFormField, handleFormFieldChange,
    handleAddFormFieldToStep, handleRemoveFormFieldFromStep, handleFormFieldChangeInStep,
    handleSubmit,
    currentStepIndex,
    totalStepsForWizard,
    nextWizardStep,
    prevWizardStep,
    isEditing,
  };
}
