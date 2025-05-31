
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import type { ActionDefinition, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import type { LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileInput, AlertTriangle, ScanLine } from 'lucide-react'; // Added ScanLine
import { BarcodeScannerDialog } from './barcode-scanner-dialog'; // Import BarcodeScannerDialog

interface DataEntryFormDialogProps {
  actionDefinition: ActionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitLog: (data: LogDataEntryInputDTO) => Promise<void>;
}

export function DataEntryFormDialog({
  actionDefinition,
  isOpen,
  onClose,
  onSubmitLog,
}: DataEntryFormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for barcode scanner
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [currentScanningField, setCurrentScanningField] = useState<{ name: string; label: string } | null>(null);

  useEffect(() => {
    if (isOpen && actionDefinition && actionDefinition.formFields) {
      const initialData: Record<string, any> = {};
      actionDefinition.formFields.forEach(field => {
        initialData[field.name] = field.fieldType === 'number' ? '' : (field.fieldType === 'barcode' ? '' : '');
      });
      setFormData(initialData);
      setError(null);
    } else if (!isOpen) {
      setFormData({});
    }
  }, [isOpen, actionDefinition]);

  const handleInputChange = (fieldName: string, value: any, fieldType: FormFieldDefinition['fieldType']) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldType === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleOpenBarcodeScanner = (fieldName: string, fieldLabel: string) => {
    setCurrentScanningField({ name: fieldName, label: fieldLabel });
    setIsBarcodeScannerOpen(true);
  };

  const handleBarcodeScanSuccess = (scannedValue: string) => {
    if (currentScanningField) {
      setFormData(prev => ({
        ...prev,
        [currentScanningField.name]: scannedValue,
      }));
    }
    setIsBarcodeScannerOpen(false);
    setCurrentScanningField(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!actionDefinition || !actionDefinition.formFields) return;
    setError(null);

    for (const field of actionDefinition.formFields) {
      if (field.isRequired && (formData[field.name] === undefined || String(formData[field.name]).trim() === '')) {
        setError(`Field "${field.label}" is required.`);
        return;
      }
      if (field.fieldType === 'number' && formData[field.name] !== '' && isNaN(Number(formData[field.name]))) {
        setError(`Field "${field.label}" must be a valid number.`);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await onSubmitLog({
        spaceId: actionDefinition.spaceId,
        actionDefinitionId: actionDefinition.id,
        formData: formData,
      });
      // onClose(); // Dialog is closed by parent upon successful log
    } catch (err: any) {
      console.error("Error submitting data entry form from dialog:", err);
      setError(err.message || "Failed to log data.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDialogClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  },[isSubmitting, onClose]);
  
  if (!actionDefinition) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">{actionDefinition.name}</DialogTitle>
            {actionDefinition.description && (
              <DialogDescription className="text-xs">{actionDefinition.description}</DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-2">
            {error && (
              <Alert variant="destructive" className="p-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {actionDefinition.formFields?.sort((a,b) => a.order - b.order).map(field => (
              <div key={field.id} className="space-y-0.5">
                <Label htmlFor={field.id} className="text-sm">
                  {field.label} {field.isRequired && <span className="text-destructive">*</span>}
                </Label>
                {field.fieldType === 'textarea' ? (
                  <Textarea
                    id={field.id}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value, field.fieldType)}
                    placeholder={field.placeholder || ''}
                    required={field.isRequired}
                    className="text-sm p-2 min-h-[70px] h-auto"
                    disabled={isSubmitting}
                  />
                ) : field.fieldType === 'barcode' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      id={field.id}
                      type="text"
                      value={formData[field.name] || ''}
                      readOnly
                      placeholder={field.placeholder || 'Scan barcode...'}
                      className="text-sm p-2 h-9 flex-grow bg-muted/50"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenBarcodeScanner(field.name, field.label)}
                      disabled={isSubmitting}
                      className="h-9 w-10"
                      aria-label={`Scan barcode for ${field.label}`}
                    >
                      <ScanLine className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    id={field.id}
                    type={field.fieldType === 'date' ? 'date' : field.fieldType === 'number' ? 'number' : 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value, field.fieldType)}
                    placeholder={field.placeholder || ''}
                    required={field.isRequired}
                    className="text-sm p-2 h-9"
                    disabled={isSubmitting}
                    step={field.fieldType === 'number' ? 'any' : undefined}
                  />
                )}
              </div>
            ))}
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileInput className="mr-1.5 h-4 w-4" />}
                Log Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {currentScanningField && (
        <BarcodeScannerDialog
          isOpen={isBarcodeScannerOpen}
          onClose={() => {
            setIsBarcodeScannerOpen(false);
            setCurrentScanningField(null);
          }}
          onScanSuccess={handleBarcodeScanSuccess}
          fieldLabel={currentScanningField.label}
        />
      )}
    </>
  );
}
