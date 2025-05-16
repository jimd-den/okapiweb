// src/hooks/use-create-action-definition-form.ts
"use client";

import { useState, type FormEvent, useCallback } from 'react';
import type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { useToast } from '@/hooks/use-toast';

interface UseCreateActionDefinitionFormProps {
  spaceId: string;
  createActionDefinition: (data: CreateActionDefinitionInputDTO) => Promise<ActionDefinition>;
  onSuccess: (newActionDefinition: ActionDefinition) => void;
  initialType?: ActionType;
}

const defaultInitialType: ActionType = 'single';

export function useCreateActionDefinitionForm({
  spaceId,
  createActionDefinition,
  onSuccess,
  initialType = defaultInitialType,
}: UseCreateActionDefinitionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActionType>(initialType);
  const [pointsForCompletion, setPointsForCompletion] = useState<number>(10);
  const [steps, setSteps] = useState<Array<Omit<ActionStep, 'id'>>>([{ description: '', order: 0, pointsPerStep: 0 }]);
  const [formFields, setFormFields] = useState<Array<Omit<FormFieldDefinition, 'id'>>>([{ name: '', label: '', fieldType: 'text', order: 0, isRequired: false, placeholder: '' }]);
  const [order, setOrder] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setType(initialType);
    setPointsForCompletion(10);
    setSteps([{ description: '', order: 0, pointsPerStep: 0 }]);
    setFormFields([{ name: '', label: '', fieldType: 'text', order: 0, isRequired: false, placeholder: '' }]);
    setOrder(0);
  }, [initialType]);

  const handleAddStep = () => {
    setSteps([...steps, { description: '', order: steps.length, pointsPerStep: 0 }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: keyof Omit<ActionStep, 'id' | 'order'>, value: string | number) => {
    const newSteps = [...steps];
    if (field === 'pointsPerStep' && typeof value === 'string') {
      newSteps[index][field] = parseInt(value, 10) || 0;
    } else if (field === 'description' && typeof value === 'string') {
      newSteps[index][field] = value;
    }
    setSteps(newSteps);
  };

  const handleAddFormField = () => {
    setFormFields([...formFields, { name: `field${formFields.length + 1}`, label: `Field ${formFields.length + 1}`, fieldType: 'text', order: formFields.length, isRequired: false, placeholder: '' }]);
  };

  const handleRemoveFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const handleFormFieldChange = (index: number, field: keyof Omit<FormFieldDefinition, 'id' | 'order'>, value: string | boolean | FormFieldDefinition['fieldType']) => {
    const newFormFields = [...formFields];
    const fieldToUpdate = { ...newFormFields[index] }; // Create a new object for the field
    (fieldToUpdate as any)[field] = value; // Type assertion to allow dynamic assignment
    newFormFields[index] = fieldToUpdate;
    setFormFields(newFormFields);
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    setIsLoading(true);

    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Action name is required.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (pointsForCompletion < 0) {
      toast({ title: "Validation Error", description: "Points for completion cannot be negative.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (type === 'multi-step' && steps.some(s => !s.description.trim())) {
      toast({ title: "Validation Error", description: "All step descriptions are required for multi-step actions.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (type === 'data-entry' && formFields.some(f => !f.name.trim() || !f.label.trim())) {
      toast({ title: "Validation Error", description: "All form field names and labels are required for data-entry actions.", variant: "destructive" });
      setIsLoading(false);
      return;
    }


    const actionDefinitionInput: CreateActionDefinitionInputDTO = {
      spaceId,
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      pointsForCompletion,
      steps: type === 'multi-step' ? steps.map((s, i) => ({ ...s, order: i })) : undefined,
      formFields: type === 'data-entry' ? formFields.map((f, i) => ({ ...f, order: i })) : undefined,
      order,
    };

    try {
      const createdActionDefinition = await createActionDefinition(actionDefinitionInput);
      onSuccess(createdActionDefinition);
      toast({
        title: "Action Definition Created!",
        description: `"${createdActionDefinition.name}" is ready.`,
      });
      resetForm();
    } catch (error) {
      console.error("Failed to create action definition:", error);
      toast({
        title: "Error Creating Action Definition",
        description: String(error) || "Could not save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    name, setName,
    description, setDescription,
    type, setType,
    pointsForCompletion, setPointsForCompletion,
    steps, setSteps,
    formFields, setFormFields,
    order, setOrder,
    isLoading,
    resetForm,
    handleAddStep, handleRemoveStep, handleStepChange,
    handleAddFormField, handleRemoveFormField, handleFormFieldChange,
    handleSubmit,
  };
}
