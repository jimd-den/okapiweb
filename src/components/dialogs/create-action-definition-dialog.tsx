
// src/components/dialogs/create-action-definition-dialog.tsx
"use client";

import React, { useEffect, type FormEvent, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionDefinition, ActionType, FormFieldDefinition } from '@/domain/entities';
import type { CreateActionDefinitionUseCase } from '@/application/use-cases';
import { useActionDefinitionForm } from '@/hooks';
import { PlusCircle, Trash2, GripVertical, Loader2, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';


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
  const [formError, setFormError] = useState<string | null>(null);

  const handleSuccess = useCallback((newActionDef: ActionDefinition) => {
    onActionDefinitionCreated(newActionDef);
  }, [onActionDefinitionCreated]);

  const {
    name, setName,
    description, setDescription,
    type, setType,
    pointsForCompletion, setPointsForCompletion,
    steps,
    formFields,
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
  } = useActionDefinitionForm({
    spaceId,
    createActionDefinition: createActionDefinitionUseCase,
    onSuccess: handleSuccess,
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setFormError(null);
    }
  }, [isOpen, resetForm]);

  const handleDialogFormSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    try {
      await handleSubmit();
    } catch (error: any) {
      setFormError(error.message || "Failed to create action definition.");
    }
  }, [handleSubmit]);

  const handleDialogClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  const handleNextStepWithValidation = () => {
    setFormError(null);
    try {
        nextWizardStep();
    } catch (error:any) {
        setFormError(error.message || "Please complete required fields.");
    }
  }

  const renderStepContent = () => {
    switch (currentStepIndex) {
      case 0: // Basic Info
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="create-action-name" className="text-sm">Action Name</Label>
              <Input id="create-action-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Daily Standup" required className="text-sm p-2 h-9" disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-action-description" className="text-sm">Description (Optional)</Label>
              <Textarea id="create-action-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe this action" className="text-sm p-2 min-h-[60px]" disabled={isLoading} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="create-action-type" className="text-sm">Action Type</Label>
                <Select value={type} onValueChange={(value: ActionType) => { setType(value); }} disabled={isLoading}>
                  <SelectTrigger id="create-action-type" className="text-sm p-2 h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single" className="text-sm">Single Action</SelectItem>
                    <SelectItem value="multi-step" className="text-sm">Multi-Step Checklist</SelectItem>
                    <SelectItem value="data-entry" className="text-sm">Data Entry Form</SelectItem>
                    <SelectItem value="timer" className="text-sm">Timer Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-action-points" className="text-sm">Points for Completion</Label>
                <Input id="create-action-points" type="number" value={pointsForCompletion} onChange={(e) => setPointsForCompletion(parseInt(e.target.value, 10) || 0)} min="0" className="text-sm p-2 h-9" disabled={isLoading}/>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-action-order" className="text-sm">Display Order (Optional)</Label>
              <Input id="create-action-order" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)} placeholder="0" className="text-sm p-2 h-9" disabled={isLoading}/>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="create-action-enabled" checked={isEnabled} onCheckedChange={(checked) => setIsEnabled(!!checked)} disabled={isLoading} />
              <Label htmlFor="create-action-enabled" className="text-sm">Enabled</Label>
            </div>
          </>
        );
      case 1: // Type-Specific Details
        if (type === 'multi-step') {
          return (
            <div className="space-y-2 border p-3 rounded-md">
              <h4 className="text-md font-medium mb-1">Action Steps</h4>
              {steps.map((step, stepIdx) => (
                <div key={`step-${stepIdx}`} className="flex flex-col gap-2 p-2 border rounded-md shadow-sm">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0"/>
                    <Input
                      value={step.description || ''}
                      onChange={(e) => handleStepChange(stepIdx, 'description', e.target.value)}
                      placeholder={`Step ${stepIdx + 1} description`}
                      className="text-sm p-1.5 h-8 flex-grow"
                      disabled={isLoading}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(stepIdx)} aria-label="Remove step" className="shrink-0 h-7 w-7" disabled={isLoading}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-7">
                    <div className='space-y-0.5'>
                      <Label htmlFor={`step-points-${stepIdx}`} className="text-xs whitespace-nowrap">Points:</Label>
                      <Input
                          id={`step-points-${stepIdx}`}
                          type="number"
                          value={step.pointsPerStep || 0}
                          onChange={(e) => handleStepChange(stepIdx, 'pointsPerStep', parseInt(e.target.value,10) || 0)}
                          min="0"
                          className="text-xs p-1 w-full h-7"
                          disabled={isLoading}
                      />
                    </div>
                    <div className='space-y-0.5'>
                       <Label htmlFor={`step-type-${stepIdx}`} className="text-xs">Step Type:</Label>
                       <Select value={step.stepType || 'description'} onValueChange={(val: 'description' | 'data-entry') => handleStepChange(stepIdx, 'stepType', val)} disabled={isLoading}>
                          <SelectTrigger id={`step-type-${stepIdx}`} className="text-xs p-1 h-7">
                            <SelectValue/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="description" className="text-xs">Description</SelectItem>
                            <SelectItem value="data-entry" className="text-xs">Data Entry</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                  </div>
                  {step.stepType === 'data-entry' && (
                    <div className="pl-7 mt-1 space-y-1.5 border-t pt-1.5">
                      <h5 className="text-xs font-medium text-muted-foreground">Step Form Fields:</h5>
                      {(step.formFields || []).map((field, fieldIdx) => (
                        <div key={`step-${stepIdx}-field-${fieldIdx}`} className="flex flex-col gap-1 p-1.5 border rounded">
                          <div className="flex items-center justify-between">
                             <Label className="text-xs font-semibold">Field {fieldIdx + 1}</Label>
                             <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFormFieldFromStep(stepIdx, fieldIdx)} aria-label="Remove field from step" className="h-5 w-5 shrink-0" disabled={isLoading}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                              <Input value={field.name || ''} onChange={(e) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'name', e.target.value)} placeholder="Field Name (key)" className="text-xs p-1 h-7" disabled={isLoading}/>
                              <Input value={field.label || ''} onChange={(e) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'label', e.target.value)} placeholder="Display Label" className="text-xs p-1 h-7" disabled={isLoading}/>
                          </div>
                           <Select value={field.fieldType || 'text'} onValueChange={(val: FormFieldDefinition['fieldType']) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'fieldType', val)} disabled={isLoading}>
                            <SelectTrigger className="text-xs p-1 h-7"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text" className="text-xs">Text</SelectItem>
                                <SelectItem value="textarea" className="text-xs">Text Area</SelectItem>
                                <SelectItem value="number" className="text-xs">Number</SelectItem>
                                <SelectItem value="date" className="text-xs">Date</SelectItem>
                                <SelectItem value="barcode" className="text-xs">Barcode Scanner</SelectItem>
                            </SelectContent>
                           </Select>
                           <Input value={field.placeholder || ''} onChange={(e) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'placeholder', e.target.value)} placeholder="Placeholder (optional)" className="text-xs p-1 h-7" disabled={isLoading}/>
                           <div className="flex items-center space-x-1.5">
                            <Checkbox id={`step-${stepIdx}-field-${fieldIdx}-required`} checked={!!field.isRequired} onCheckedChange={(checked) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'isRequired', !!checked)} disabled={isLoading} className="h-3.5 w-3.5"/>
                            <Label htmlFor={`step-${stepIdx}-field-${fieldIdx}-required`} className="text-xs">Required</Label>
                           </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="xs" onClick={() => handleAddFormFieldToStep(stepIdx)} className="w-full text-xs h-7 mt-1" disabled={isLoading}><PlusCircle className="mr-1 h-3.5 w-3.5"/>Add Field to Step</Button>
                    </div>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddStep} className="w-full text-sm h-9" disabled={isLoading}>
                <PlusCircle className="mr-1.5 h-4 w-4" /> Add Step
              </Button>
            </div>
          );
        }
        if (type === 'data-entry') {
          return (
             <div className="space-y-2 border p-3 rounded-md">
              <h4 className="text-md font-medium">Form Fields</h4>
              {formFields.map((field, index) => (
                <div key={index} className="flex flex-col gap-1.5 p-2 border rounded-md shadow-sm">
                  <div className='flex items-center justify-between'>
                    <Label className="text-xs font-semibold">Field {index + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFormField(index)} aria-label="Remove field" className="shrink-0 h-6 w-6" disabled={isLoading}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <Label htmlFor={`create-field-name-${index}`} className="text-xs">Field Name (key)</Label>
                      <Input id={`create-field-name-${index}`} value={field.name || ''} onChange={(e) => handleFormFieldChange(index, 'name', e.target.value)} placeholder="e.g., customerName" className="text-xs p-1.5 h-8" disabled={isLoading}/>
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor={`create-field-label-${index}`} className="text-xs">Display Label</Label>
                      <Input id={`create-field-label-${index}`} value={field.label || ''} onChange={(e) => handleFormFieldChange(index, 'label', e.target.value)} placeholder="e.g., Customer Name" className="text-xs p-1.5 h-8" disabled={isLoading}/>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor={`create-field-type-${index}`} className="text-xs">Field Type</Label>
                    <Select value={field.fieldType || 'text'} onValueChange={(value: FormFieldDefinition['fieldType']) => handleFormFieldChange(index, 'fieldType', value)} disabled={isLoading}>
                      <SelectTrigger id={`create-field-type-${index}`} className="text-xs p-1.5 h-8">
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text" className="text-xs">Text</SelectItem>
                        <SelectItem value="textarea" className="text-xs">Text Area</SelectItem>
                        <SelectItem value="number" className="text-xs">Number</SelectItem>
                        <SelectItem value="date" className="text-xs">Date</SelectItem>
                        <SelectItem value="barcode" className="text-xs">Barcode Scanner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-0.5">
                     <Label htmlFor={`create-field-placeholder-${index}`} className="text-xs">Placeholder (Optional)</Label>
                     <Input id={`create-field-placeholder-${index}`} value={field.placeholder || ''} onChange={(e) => handleFormFieldChange(index, 'placeholder', e.target.value)} placeholder="e.g., Enter value here" className="text-xs p-1.5 h-8" disabled={isLoading}/>
                  </div>
                  <div className="flex items-center space-x-2 pt-0.5">
                    <Checkbox id={`create-field-required-${index}`} checked={!!field.isRequired} onCheckedChange={(checked) => handleFormFieldChange(index, 'isRequired', !!checked)} disabled={isLoading}/>
                    <Label htmlFor={`create-field-required-${index}`} className="text-xs">Required</Label>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddFormField} className="w-full text-sm h-9" disabled={isLoading}>
                <PlusCircle className="mr-1.5 h-4 w-4" /> Add Form Field
              </Button>
            </div>
          );
        }
        if (type === 'single' || type === 'timer') {
            return <p className="text-sm text-muted-foreground">No specific configuration needed for this action type beyond basic info.</p>;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Create New Action Definition</DialogTitle>
          <DialogDescription className="text-xs">
            {`Step ${currentStepIndex + 1} of ${totalStepsForWizard}: Fill in the details for this action.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDialogFormSubmit} className="space-y-4 py-2">
          {formError && (
            <Alert variant="destructive" className="p-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}

          <DialogFooter className="mt-4 flex justify-between w-full sm:justify-between">
            <Button type="button" variant="outline" size="sm" onClick={handleDialogClose} disabled={isLoading}>Cancel</Button>
            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={prevWizardStep} disabled={isLoading}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
                </Button>
              )}
              {currentStepIndex < totalStepsForWizard - 1 ? (
                <Button type="button" size="sm" onClick={handleNextStepWithValidation} disabled={isLoading}>
                  Next <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" size="sm" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Create Action
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
