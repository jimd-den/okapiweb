
// src/components/forms/FormFieldRenderer.tsx
"use client";

import React from 'react';
import type { ControllerRenderProps, FieldError } from 'react-hook-form';
import type { FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import { FormMessage } from '@/components/ui/form'; // Assuming FormMessage is used for errors

interface FormFieldRendererProps {
  fieldDefinition: FormFieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rhfField: ControllerRenderProps<any, string>; // From react-hook-form Controller
  error?: FieldError;
  onScanClick?: (fieldDefinition: FormFieldDefinition) => void; // For barcode type
}

export function FormFieldRenderer({
  fieldDefinition,
  rhfField,
  error,
  onScanClick,
}: FormFieldRendererProps) {
  const { name, label, fieldType, placeholder, isRequired } = fieldDefinition;

  const renderField = () => {
    switch (fieldType) {
      case 'text':
      case 'number':
      case 'date':
        return (
          <Input
            {...rhfField}
            id={name}
            type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
            placeholder={placeholder || ''}
            className="text-sm p-2 h-9"
            step={fieldType === 'number' ? 'any' : undefined}
          />
        );
      case 'textarea':
        return (
          <Textarea
            {...rhfField}
            id={name}
            placeholder={placeholder || ''}
            className="text-sm p-2 min-h-[70px]"
          />
        );
      case 'barcode':
        return (
          <div className="flex items-center gap-2">
            <Input
              {...rhfField}
              id={name}
              type="text"
              placeholder={placeholder || 'Scan or enter barcode...'}
              className="text-sm p-2 h-9 flex-grow"
            />
            {onScanClick && (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onScanClick(fieldDefinition)}
                    className="h-9 w-10"
                    aria-label={`Scan barcode for ${label}`}
                >
                    <ScanLine className="h-5 w-5" />
                </Button>
            )}
          </div>
        );
      default:
        return <p className="text-destructive text-xs">Unsupported field type: {fieldType}</p>;
    }
  };

  return (
    <div className="space-y-1 w-full">
      <Label htmlFor={name} className="text-sm">
        {label} {isRequired && <span className="text-destructive">*</span>}
      </Label>
      {renderField()}
      {error && <FormMessage className="text-xs">{error.message}</FormMessage>}
    </div>
  );
}
