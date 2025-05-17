// src/hooks/use-action-definition-form.ts
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import type { UpdateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import { useToast } from '@/hooks/use-toast';

interface UseActionDefinitionFormProps {
  spaceId: string;
  initialActionDefinition?: ActionDefinition | null;
  createActionDefinition?: (data: CreateActionDefinitionInputDTO) => Promise<ActionDefinition>;
  updateActionDefinition?: (data: UpdateActionDefinitionInputDTO) => Promise<ActionDefinition>;
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
  const { toast } = useToast();

  const populateForm = useCallback((actionDef: ActionDefinition | null) => {
    if (actionDef) {
      setName(actionDef.name);
      setDescription(actionDef.description || '');
      setType(actionDef.type);
      setPointsForCompletion(actionDef.pointsForCompletion);
      setOrder(actionDef.order || 0);
      setIsEnabled(actionDef.isEnabled);
      setSteps(actionDef.type === 'multi-step' && actionDef.steps ? actionDef.steps.map(s => ({ ...s })) : [{ description: '', pointsPerStep: 0, order: 0 }]);
      setFormFields(actionDef.type === 'data-entry' && actionDef.formFields ? actionDef.formFields.map(f => ({ ...f })) : [{ name: '', label: '', fieldType: 'text', isRequired: false, order: 0, placeholder: '' }]);
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
  }, []);

  useEffect(() => {
    populateForm(initialActionDefinition);
  }, [initialActionDefinition, populateForm]);


  const handleAddStep = () => {
    setSteps([...steps, { description: '', pointsPerStep: 0, order: steps.length }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: keyof Omit<ActionStep, 'order'>, value: string | number) => {
    const newSteps = steps.map((s, i) => {
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
    });
    setSteps(newSteps);
  };

  const handleAddFormField = () => {
    setFormFields([...formFields, { name: `field${formFields.length + 1}`, label: `Field ${formFields.length + 1}`, fieldType: 'text', order: formFields.length, isRequired: false, placeholder: '' }]);
  };

  const handleRemoveFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const handleFormFieldChange = (index: number, field: keyof Omit<FormFieldDefinition, 'order'>, value: string | boolean | FormFieldDefinition['fieldType']) => {
    const newFormFields = formFields.map((ff, i) => {
        if (i === index) {
            const updatedField = { ...ff };
            (updatedField as any)[field] = value;
            return updatedField;
        }
        return ff;
    });
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
    if (type === 'multi-step' && steps.some(s => !(s.description || '').trim())) {
      toast({ title: "Validation Error", description: "All step descriptions are required for multi-step actions.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (type === 'data-entry' && formFields.some(f => !(f.name || '').trim() || !(f.label || '').trim())) {
      toast({ title: "Validation Error", description: "All form field names and labels are required for data-entry actions.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      let resultActionDefinition: ActionDefinition;
      if (initialActionDefinition && updateActionDefinition) { // Editing existing
        const updateData: UpdateActionDefinitionInputDTO = {
          id: initialActionDefinition.id,
          name: name.trim(),
          description: description.trim() || null,
          type,
          pointsForCompletion,
          steps: type === 'multi-step' ? steps.map((s, i) => ({ ...s, description: s.description || '', pointsPerStep: s.pointsPerStep || 0, order: i })) : undefined,
          formFields: type === 'data-entry' ? formFields.map((f, i) => ({ ...f, name: f.name || '', label: f.label || '', fieldType: f.fieldType || 'text', isRequired: !!f.isRequired, order: i })) : undefined,
          order,
          isEnabled,
        };
        resultActionDefinition = await updateActionDefinition(updateData);
        toast({ title: "Action Definition Updated!", description: `"${resultActionDefinition.name}" has been saved.` });
      } else if (createActionDefinition) { // Creating new
        const createData: CreateActionDefinitionInputDTO = {
          spaceId,
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          pointsForCompletion,
          steps: type === 'multi-step' ? steps.map((s, i) => ({ ...s, description: s.description || '', pointsPerStep: s.pointsPerStep || 0, order: i })) : undefined,
          formFields: type === 'data-entry' ? formFields.map((f, i) => ({ ...f, name: f.name || '', label: f.label || '', fieldType: f.fieldType || 'text', isRequired: !!f.isRequired, order: i })) : undefined,
          order,
        };
        resultActionDefinition = await createActionDefinition(createData);
        toast({ title: "Action Definition Created!", description: `"${resultActionDefinition.name}" is ready.` });
      } else {
        throw new Error("Appropriate action definition use case (create or update) not provided to the form hook.");
      }
      onSuccess(resultActionDefinition);
      if (!initialActionDefinition) populateForm(null); // Reset form only if it was a create operation
    } catch (error) {
      console.error("Failed to save action definition:", error);
      toast({
        title: `Error ${initialActionDefinition ? 'Updating' : 'Creating'} Action Definition`,
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
    isEnabled, setIsEnabled,
    isLoading,
    resetForm: () => populateForm(initialActionDefinition), // reset to initial or blank
    handleAddStep, handleRemoveStep, handleStepChange,
    handleAddFormField, handleRemoveFormField, handleFormFieldChange,
    handleSubmit,
  };
}
