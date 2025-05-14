// src/components/create-action-definition-dialog.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { useCreateActionDefinitionForm } from '@/hooks/use-create-action-definition-form';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';

interface CreateActionDefinitionDialogProps {
  spaceId: string;
  onActionDefinitionCreated: (newActionDefinition: ActionDefinition) => void;
  createActionDefinition: (data: CreateActionDefinitionInputDTO) => Promise<ActionDefinition>;
}

export function CreateActionDefinitionDialog({ spaceId, onActionDefinitionCreated, createActionDefinition }: CreateActionDefinitionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    name, setName,
    description, setDescription,
    type, setType,
    pointsForCompletion, setPointsForCompletion,
    steps,
    order, setOrder,
    isLoading,
    resetForm,
    handleAddStep,
    handleRemoveStep,
    handleStepChange,
    handleSubmit,
  } = useCreateActionDefinitionForm({
    spaceId,
    createActionDefinition,
    onSuccess: (newActionDef) => {
      onActionDefinitionCreated(newActionDef);
      setIsOpen(false); // Close dialog on success
    }
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault(); // Prevent default form submission if called from form element
    handleSubmit();
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="text-md">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Action
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Action Definition</DialogTitle>
          <DialogDescription className="text-md">
            Define a new action or checklist for this space.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-6 py-4">
          <div className="space-y-1">
            <Label htmlFor="action-name" className="text-md">Action Name</Label>
            <Input id="action-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Daily Standup" required className="text-md p-3" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="action-description" className="text-md">Description (Optional)</Label>
            <Textarea id="action-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe this action" className="text-md p-3 min-h-[80px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="action-type" className="text-md">Action Type</Label>
              <Select value={type} onValueChange={(value: 'single' | 'multi-step') => setType(value)}>
                <SelectTrigger id="action-type" className="text-md p-3 h-auto">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single" className="text-md">Single Action</SelectItem>
                  <SelectItem value="multi-step" className="text-md">Multi-Step Checklist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="action-points" className="text-md">Points for Completion</Label>
              <Input id="action-points" type="number" value={pointsForCompletion} onChange={(e) => setPointsForCompletion(parseInt(e.target.value, 10) || 0)} min="0" className="text-md p-3" />
            </div>
          </div>
          
          {type === 'multi-step' && (
            <div className="space-y-3 border p-4 rounded-md">
              <h4 className="text-lg font-medium">Action Steps</h4>
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 p-2 border-b last:border-b-0">
                  <GripVertical className="h-6 w-6 text-muted-foreground mt-2 cursor-grab"/>
                  <div className="flex-grow space-y-1">
                    <Input
                      value={step.description}
                      onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                      placeholder={`Step ${index + 1} description`}
                      className="text-md p-2"
                    />
                     <div className="flex items-center gap-2">
                        <Label htmlFor={`step-points-${index}`} className="text-sm whitespace-nowrap">Points per step:</Label>
                        <Input
                            id={`step-points-${index}`}
                            type="number"
                            value={step.pointsPerStep || 0}
                            onChange={(e) => handleStepChange(index, 'pointsPerStep', e.target.value)}
                            min="0"
                            className="text-sm p-1 w-20"
                        />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(index)} aria-label="Remove step" className="shrink-0">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddStep} className="w-full text-md">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Step
              </Button>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="action-order" className="text-md">Display Order (Optional)</Label>
            <Input id="action-order" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)} placeholder="0" className="text-md p-3" />
          </div>

          <DialogFooter className="mt-8">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg" className="text-md" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" size="lg" className="text-md" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Action"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
