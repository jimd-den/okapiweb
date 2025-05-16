// src/components/dialogs/edit-action-definition-dialog.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ActionDefinition, ActionStep, FormFieldDefinition, ActionType } from '@/domain/entities/action-definition.entity';
import type { UpdateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, GripVertical, Loader2, AlertTriangle, FileText } from 'lucide-react';
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


interface EditActionDefinitionDialogProps {
  actionDefinition: ActionDefinition;
  isOpen: boolean;
  onClose: () => void;
  updateActionDefinition: (data: UpdateActionDefinitionInputDTO) => Promise<ActionDefinition>;
  deleteActionDefinition: (id: string) => Promise<void>;
}

export function EditActionDefinitionDialog({
  actionDefinition,
  isOpen,
  onClose,
  updateActionDefinition,
  deleteActionDefinition
}: EditActionDefinitionDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActionType>('single');
  const [pointsForCompletion, setPointsForCompletion] = useState(0);
  const [steps, setSteps] = useState<Array<Partial<Omit<ActionStep, 'order'>> & { id?: string }>>([]);
  const [formFields, setFormFields] = useState<Array<Partial<Omit<FormFieldDefinition, 'order'>> & { id?: string }>>([]);
  const [order, setOrder] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (actionDefinition) {
      setName(actionDefinition.name);
      setDescription(actionDefinition.description || '');
      setType(actionDefinition.type);
      setPointsForCompletion(actionDefinition.pointsForCompletion);
      setOrder(actionDefinition.order || 0);
      setIsEnabled(actionDefinition.isEnabled);

      if (actionDefinition.type === 'multi-step' && actionDefinition.steps) {
        setSteps(actionDefinition.steps.map(s => ({ ...s })));
        setFormFields([{ name: '', label: '', fieldType: 'text', isRequired: false, order: 0, placeholder: '' }]); // Reset form fields
      } else if (actionDefinition.type === 'data-entry' && actionDefinition.formFields) {
        setFormFields(actionDefinition.formFields.map(f => ({ ...f })));
        setSteps([{ description: '', pointsPerStep: 0, order: 0 }]); // Reset steps
      } else {
         setSteps([{ description: '', pointsPerStep: 0, order: 0 }]);
         setFormFields([{ name: '', label: '', fieldType: 'text', isRequired: false, order: 0, placeholder: '' }]);
      }
    }
  }, [actionDefinition, isOpen]);

  const handleAddStep = () => {
    setSteps([...steps, { description: '', pointsPerStep: 0 }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: 'description' | 'pointsPerStep', value: string | number) => {
    const newSteps = [...steps];
    const stepToUpdate = { ...newSteps[index] };
    if (field === 'pointsPerStep' && typeof value === 'string') {
      stepToUpdate.pointsPerStep = parseInt(value, 10) || 0;
    } else if (field === 'description' && typeof value === 'string') {
      stepToUpdate.description = value;
    }
    newSteps[index] = stepToUpdate;
    setSteps(newSteps);
  };

  const handleAddFormField = () => {
    setFormFields([...formFields, { name: '', label: '', fieldType: 'text', isRequired: false, order: formFields.length, placeholder: '' }]);
  };

  const handleRemoveFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const handleFormFieldChange = (index: number, field: keyof Omit<FormFieldDefinition, 'id' | 'order'>, value: string | boolean | FormFieldDefinition['fieldType']) => {
    const newFormFields = [...formFields];
    const fieldToUpdate = { ...newFormFields[index] };
    (fieldToUpdate as any)[field] = value;
    newFormFields[index] = fieldToUpdate;
    setFormFields(newFormFields);
  };

  const handleSaveChanges = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Action name is required.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    // Add other validations as needed

    const updateData: UpdateActionDefinitionInputDTO = {
      id: actionDefinition.id,
      name: name.trim(),
      description: description.trim() || null,
      type,
      pointsForCompletion,
      steps: type === 'multi-step' ? steps.map((s, i) => ({ 
        id: s.id, description: s.description || '', pointsPerStep: s.pointsPerStep || 0, order: i 
      })) : undefined,
      formFields: type === 'data-entry' ? formFields.map((f, i) => ({
        id: f.id, name: f.name || `field_${i}`, label: f.label || `Field ${i+1}`,
        fieldType: f.fieldType || 'text', isRequired: !!f.isRequired, placeholder: f.placeholder, order: i
      })) : undefined,
      order,
      isEnabled,
    };

    try {
      await updateActionDefinition(updateData);
      toast({ title: "Action Updated!", description: `"${updateData.name}" has been saved.` });
      onClose();
    } catch (error) {
      console.error("Failed to update action definition:", error);
      toast({ title: "Error Updating Action", description: String(error) || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteActionDefinition(actionDefinition.id);
      toast({ title: "Action Deleted", description: `"${actionDefinition.name}" has been removed.` });
      onClose();
    } catch (error) {
      console.error("Failed to delete action definition:", error);
      toast({ title: "Error Deleting Action", description: String(error) || "Could not delete. Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Action Definition</DialogTitle>
          <DialogDescription className="text-md">
            Modify the details of this action, checklist, or data entry form.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveChanges} className="space-y-6 py-4">
          <div className="space-y-1">
            <Label htmlFor="edit-action-name" className="text-md">Action Name</Label>
            <Input id="edit-action-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Daily Standup" required className="text-md p-3" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-action-description" className="text-md">Description (Optional)</Label>
            <Textarea id="edit-action-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe this action" className="text-md p-3 min-h-[80px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-action-type" className="text-md">Action Type</Label>
              <Select value={type} onValueChange={(value: ActionType) => setType(value)}>
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
              <Input id="edit-action-points" type="number" value={pointsForCompletion} onChange={(e) => setPointsForCompletion(parseInt(e.target.value, 10) || 0)} min="0" className="text-md p-3" />
            </div>
          </div>
          
          {type === 'multi-step' && (
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

          {type === 'data-entry' && (
             <div className="space-y-3 border p-4 rounded-md">
              <h4 className="text-lg font-medium">Form Fields</h4>
              {formFields.map((field, index) => (
                <div key={field.id || `edit-form-field-${index}`} className="flex flex-col gap-2 p-3 border rounded-md shadow-sm">
                  <div className='flex items-center justify-between'>
                    <Label className="text-sm font-semibold">Field {index + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFormField(index)} aria-label="Remove field" className="shrink-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`edit-field-name-${index}`} className="text-xs">Field Name (key)</Label>
                      <Input id={`edit-field-name-${index}`} value={field.name || ''} onChange={(e) => handleFormFieldChange(index, 'name', e.target.value)} placeholder="e.g., customerName" className="text-sm p-2" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`edit-field-label-${index}`} className="text-xs">Display Label</Label>
                      <Input id={`edit-field-label-${index}`} value={field.label || ''} onChange={(e) => handleFormFieldChange(index, 'label', e.target.value)} placeholder="e.g., Customer Name" className="text-sm p-2" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`edit-field-type-${index}`} className="text-xs">Field Type</Label>
                    <Select value={field.fieldType || 'text'} onValueChange={(value: FormFieldDefinition['fieldType']) => handleFormFieldChange(index, 'fieldType', value)}>
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
                     <Input id={`edit-field-placeholder-${index}`} value={field.placeholder || ''} onChange={(e) => handleFormFieldChange(index, 'placeholder', e.target.value)} placeholder="e.g., Enter value here" className="text-sm p-2" />
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox id={`edit-field-required-${index}`} checked={!!field.isRequired} onCheckedChange={(checked) => handleFormFieldChange(index, 'isRequired', !!checked)} />
                    <Label htmlFor={`edit-field-required-${index}`} className="text-xs">Required</Label>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddFormField} className="w-full text-md">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Form Field
              </Button>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="edit-action-order" className="text-md">Display Order (Optional)</Label>
            <Input id="edit-action-order" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)} placeholder="0" className="text-md p-3" />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="edit-action-enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
            <Label htmlFor="edit-action-enabled" className="text-md">Enabled</Label>
          </div>
          <p className="text-xs text-muted-foreground">If disabled, this action won't be loggable or appear active.</p>

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
                  <AlertDialogTitle className="flex items-center"><AlertTriangle className="h-6 w-6 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDesc>
                    Are you sure you want to delete the action "{actionDefinition.name}"? This will also remove all associated logs. This action cannot be undone.
                  </AlertDialogDesc>
                </AlertDialogHeader>
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
              <DialogClose asChild>
                <Button type="button" variant="outline" size="lg" className="text-md" disabled={isLoading || isDeleting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" size="lg" className="text-md" disabled={isLoading || isDeleting}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
