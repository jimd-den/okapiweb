
// src/hooks/use-action-definition-form.ts
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionInputDTO, CreateActionDefinitionUseCase } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import type { UpdateActionDefinitionInputDTO, UpdateActionDefinitionUseCase } from '@/application/use-cases/action-definition/update-action-definition.usecase';

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
  const [steps, setSteps] = useState<Array<Partial<Omit<ActionStep, 'order'>> & { id?: string }>>([]);
  const [formFields, setFormFields] = useState<Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>>([]);
  const [order, setOrder] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // For wizard form

  const isEditing = !!initialActionDefinition;

  const totalStepsForWizard = type === 'single' ? 1 : 2; // Step 0: Basic, Step 1: Details (steps/formFields)

  const populateForm = useCallback(() => {
    if (initialActionDefinition) {
      setName(initialActionDefinition.name);
      setDescription(initialActionDefinition.description || '');
      setType(initialActionDefinition.type);
      setPointsForCompletion(initialActionDefinition.pointsForCompletion);
      setOrder(initialActionDefinition.order || 0);
      setIsEnabled(initialActionDefinition.isEnabled);
      setSteps(initialActionDefinition.type === 'multi-step' && initialActionDefinition.steps ? initialActionDefinition.steps.map(s => ({ ...s })) : [{ description: '', pointsPerStep: 0, order: 0 }]);
      setFormFields(initialActionDefinition.type === 'data-entry' && initialActionDefinition.formFields ? initialActionDefinition.formFields.map(f => ({ ...f })) : [{ name: '', label: '', fieldType: 'text', isRequired: false, order: 0, placeholder: '' }]);
    } else {
      setName('');
      setDescription('');
      setType(defaultInitialType);
      setPointsForCompletion(10);
      setSteps([{ description: '', pointsPerStep: 0, order: 0 }]);
      setFormFields([{ name: '', label: '', fieldType: 'text', isRequired: false, order: 0, placeholder: '' }]);
      setOrder(0);
      setIsEnabled(true);
    }
    setCurrentStepIndex(0); // Always reset to first step when form populates/resets
  }, [initialActionDefinition, setType, setName, setDescription, setPointsForCompletion, setOrder, setIsEnabled, setSteps, setFormFields, setCurrentStepIndex]);

  useEffect(() => {
    populateForm();
  }, [initialActionDefinition, populateForm]);

  const handleAddStep = useCallback(() => {
    setSteps(prevSteps => [...prevSteps, { description: '', pointsPerStep: 0, order: prevSteps.length }]);
  }, [setSteps]);

  const handleRemoveStep = useCallback((index: number) => {
    setSteps(prevSteps => prevSteps.filter((_, i) => i !== index));
  }, [setSteps]);

  const handleStepChange = useCallback((index: number, field: keyof Omit<ActionStep, 'order'>, value: string | number) => {
    setSteps(prevSteps => prevSteps.map((s, i) => {
      if (i === index) {
        const updatedStep = { ...s };
        if (field === 'pointsPerStep' && typeof value === 'string') {
          updatedStep.pointsPerStep = parseInt(value, 10) || 0;
        } else if (field === 'description' && typeof value === 'string') {
          updatedStep.description = value;
        } else if (field === 'id' && typeof value === 'string') {
          updatedStep.id = value;
        }
        return updatedStep;
      }
      return s;
    }));
  }, [setSteps]);

  const handleAddFormField = useCallback(() => {
    setFormFields(prevFields => [...prevFields, { name: `field${prevFields.length + 1}`, label: `Field ${prevFields.length + 1}`, fieldType: 'text', order: prevFields.length, isRequired: false, placeholder: '' }]);
  }, [setFormFields]);

  const handleRemoveFormField = useCallback((index: number) => {
    setFormFields(prevFields => prevFields.filter((_, i) => i !== index));
  }, [setFormFields]);

  const handleFormFieldChange = useCallback((index: number, field: keyof Omit<FormFieldDefinition, 'order'>, value: string | boolean | FormFieldDefinition['fieldType']) => {
    setFormFields(prevFields => prevFields.map((ff, i) => {
        if (i === index) {
            const updatedField = { ...ff };
            (updatedField as any)[field] = value;
            return updatedField;
        }
        return ff;
    }));
  }, [setFormFields]);

  const nextWizardStep = useCallback(() => {
    // Basic validation for current step before proceeding (optional, can be enhanced)
    if (currentStepIndex === 0 && !name.trim()) {
        alert("Action name is required to proceed."); // Simple alert, can be replaced with inline error
        return;
    }
    setCurrentStepIndex(prev => Math.min(prev + 1, totalStepsForWizard - 1));
  }, [currentStepIndex, name, totalStepsForWizard, setCurrentStepIndex]);

  const prevWizardStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, [setCurrentStepIndex]);
  
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
    if (type === 'multi-step' && steps.some(s => !(s.description || '').trim())) {
      setIsLoading(false);
      throw new Error("All step descriptions are required for multi-step actions.");
    }
    if (type === 'data-entry' && formFields.some(f => !(f.name || '').trim() || !(f.label || '').trim())) {
      setIsLoading(false);
      throw new Error("All form field names and labels are required for data-entry actions.");
    }

    try {
      let resultActionDefinition: ActionDefinition;
      if (initialActionDefinition && updateActionDefinition) { 
        const updateData: UpdateActionDefinitionInputDTO = {
          id: initialActionDefinition.id,
          name: name.trim(),
          description: description.trim() || null,
          type,
          pointsForCompletion,
          steps: type === 'multi-step' ? steps.map((s, i) => ({ ...s, id: s.id || undefined , description: s.description || '', pointsPerStep: s.pointsPerStep || 0, order: i })) : undefined,
          formFields: type === 'data-entry' ? formFields.map((f, i) => ({ ...f, id: f.id || undefined, name: f.name || '', label: f.label || '', fieldType: f.fieldType || 'text', isRequired: !!f.isRequired, order: i })) : undefined,
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
          steps: type === 'multi-step' ? steps.map((s, i) => ({ description: s.description || '', pointsPerStep: s.pointsPerStep || 0 })) : undefined,
          formFields: type === 'data-entry' ? formFields.map((f, i) => ({ name: f.name || '', label: f.label || '', fieldType: f.fieldType || 'text', isRequired: !!f.isRequired })) : undefined,
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
    handleSubmit,
    // Wizard related
    currentStepIndex,
    totalStepsForWizard,
    nextWizardStep,
    prevWizardStep,
    isEditing,
  };
}
