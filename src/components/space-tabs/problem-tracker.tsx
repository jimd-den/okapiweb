// src/components/space-tabs/problem-tracker.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import type { Problem } from '@/domain/entities/problem.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, Edit2, Save, XCircle, AlertTriangle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import type { CreateProblemInputDTO } from '@/application/use-cases/problem/create-problem.usecase';
import type { UpdateProblemInputDTO } from '@/application/use-cases/problem/update-problem.usecase';
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

interface ProblemTrackerProps {
  spaceId: string;
  initialProblems: Problem[];
  isLoading: boolean;
  createProblem: (data: CreateProblemInputDTO) => Promise<Problem>;
  updateProblem: (data: UpdateProblemInputDTO) => Promise<Problem>;
  deleteProblem: (id: string) => Promise<void>;
  onProblemsChanged: () => void; // Callback to notify parent of data changes
}

export function ProblemTracker({
  spaceId,
  initialProblems,
  isLoading,
  createProblem,
  updateProblem,
  deleteProblem,
  onProblemsChanged,
}: ProblemTrackerProps) {
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [newProblemDescription, setNewProblemDescription] = useState('');
  const [newProblemType, setNewProblemType] = useState<'Waste' | 'Blocker' | 'Issue'>('Issue');
  
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [editingType, setEditingType] = useState<'Waste' | 'Blocker' | 'Issue'>('Issue');
  const [editingResolutionNotes, setEditingResolutionNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setProblems(initialProblems.sort((a,b) => {
        if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return a.resolved ? 1 : -1;
      }));
  }, [initialProblems]);

  const resetForm = () => {
    setNewProblemDescription('');
    setNewProblemType('Issue');
  };

  const handleAddProblem = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProblemDescription.trim()) {
      toast({ title: "Description is required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const newProblem = await createProblem({ spaceId, description: newProblemDescription, type: newProblemType });
      setProblems(prev => [newProblem, ...prev].sort((a,b) => {
        if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return a.resolved ? 1 : -1;
      }));
      resetForm();
      toast({ title: "Problem Logged", description: `"${newProblem.description}"` });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Logging Problem", description: error.message || "Could not save problem.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleResolved = async (problem: Problem) => {
    // If resolving, and notes are being edited, use those. Otherwise, keep existing or none.
    const resolutionNotesToSave = editingProblemId === problem.id && problem.resolved === false // about to be resolved
                                   ? editingResolutionNotes 
                                   : problem.resolutionNotes;
    try {
      const updated = await updateProblem({ 
          id: problem.id, 
          resolved: !problem.resolved, 
          resolutionNotes: !problem.resolved ? (editingResolutionNotes || undefined) : undefined // Clear notes if un-resolving
        });
      setProblems(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a,b) => {
         if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return a.resolved ? 1 : -1;
      }));
      toast({ title: "Problem Updated", description: `"${updated.description}" is now ${updated.resolved ? 'resolved' : 'unresolved'}.` });
      if (editingProblemId === problem.id && updated.resolved) { // If was editing the item that just got resolved
         setEditingResolutionNotes(updated.resolutionNotes || ''); // keep notes in view
      } else if (editingProblemId === problem.id && !updated.resolved) {
         setEditingResolutionNotes(''); // clear notes if un-resolved
      }
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Updating Problem", description: error.message || "Could not update.", variant: "destructive" });
    }
  };

  const handleDeleteProblem = async (id: string) => {
     setIsSubmitting(true);
    try {
      await deleteProblem(id);
      setProblems(prev => prev.filter(p => p.id !== id));
      toast({ title: "Problem Deleted" });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Deleting Problem", description: error.message || "Could not delete.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const startEdit = (problem: Problem) => {
    setEditingProblemId(problem.id);
    setEditingDescription(problem.description);
    setEditingType(problem.type);
    setEditingResolutionNotes(problem.resolutionNotes || '');
  };

  const cancelEdit = () => {
    setEditingProblemId(null);
    // Don't clear editingDescription and editingResolutionNotes here
    // so that if user clicks resolve then cancel, notes aren't lost.
    // They are reset when starting a new edit.
  };

  const handleSaveEdit = async (problemId: string) => {
    if (!editingDescription.trim()) {
      toast({ title: "Description cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const currentProblem = problems.find(p => p.id === problemId);
      if(!currentProblem) return;

      const updated = await updateProblem({ 
        id: problemId, 
        description: editingDescription, 
        type: editingType,
        resolved: currentProblem.resolved, // Keep existing resolved status
        resolutionNotes: currentProblem.resolved ? editingResolutionNotes : undefined // Only save notes if resolved
      });
      setProblems(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a,b) => {
        if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return a.resolved ? 1 : -1;
      }));
      cancelEdit();
      toast({ title: "Problem Details Updated" });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Updating Problem", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) { 
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading problems...</p></div>;
  }

  return (
    <Card className="mt-4 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Problem Tracker</CardTitle>
        <CardDescription>Log and manage wastes, blockers, or general issues.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddProblem} className="mb-6 p-4 border rounded-lg space-y-3">
          <Textarea
            value={newProblemDescription}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewProblemDescription(e.target.value)}
            placeholder="Describe the problem or waste..."
            className="text-md p-2 min-h-[80px]"
            required
            disabled={isSubmitting}
          />
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Select value={newProblemType} onValueChange={(val: 'Waste' | 'Blocker' | 'Issue') => setNewProblemType(val)} disabled={isSubmitting}>
              <SelectTrigger className="text-md p-2 h-auto sm:w-1/3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Issue" className="text-md">Issue</SelectItem>
                <SelectItem value="Blocker" className="text-md">Blocker</SelectItem>
                <SelectItem value="Waste" className="text-md">Waste</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full sm:w-auto text-md" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
              Log Problem
            </Button>
          </div>
        </form>

        {problems.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No problems logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {problems.map(problem => (
              <li key={problem.id} className={`p-3 rounded-md flex flex-col gap-2 transition-colors ${problem.resolved ? 'bg-muted/50 hover:bg-muted/70' : 'bg-card hover:bg-muted/30'} border`}>
                <div className="flex items-start gap-3">
                   <Checkbox
                        id={`problem-${problem.id}-resolve`}
                        checked={problem.resolved}
                        onCheckedChange={() => handleToggleResolved(problem)}
                        className="h-5 w-5 mt-1 shrink-0"
                        aria-label={problem.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                        disabled={isSubmitting && editingProblemId !== problem.id} // Disable if another operation is in progress, unless it's this item being edited
                    />
                  <div className="flex-grow">
                    {editingProblemId === problem.id ? (
                      <>
                        <Textarea
                            value={editingDescription}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingDescription(e.target.value)}
                            className="text-md p-1.5 w-full mb-2 min-h-[60px]"
                            autoFocus
                            disabled={isSubmitting}
                        />
                        <Select value={editingType} onValueChange={(val: 'Waste' | 'Blocker' | 'Issue') => setEditingType(val)} disabled={isSubmitting}>
                            <SelectTrigger className="text-md p-1.5 h-auto mb-2">
                                <SelectValue placeholder="Select type"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Issue" className="text-md">Issue</SelectItem>
                                <SelectItem value="Blocker" className="text-md">Blocker</SelectItem>
                                <SelectItem value="Waste" className="text-md">Waste</SelectItem>
                            </SelectContent>
                        </Select>
                        {problem.resolved && ( // Show notes field if problem is resolved, even during edit
                            <Textarea
                                value={editingResolutionNotes}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingResolutionNotes(e.target.value)}
                                placeholder="Resolution notes (optional)"
                                className="text-sm p-1.5 w-full min-h-[50px]"
                                disabled={isSubmitting}
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
                    {editingProblemId === problem.id ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(problem.id)} aria-label="Save edit" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5 text-green-600" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit" disabled={isSubmitting}>
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                       !problem.resolved && ( // Only show edit button if not resolved
                        <Button variant="ghost" size="icon" onClick={() => startEdit(problem)} aria-label="Edit problem" disabled={isSubmitting}>
                            <Edit2 className="h-5 w-5 text-blue-600" />
                        </Button>
                        )
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Delete problem" disabled={isSubmitting}>
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
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProblem(problem.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {problem.resolved && (
                  <div className="mt-2 pl-8 text-sm">
                    <p className="flex items-center text-green-700"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolved</p>
                    {problem.resolutionNotes && (
                        <p className="text-muted-foreground italic flex items-start"><MessageSquare className="h-4 w-4 mr-1.5 shrink-0 mt-0.5"/> Notes: {problem.resolutionNotes}</p>
                    )}
                     <p className="text-xs text-muted-foreground">
                      Last updated: {format(parseISO(problem.lastModifiedDate), 'MMM d, yy h:mm a')}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
