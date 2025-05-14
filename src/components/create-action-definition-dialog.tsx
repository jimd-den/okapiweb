// src/components/create-action-definition-dialog.tsx
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionDefinition, ActionStep } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';

interface CreateActionDefinitionDialogProps {
  spaceId: string;
  onActionDefinitionCreated: (newActionDefinition: ActionDefinition) => void;
  createActionDefinition: (data: CreateActionDefinitionInputDTO) => Promise<ActionDefinition>;
}

export function CreateActionDefinitionDialog({ spaceId, onActionDefinitionCreated, createActionDefinition }: CreateActionDefinitionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'single' | 'multi-step'>('single');
  const [pointsForCompletion, setPointsForCompletion] = useState<number>(10);
  const [steps, setSteps] = useState<Array<Omit<ActionStep, 'id'>>>([{ description: '', order: 0, pointsPerStep: 0 }]);
  const [order, setOrder] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('single');
    setPointsForCompletion(10);
    setSteps([{ description: '', order: 0, pointsPerStep: 0 }]);
    setOrder(0);
  };

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
  
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
      onActionDefinitionCreated(createdActionDefinition);
      toast({
        title: "Action Definition Created!",
        description: `"${createdActionDefinition.name}" is ready.`,
      });
      setIsOpen(false);
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
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
