
// src/components/dialogs/create-action-definition-dialog.tsx
"use client";

import { useEffect, type FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'; // Removed DialogClose, DialogTrigger
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionDefinition, ActionType, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { useActionDefinitionForm } from '@/hooks/use-action-definition-form';
import { PlusCircle, Trash2, GripVertical, FileText, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateActionDefinitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  onActionDefinitionCreated: (newActionDefinition: ActionDefinition) => void;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
}

export function CreateActionDefinitionDialog({
  isOpen,
  onClose,
  spaceId,
  onActionDefinitionCreated,
  createActionDefinitionUseCase
}: CreateActionDefinitionDialogProps) {

  const handleSuccess = useCallback((newActionDef: ActionDefinition) => {
    onActionDefinitionCreated(newActionDef); // Parent now handles closing after this
  }, [onActionDefinitionCreated]);

  const {
    name, setName,
    description, setDescription,
    type, setType,
    pointsForCompletion, setPointsForCompletion,
    steps,
    formFields,
    order, setOrder,
    isLoading,
    resetForm,
    handleAddStep, handleRemoveStep, handleStepChange,
    handleAddFormField, handleRemoveFormField, handleFormFieldChange,
    handleSubmit,
  } = useActionDefinitionForm({
    spaceId,
    createActionDefinition: createActionDefinitionUseCase,
    onSuccess: handleSuccess,
  });

  useEffect(() => {
    if (isOpen) {
      resetForm(); 
    }
  }, [isOpen, resetForm]);

  const handleFormSubmit = useCallback((event: FormEvent) => {
    event.preventDefault();
    handleSubmit();
  }, [handleSubmit]);

  // Use the onClose prop for Radix Dialog's onOpenChange
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      if (!isLoading) { // Prevent closing if form is submitting
        onClose();
      }
    }
  }, [onClose, isLoading]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Action Definition</DialogTitle>
          <DialogDescription className="text-md">
            Define a new action, checklist, or data entry form for this space.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-6 py-4">
          <div className="space-y-1">
            <Label htmlFor="action-name" className="text-md">Action Name</Label>
            <Input id="action-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Daily Standup, Log Expense" required className="text-md p-3" disabled={isLoading} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="action-description" className="text-md">Description (Optional)</Label>
            <Textarea id="action-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe this action" className="text-md p-3 min-h-[80px]" disabled={isLoading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="action-type" className="text-md">Action Type</Label>
              <Select value={type} onValueChange={(value: ActionType) => setType(value)} disabled={isLoading}>
                <SelectTrigger id="action-type" className="text-md p-3 h-auto">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single" className="text-md">Single Action</SelectItem>
                  <SelectItem value="multi-step" className="text-md">Multi-Step Checklist</SelectItem>
                  <SelectItem value="data-entry" className="text-md">Data Entry Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="action-points" className="text-md">Points for Completion</Label>
              <Input id="action-points" type="number" value={pointsForCompletion} onChange={(e) => setPointsForCompletion(parseInt(e.target.value, 10) || 0)} min="0" className="text-md p-3" disabled={isLoading}/>
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
                      value={step.description || ''}
                      onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                      placeholder={`Step ${index + 1} description`}
                      className="text-md p-2"
                      disabled={isLoading}
                    />
                     <div className="flex items-center gap-2">
                        <Label htmlFor={`step-points-${index}`} className="text-sm whitespace-nowrap">Points per step:</Label>
                        <Input
                            id={`step-points-${index}`}
                            type="number"
                            value={step.pointsPerStep || 0}
                            onChange={(e) => handleStepChange(index, 'pointsPerStep', parseInt(e.target.value,10) || 0)}
                            min="0"
                            className="text-sm p-1 w-20"
                            disabled={isLoading}
                        />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(index)} aria-label="Remove step" className="shrink-0" disabled={isLoading}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddStep} className="w-full text-md" disabled={isLoading}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add Step
              </Button>
            </div>
          )}

          {type === 'data-entry' && (
            <div className="space-y-3 border p-4 rounded-md">
              <h4 className="text-lg font-medium">Form Fields</h4>
              {formFields.map((field, index) => (
                <div key={index} className="flex flex-col gap-2 p-3 border rounded-md shadow-sm">
                  <div className='flex items-center justify-between'>
                    <Label className="text-sm font-semibold">Field {index + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFormField(index)} aria-label="Remove field" className="shrink-0" disabled={isLoading}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`field-name-${index}`} className="text-xs">Field Name (key)</Label>
                      <Input id={`field-name-${index}`} value={field.name || ''} onChange={(e) => handleFormFieldChange(index, 'name', e.target.value)} placeholder="e.g., customerName" className="text-sm p-2" disabled={isLoading}/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`field-label-${index}`} className="text-xs">Display Label</Label>
                      <Input id={`field-label-${index}`} value={field.label || ''} onChange={(e) => handleFormFieldChange(index, 'label', e.target.value)} placeholder="e.g., Customer Name" className="text-sm p-2" disabled={isLoading}/>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`field-type-${index}`} className="text-xs">Field Type</Label>
                    <Select value={field.fieldType || 'text'} onValueChange={(value: FormFieldDefinition['fieldType']) => handleFormFieldChange(index, 'fieldType', value)} disabled={isLoading}>
                      <SelectTrigger id={`field-type-${index}`} className="text-sm p-2 h-auto">
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text" className="text-sm">Text</SelectItem>
                        <SelectItem value="textarea" className="text-sm">Text Area</SelectItem>
                        <SelectItem value="number" className="text-sm">Number</SelectItem>
                        <SelectItem value="date" className="text-sm">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                     <Label htmlFor={`field-placeholder-${index}`} className="text-xs">Placeholder (Optional)</Label>
                     <Input id={`field-placeholder-${index}`} value={field.placeholder || ''} onChange={(e) => handleFormFieldChange(index, 'placeholder', e.target.value)} placeholder="e.g., Enter value here" className="text-sm p-2" disabled={isLoading}/>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox id={`field-required-${index}`} checked={!!field.isRequired} onCheckedChange={(checked) => handleFormFieldChange(index, 'isRequired', !!checked)} disabled={isLoading}/>
                    <Label htmlFor={`field-required-${index}`} className="text-xs">Required</Label>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddFormField} className="w-full text-md" disabled={isLoading}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add Form Field
              </Button>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="action-order" className="text-md">Display Order (Optional)</Label>
            <Input id="action-order" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)} placeholder="0" className="text-md p-3" disabled={isLoading}/>
          </div>

          <DialogFooter className="mt-8">
            <Button type="button" variant="outline" size="lg" className="text-md" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" size="lg" className="text-md" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Action"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
