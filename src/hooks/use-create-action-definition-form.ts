// src/hooks/use-create-action-definition-form.ts
"use client";

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import type { ActionDefinition, ActionStep } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { useToast } from '@/hooks/use-toast';

interface UseCreateActionDefinitionFormProps {
  spaceId: string;
  createActionDefinition: (data: CreateActionDefinitionInputDTO) => Promise<ActionDefinition>;
  onSuccess: (newActionDefinition: ActionDefinition) => void;
  initialType?: 'single' | 'multi-step';
}

export function useCreateActionDefinitionForm({
  spaceId,
  createActionDefinition,
  onSuccess,
  initialType = 'single',
}: UseCreateActionDefinitionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'single' | 'multi-step'>(initialType);
  const [pointsForCompletion, setPointsForCompletion] = useState<number>(10);
  const [steps, setSteps] = useState<Array<Omit<ActionStep, 'id'>>>([{ description: '', order: 0, pointsPerStep: 0 }]);
  const [order, setOrder] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setType(initialType);
    setPointsForCompletion(10);
    setSteps([{ description: '', order: 0, pointsPerStep: 0 }]);
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

    const actionDefinitionInput: CreateActionDefinitionInputDTO = {
      spaceId,
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      pointsForCompletion,
      steps: type === 'multi-step' ? steps.map((s, i) => ({ ...s, order: i })) : undefined,
      order,
    };

    try {
      const createdActionDefinition = await createActionDefinition(actionDefinitionInput);
      onSuccess(createdActionDefinition);
      toast({
        title: "Action Definition Created!",
        description: `"${createdActionDefinition.name}" is ready.`,
      });
      resetForm(); // Reset form on success
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
    order, setOrder,
    isLoading,
    resetForm,
    handleAddStep,
    handleRemoveStep,
    handleStepChange,
    handleSubmit,
  };
}
