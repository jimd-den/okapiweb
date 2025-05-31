
// src/components/dialogs/edit-action-definition-dialog.tsx
"use client";

import React, { useState, useEffect, type FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from '@/domain/entities/action-definition.entity';
import type { UpdateActionDefinitionUseCase } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import type { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';
import { useActionDefinitionForm } from '@/hooks/use-action-definition-form';
import { PlusCircle, Trash2, GripVertical, Loader2, AlertTriangle as AlertTriangleIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';


interface EditActionDefinitionDialogProps {
  actionDefinition: ActionDefinition;
  isOpen: boolean;
  onClose: () => void;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  onActionDefinitionUpdated: (updatedDefinition: ActionDefinition) => void;
  onActionDefinitionDeleted: (deletedDefinitionId: string) => void;
}

export function EditActionDefinitionDialog({
  actionDefinition,
  isOpen,
  onClose,
  updateActionDefinitionUseCase,
  deleteActionDefinitionUseCase,
  onActionDefinitionUpdated,
  onActionDefinitionDeleted
}: EditActionDefinitionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdateSuccess = useCallback((updatedDef: ActionDefinition) => {
    onActionDefinitionUpdated(updatedDef);
  }, [onActionDefinitionUpdated]);

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
    spaceId: actionDefinition.spaceId,
    initialActionDefinition: actionDefinition,
    updateActionDefinition: updateActionDefinitionUseCase,
    onSuccess: handleUpdateSuccess,
  });

  useEffect(() => {
    if (isOpen && actionDefinition) {
      resetForm();
      setFormError(null);
      setDeleteError(null);
    }
  }, [isOpen, actionDefinition, resetForm]);


  const handleDialogFormSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    try {
      await handleSubmit();
    } catch (error: any) {
      setFormError(error.message || "Failed to update action definition.");
    }
  }, [handleSubmit]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteActionDefinitionUseCase.execute(actionDefinition.id);
      onActionDefinitionDeleted(actionDefinition.id);
    } catch (error: any) {
      console.error("Failed to delete action definition:", error);
      setDeleteError(String(error) || "Could not delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteActionDefinitionUseCase, actionDefinition, onActionDefinitionDeleted]);

  const handleDialogClose = useCallback(() => {
    if (isLoading || isDeleting) return;
    onClose();
  }, [isLoading, isDeleting, onClose]);

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
              <Label htmlFor="edit-action-name" className="text-sm">Action Name</Label>
              <Input id="edit-action-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Daily Standup" required className="text-sm p-2 h-9" disabled={isLoading || isDeleting}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-action-description" className="text-sm">Description (Optional)</Label>
              <Textarea id="edit-action-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe this action" className="text-sm p-2 min-h-[60px]" disabled={isLoading || isDeleting}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-action-type" className="text-sm">Action Type</Label>
                <Select value={type} onValueChange={(value: ActionType) => setType(value)} disabled={isLoading || isDeleting}>
                  <SelectTrigger id="edit-action-type" className="text-sm p-2 h-9">
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
                <Label htmlFor="edit-action-points" className="text-sm">Points for Completion</Label>
                <Input id="edit-action-points" type="number" value={pointsForCompletion} onChange={(e) => setPointsForCompletion(parseInt(e.target.value, 10) || 0)} min="0" className="text-sm p-2 h-9" disabled={isLoading || isDeleting}/>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-action-order" className="text-sm">Display Order (Optional)</Label>
              <Input id="edit-action-order" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)} placeholder="0" className="text-sm p-2 h-9" disabled={isLoading || isDeleting}/>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-action-enabled" checked={isEnabled} onCheckedChange={setIsEnabled} disabled={isLoading || isDeleting}/>
              <Label htmlFor="edit-action-enabled" className="text-sm">Enabled</Label>
            </div>
          </>
        );
      case 1: // Details based on type
        if (type === 'multi-step') {
          return (
            <div className="space-y-2 border p-3 rounded-md">
              <h4 className="text-md font-medium mb-1">Action Steps</h4>
              {steps.map((step, stepIdx) => (
                 <div key={step.id || \`edit-step-\${stepIdx}\`} className="flex flex-col gap-2 p-2 border rounded-md shadow-sm">
                   <div className="flex items-center gap-2">
                     <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0"/>
                     <Input
                        value={step.description || ''}
                        onChange={(e) => handleStepChange(stepIdx, 'description', e.target.value)}
                        placeholder={`Step \${stepIdx + 1} description`}
                        className="text-sm p-1.5 h-8 flex-grow"
                        disabled={isLoading || isDeleting}
                     />
                     <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(stepIdx)} aria-label="Remove step" className="shrink-0 h-7 w-7" disabled={isLoading || isDeleting}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                   </div>
                   <div className="grid grid-cols-2 gap-2 pl-7">
                      <div className='space-y-0.5'>
                        <Label htmlFor={`edit-step-points-\${stepIdx}`} className="text-xs whitespace-nowrap">Points:</Label>
                        <Input
                            id={`edit-step-points-\${stepIdx}`}
                            type="number"
                            value={step.pointsPerStep || 0}
                            onChange={(e) => handleStepChange(stepIdx, 'pointsPerStep', parseInt(e.target.value,10) || 0)}
                            min="0"
                            className="text-xs p-1 w-full h-7"
                            disabled={isLoading || isDeleting}
                        />
                      </div>
                      <div className='space-y-0.5'>
                        <Label htmlFor={`edit-step-type-\${stepIdx}`} className="text-xs">Step Type:</Label>
                        <Select value={step.stepType || 'description'} onValueChange={(val: 'description' | 'data-entry') => handleStepChange(stepIdx, 'stepType', val)} disabled={isLoading || isDeleting}>
                            <SelectTrigger id={`edit-step-type-\${stepIdx}`} className="text-xs p-1 h-7">
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
                        <div key={field.id || \`edit-step-\${stepIdx}-field-\${fieldIdx}\`} className="flex flex-col gap-1 p-1.5 border rounded">
                          <div className="flex items-center justify-between">
                             <Label className="text-xs font-semibold">Field {fieldIdx + 1}</Label>
                             <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFormFieldFromStep(stepIdx, fieldIdx)} aria-label="Remove field from step" className="h-5 w-5 shrink-0" disabled={isLoading || isDeleting}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                              <Input value={field.name || ''} onChange={(e) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'name', e.target.value)} placeholder="Field Name (key)" className="text-xs p-1 h-7" disabled={isLoading || isDeleting}/>
                              <Input value={field.label || ''} onChange={(e) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'label', e.target.value)} placeholder="Display Label" className="text-xs p-1 h-7" disabled={isLoading || isDeleting}/>
                          </div>
                           <Select value={field.fieldType || 'text'} onValueChange={(val: FormFieldDefinition['fieldType']) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'fieldType', val)} disabled={isLoading || isDeleting}>
                            <SelectTrigger className="text-xs p-1 h-7"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text" className="text-xs">Text</SelectItem>
                                <SelectItem value="textarea" className="text-xs">Text Area</SelectItem>
                                <SelectItem value="number" className="text-xs">Number</SelectItem>
                                <SelectItem value="date" className="text-xs">Date</SelectItem>
                                <SelectItem value="barcode" className="text-xs">Barcode Scanner</SelectItem>
                            </SelectContent>
                           </Select>
                           <Input value={field.placeholder || ''} onChange={(e) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'placeholder', e.target.value)} placeholder="Placeholder (optional)" className="text-xs p-1 h-7" disabled={isLoading || isDeleting}/>
                           <div className="flex items-center space-x-1.5">
                            <Checkbox id={`edit-step-\${stepIdx}-field-\${fieldIdx}-required`} checked={!!field.isRequired} onCheckedChange={(checked) => handleFormFieldChangeInStep(stepIdx, fieldIdx, 'isRequired', !!checked)} disabled={isLoading || isDeleting} className="h-3.5 w-3.5"/>
                            <Label htmlFor={`edit-step-\${stepIdx}-field-\${fieldIdx}-required`} className="text-xs">Required</Label>
                           </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="xs" onClick={() => handleAddFormFieldToStep(stepIdx)} className="w-full text-xs h-7 mt-1" disabled={isLoading || isDeleting}><PlusCircle className="mr-1 h-3.5 w-3.5"/>Add Field to Step</Button>
                    </div>
                  )}
                 </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddStep} className="w-full text-sm h-9" disabled={isLoading || isDeleting}>
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
                <div key={field.id || \`edit-form-field-\${index}\`} className="flex flex-col gap-1.5 p-2 border rounded-md shadow-sm">
                  <div className='flex items-center justify-between'>
                    <Label className="text-xs font-semibold">Field {index + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFormField(index)} aria-label="Remove field" className="shrink-0 h-6 w-6" disabled={isLoading || isDeleting}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <Label htmlFor={`edit-field-name-\${index}`} className="text-xs">Field Name (key)</Label>
                      <Input id={`edit-field-name-\${index}`} value={field.name || ''} onChange={(e) => handleFormFieldChange(index, 'name', e.target.value)} placeholder="e.g., customerName" className="text-xs p-1.5 h-8" disabled={isLoading || isDeleting}/>
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor={`edit-field-label-\${index}`} className="text-xs">Display Label</Label>
                      <Input id={`edit-field-label-\${index}`} value={field.label || ''} onChange={(e) => handleFormFieldChange(index, 'label', e.target.value)} placeholder="e.g., Customer Name" className="text-xs p-1.5 h-8" disabled={isLoading || isDeleting}/>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor={`edit-field-type-\${index}`} className="text-xs">Field Type</Label>
                    <Select value={field.fieldType || 'text'} onValueChange={(value: FormFieldDefinition['fieldType']) => handleFormFieldChange(index, 'fieldType', value)} disabled={isLoading || isDeleting}>
                      <SelectTrigger id={`edit-field-type-\${index}`} className="text-xs p-1.5 h-8">
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
                     <Label htmlFor={`edit-field-placeholder-\${index}`} className="text-xs">Placeholder (Optional)</Label>
                     <Input id={`edit-field-placeholder-\${index}`} value={field.placeholder || ''} onChange={(e) => handleFormFieldChange(index, 'placeholder', e.target.value)} placeholder="e.g., Enter value here" className="text-xs p-1.5 h-8" disabled={isLoading || isDeleting}/>
                  </div>
                  <div className="flex items-center space-x-2 pt-0.5">
                    <Checkbox id={`edit-field-required-\${index}`} checked={!!field.isRequired} onCheckedChange={(checked) => handleFormFieldChange(index, 'isRequired', !!checked)} disabled={isLoading || isDeleting}/>
                    <Label htmlFor={`edit-field-required-\${index}`} className="text-xs">Required</Label>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddFormField} className="w-full text-sm h-9" disabled={isLoading || isDeleting}>
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
          <DialogTitle className="text-lg">Edit Action Definition</DialogTitle>
          <DialogDescription className="text-xs">
             {`Step \${currentStepIndex + 1} of \${totalStepsForWizard}: Modify the details for "\${actionDefinition.name}".`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDialogFormSubmit} className="space-y-4 py-2">
          {formError && (
            <Alert variant="destructive" className="p-2 text-xs">
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}

          <DialogFooter className="mt-4 sm:justify-between flex flex-col-reverse sm:flex-row gap-2">
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm" className="w-full sm:w-auto" disabled={isLoading || isDeleting}>
                  {isDeleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : <Trash2 className="mr-1.5 h-4 w-4" />}
                  Delete Action
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="p-4">
                <AlertDialogHeader className="pb-2">
                  <AlertDialogTitle className="flex items-center text-md"><AlertTriangleIcon className="h-5 w-5 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDesc className="text-xs">
                    Are you sure you want to delete "{actionDefinition.name}"? This also removes associated logs. This action cannot be undone.
                  </AlertDialogDesc>
                </AlertDialogHeader>
                {deleteError && (
                  <Alert variant="destructive" className="mt-1 p-2 text-xs">
                    <AlertTriangleIcon className="h-3.5 w-3.5" />
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}
                <AlertDialogFooter className="pt-2">
                  <AlertDialogCancel size="sm" disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80" size="sm" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : null}
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleDialogClose} disabled={isLoading || isDeleting}>Cancel</Button>
               {currentStepIndex > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={prevWizardStep} disabled={isLoading || isDeleting}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
                </Button>
              )}
              {currentStepIndex < totalStepsForWizard - 1 ? (
                <Button type="button" size="sm" onClick={handleNextStepWithValidation} disabled={isLoading || isDeleting}>
                  Next <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" size="sm" disabled={isLoading || isDeleting}>
                  {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
