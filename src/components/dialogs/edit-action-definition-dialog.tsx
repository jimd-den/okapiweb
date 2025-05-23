
// src/components/dialogs/edit-action-definition-dialog.tsx
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
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
  actionDefinition: ActionDefinition; // Non-optional for editing
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
    handleSubmit,
    // Wizard related
    currentStepIndex,
    totalStepsForWizard,
    nextWizardStep,
    prevWizardStep,
  } = useActionDefinitionForm({
    spaceId: actionDefinition.spaceId, // Required by hook, taken from existing action
    initialActionDefinition: actionDefinition,
    updateActionDefinition: updateActionDefinitionUseCase,
    onSuccess: handleUpdateSuccess,
  });

  useEffect(() => {
    if (isOpen && actionDefinition) { // Ensure actionDefinition is passed before resetting
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
  
  // Render step content logic (similar to CreateActionDefinitionDialog)
  const renderStepContent = () => {
    switch (currentStepIndex) {
      case 0: // Basic Info
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="edit-action-name" className="text-md">Action Name</Label>
              <Input id="edit-action-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Daily Standup" required className="text-md p-3" disabled={isLoading || isDeleting}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-action-description" className="text-md">Description (Optional)</Label>
              <Textarea id="edit-action-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe this action" className="text-md p-3 min-h-[80px]" disabled={isLoading || isDeleting}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-action-type" className="text-md">Action Type</Label>
                <Select value={type} onValueChange={(value: ActionType) => setType(value)} disabled={isLoading || isDeleting}>
                  <SelectTrigger id="edit-action-type" className="text-md p-3 h-auto">
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
                <Label htmlFor="edit-action-points" className="text-md">Points for Completion</Label>
                <Input id="edit-action-points" type="number" value={pointsForCompletion} onChange={(e) => setPointsForCompletion(parseInt(e.target.value, 10) || 0)} min="0" className="text-md p-3" disabled={isLoading || isDeleting}/>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-action-order" className="text-md">Display Order (Optional)</Label>
              <Input id="edit-action-order" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)} placeholder="0" className="text-md p-3" disabled={isLoading || isDeleting}/>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-action-enabled" checked={isEnabled} onCheckedChange={setIsEnabled} disabled={isLoading || isDeleting}/>
              <Label htmlFor="edit-action-enabled" className="text-md">Enabled</Label>
            </div>
            <p className="text-xs text-muted-foreground">If disabled, this action won't be loggable or appear active.</p>
          </>
        );
      case 1: // Details based on type
        if (type === 'multi-step') {
          return (
            <div className="space-y-3 border p-4 rounded-md">
              <h4 className="text-lg font-medium">Action Steps</h4>
              {steps.map((step, index) => (
                <div key={step.id || `edit-step-${index}`} className="flex items-start gap-2 p-2 border-b last:border-b-0">
                  <GripVertical className="h-6 w-6 text-muted-foreground mt-2 cursor-grab"/>
                  <div className="flex-grow space-y-1">
                    <Input
                      value={step.description || ''}
                      onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                      placeholder={`Step ${index + 1} description`}
                      className="text-md p-2"
                      disabled={isLoading || isDeleting}
                    />
                     <div className="flex items-center gap-2">
                        <Label htmlFor={`edit-step-points-${index}`} className="text-sm whitespace-nowrap">Points per step:</Label>
                        <Input
                            id={`edit-step-points-${index}`}
                            type="number"
                            value={step.pointsPerStep || 0}
                            onChange={(e) => handleStepChange(index, 'pointsPerStep', parseInt(e.target.value,10) || 0)}
                            min="0"
                            className="text-sm p-1 w-20"
                            disabled={isLoading || isDeleting}
                        />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(index)} aria-label="Remove step" className="shrink-0" disabled={isLoading || isDeleting}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddStep} className="w-full text-md" disabled={isLoading || isDeleting}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add Step
              </Button>
            </div>
          );
        }
        if (type === 'data-entry') {
           return (
             <div className="space-y-3 border p-4 rounded-md">
              <h4 className="text-lg font-medium">Form Fields</h4>
              {formFields.map((field, index) => (
                <div key={field.id || `edit-form-field-${index}`} className="flex flex-col gap-2 p-3 border rounded-md shadow-sm">
                  <div className='flex items-center justify-between'>
                    <Label className="text-sm font-semibold">Field {index + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFormField(index)} aria-label="Remove field" className="shrink-0" disabled={isLoading || isDeleting}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`edit-field-name-${index}`} className="text-xs">Field Name (key)</Label>
                      <Input id={`edit-field-name-${index}`} value={field.name || ''} onChange={(e) => handleFormFieldChange(index, 'name', e.target.value)} placeholder="e.g., customerName" className="text-sm p-2" disabled={isLoading || isDeleting}/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`edit-field-label-${index}`} className="text-xs">Display Label</Label>
                      <Input id={`edit-field-label-${index}`} value={field.label || ''} onChange={(e) => handleFormFieldChange(index, 'label', e.target.value)} placeholder="e.g., Customer Name" className="text-sm p-2" disabled={isLoading || isDeleting}/>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`edit-field-type-${index}`} className="text-xs">Field Type</Label>
                    <Select value={field.fieldType || 'text'} onValueChange={(value: FormFieldDefinition['fieldType']) => handleFormFieldChange(index, 'fieldType', value)} disabled={isLoading || isDeleting}>
                      <SelectTrigger id={`edit-field-type-${index}`} className="text-sm p-2 h-auto">
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
                     <Label htmlFor={`edit-field-placeholder-${index}`} className="text-xs">Placeholder (Optional)</Label>
                     <Input id={`edit-field-placeholder-${index}`} value={field.placeholder || ''} onChange={(e) => handleFormFieldChange(index, 'placeholder', e.target.value)} placeholder="e.g., Enter value here" className="text-sm p-2" disabled={isLoading || isDeleting}/>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox id={`edit-field-required-${index}`} checked={!!field.isRequired} onCheckedChange={(checked) => handleFormFieldChange(index, 'isRequired', !!checked)} disabled={isLoading || isDeleting}/>
                    <Label htmlFor={`edit-field-required-${index}`} className="text-xs">Required</Label>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddFormField} className="w-full text-md" disabled={isLoading || isDeleting}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add Form Field
              </Button>
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Action Definition</DialogTitle>
          <DialogDescription className="text-md">
             {`Step ${currentStepIndex + 1} of ${totalStepsForWizard}: Modify the details for "${actionDefinition.name}".`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDialogFormSubmit} className="space-y-6 py-4">
          {formError && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          {renderStepContent()}

          <DialogFooter className="mt-8 sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="lg" className="text-md" disabled={isLoading || isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Trash2 className="mr-2 h-5 w-5" />}
                  Delete Action
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center"><AlertTriangleIcon className="h-6 w-6 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDesc>
                    Are you sure you want to delete the action "{actionDefinition.name}"? This will also remove all associated logs. This action cannot be undone.
                  </AlertDialogDesc>
                </AlertDialogHeader>
                {deleteError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="lg" className="text-md" onClick={onClose} disabled={isLoading || isDeleting}>Cancel</Button>
               {currentStepIndex > 0 && (
                <Button type="button" variant="outline" size="lg" onClick={prevWizardStep} disabled={isLoading || isDeleting}>
                  <ArrowLeft className="mr-2 h-5 w-5" /> Previous
                </Button>
              )}
              {currentStepIndex < totalStepsForWizard - 1 ? (
                <Button type="button" size="lg" onClick={nextWizardStep} disabled={isLoading || isDeleting}>
                  Next <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button type="submit" size="lg" className="text-md" disabled={isLoading || isDeleting}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
