// src/components/space-tabs/problem-item.tsx
"use client";

import type { ChangeEvent } from 'react';
import type { Problem } from '@/domain/entities/problem.entity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Save, XCircle, Loader2, Camera, RefreshCw, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import NextImage from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEditableItem } from '@/hooks/use-editable-item';

interface ProblemItemProps {
  problem: Problem;
  onToggleResolved: (problem: Problem, resolutionNotes?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateDetails: (id: string, newDescription: string, newType: Problem['type'], newResolutionNotes?: string, newImageDataUri?: string | null) => Promise<void>;
  onOpenImageCapture: (problem: Problem) => void;
  onRemoveImage: (problemId: string) => Promise<void>;
  isSubmittingParent: boolean; // Renamed
}

type EditableProblemFields = Pick<Problem, 'description' | 'type' | 'resolutionNotes'>;

export function ProblemItem({
  problem,
  onToggleResolved,
  onDelete,
  onUpdateDetails,
  onOpenImageCapture,
  onRemoveImage,
  isSubmittingParent,
}: ProblemItemProps) {
  const { toast } = useToast();
  
  const {
    isEditing,
    editedData,
    isSubmitting: isItemSubmitting,
    startEdit,
    cancelEdit,
    handleFieldChange,
    handleSave: handleSaveEditData,
  } = useEditableItem<Problem>({
    initialData: problem,
    onSave: async (updatedProblemData) => {
      if (!updatedProblemData.description.trim()) {
        toast({ title: "Description cannot be empty.", variant: "destructive" });
        throw new Error("Description cannot be empty."); // Prevent save
      }
      // Note: imageDataUri is handled separately, not through this generic save
      await onUpdateDetails(
        updatedProblemData.id, 
        updatedProblemData.description, 
        updatedProblemData.type, 
        problem.resolved ? updatedProblemData.resolutionNotes : undefined
      );
    },
    editableFields: ['description', 'type', 'resolutionNotes'],
  });

  const combinedSubmitting = isSubmittingParent || isItemSubmitting;

  const handleLocalToggleResolved = async () => {
    const notesToPass = isEditing && !problem.resolved ? editedData.resolutionNotes : undefined;
    await onToggleResolved(problem, notesToPass);
    if (isEditing && problem.resolved === false) { // Became resolved
      // Keep notes if they were there
    } else if (isEditing && problem.resolved === true) { // Became unresolved
        handleFieldChange('resolutionNotes', ''); // Clear notes if it became unresolved
    }
  };

  return (
    <li className={`p-3 rounded-md flex flex-col gap-2 transition-colors ${problem.resolved ? 'bg-muted/50 hover:bg-muted/70' : 'bg-card hover:bg-muted/30'} border`}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={`problem-${problem.id}-resolve`}
          checked={problem.resolved}
          onCheckedChange={handleLocalToggleResolved}
          className="h-5 w-5 mt-1 shrink-0"
          aria-label={problem.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
          disabled={combinedSubmitting}
        />
        <div className="flex-grow">
          {isEditing ? (
            <>
              <Textarea
                value={editedData.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('description', e.target.value)}
                className="text-md p-1.5 w-full mb-2 min-h-[60px]"
                autoFocus
                disabled={combinedSubmitting}
              />
              <Select value={editedData.type} onValueChange={(val: Problem['type']) => handleFieldChange('type', val)} disabled={combinedSubmitting}>
                <SelectTrigger className="text-md p-1.5 h-auto mb-2">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Issue" className="text-md">Issue</SelectItem>
                  <SelectItem value="Blocker" className="text-md">Blocker</SelectItem>
                  <SelectItem value="Waste" className="text-md">Waste</SelectItem>
                </SelectContent>
              </Select>
              {problem.resolved && ( 
                <Textarea
                    value={editedData.resolutionNotes || ''}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('resolutionNotes', e.target.value)}
                    placeholder="Resolution notes (optional)"
                    className="text-sm p-1.5 w-full min-h-[50px]"
                    disabled={combinedSubmitting}
                />
              )}
            </>
          ) : (
            <>
              <label htmlFor={`problem-${problem.id}-resolve`} className={`text-md font-medium ${problem.resolved ? 'line-through text-muted-foreground' : ''}`}>{problem.description}</label>
              <p className="text-xs text-muted-foreground">
                Type: <span className="font-semibold">{problem.type}</span> | Logged: {format(parseISO(problem.timestamp), 'MMM d, yy h:mm a')}
              </p>
            </>
          )}
        </div>
        <div className="flex gap-1 ml-auto shrink-0">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSaveEditData} aria-label="Save edit" disabled={combinedSubmitting}>
                {isItemSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5 text-green-600" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit" disabled={combinedSubmitting}>
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
            </>
          ) : (
            !problem.resolved && (
              <Button variant="ghost" size="icon" onClick={startEdit} aria-label="Edit problem" disabled={combinedSubmitting}>
                <Edit2 className="h-5 w-5 text-blue-600" />
              </Button>
            )
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Delete problem" disabled={combinedSubmitting}>
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this problem log.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isItemSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(problem.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isItemSubmitting}>
                  {isItemSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="pl-8 space-y-1">
        {problem.imageDataUri ? (
          <div className="relative group w-full max-w-xs">
            <NextImage src={problem.imageDataUri} alt={`Image for ${problem.description}`} width={160} height={120} className="rounded-md border object-cover w-full aspect-[4/3]" data-ai-hint="issue photo"/>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
              <Button variant="outline" size="sm" onClick={() => onOpenImageCapture(problem)} className="mr-1" disabled={combinedSubmitting}>
                <RefreshCw className="h-4 w-4 mr-1" /> Retake
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onRemoveImage(problem.id)} disabled={combinedSubmitting}>
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          !problem.resolved && (
            <Button variant="outline" size="sm" onClick={() => onOpenImageCapture(problem)} disabled={combinedSubmitting}>
              <Camera className="h-4 w-4 mr-2" /> Add Image
            </Button>
          )
        )}
      </div>

      {problem.resolved && (
        <div className="mt-2 pl-8 text-sm">
          <p className="flex items-center text-green-700"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolved</p>
          {problem.resolutionNotes && (
            <p className="text-muted-foreground italic flex items-start"><MessageSquare className="h-4 w-4 mr-1.5 shrink-0 mt-0.5" /> Notes: {problem.resolutionNotes}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Last updated: {format(parseISO(problem.lastModifiedDate), 'MMM d, yy h:mm a')}
          </p>
        </div>
      )}
    </li>
  );
}
