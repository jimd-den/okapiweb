
// src/components/dialogs/barcode-display-dialog.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarcodeRendererCSS, type BarRenderData } from '@/components/ui/barcode-renderer-css';

interface BarcodeDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeValue: string | null;
  barcodeType?: string; // e.g., 'code128', 'upca'
  title?: string;
}

// STUB: Placeholder barcode generation logic.
// This needs to be replaced with actual encoding logic for Code128 and UPC.
const generateBarcodePatternData = (value: string, type: string = 'code128'): BarRenderData[] => {
  const data: BarRenderData[] = [];
  if (!value) {
    // Default pattern for empty value (for visual feedback)
    return [
      { isBar: true, widthFactor: 2 }, { isBar: false, widthFactor: 1 },
      { isBar: true, widthFactor: 1 }, { isBar: false, widthFactor: 1 },
      { isBar: true, widthFactor: 3 }, { isBar: false, widthFactor: 1 },
      { isBar: true, widthFactor: 1 },
    ];
  }

  // Very simple, non-functional pattern based on character codes, just for visual demo.
  // This WILL NOT produce a scannable barcode.
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    data.push({ isBar: true, widthFactor: 1 + (charCode % 3) }); // Vary bar width slightly
    if (i < value.length - 1 || value.length === 1) { // Ensure a space unless it's the very last bar of a multi-char string
      data.push({ isBar: false, widthFactor: 1 + ((charCode >> 2) % 2) });
    }
  }
  // Add quiet zones (empty space) - basic implementation
  return [
    { isBar: false, widthFactor: 10 }, // Leading quiet zone
    ...data,
    { isBar: false, widthFactor: 10 }, // Trailing quiet zone
  ];
};


export function BarcodeDisplayDialog({
  isOpen,
  onClose,
  barcodeValue,
  barcodeType = 'code128', // Default to code128, could be 'upca', etc.
  title = 'Generated Barcode',
}: BarcodeDisplayDialogProps) {
  const [renderData, setRenderData] = useState<BarRenderData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(true);

  useEffect(() => {
    if (isOpen && barcodeValue) {
      setIsGenerating(true);
      setGenerationError(null);
      setIsPlaceholder(true); // Assume placeholder until real logic is in

      // Simulate async generation if needed, or just call directly
      const timerId = setTimeout(() => {
        try {
          // TODO: Implement actual UPC and Code128 encoding logic here.
          // For now, using the placeholder.
          if (barcodeType.toLowerCase() === 'upca' || barcodeType.toLowerCase() === 'upc-a') {
            // const upcPattern = generateUPCPattern(barcodeValue); // Replace with real UPC encoder
            // setRenderData(upcPattern);
            setGenerationError(`UPC-A generation is not yet fully implemented. Displaying placeholder for "${barcodeValue}".`);
            setRenderData(generateBarcodePatternData(barcodeValue, 'upca_placeholder'));

          } else if (barcodeType.toLowerCase() === 'code128') {
            // const code128Pattern = generateCode128Pattern(barcodeValue); // Replace with real Code128 encoder
            // setRenderData(code128Pattern);
            setGenerationError(`Code128 generation is not yet fully implemented. Displaying placeholder for "${barcodeValue}".`);
            setRenderData(generateBarcodePatternData(barcodeValue, 'code128_placeholder'));
          } else {
            setGenerationError(`Unsupported barcode type: ${barcodeType}. Displaying generic placeholder.`);
            setRenderData(generateBarcodePatternData(barcodeValue, 'generic_placeholder'));
          }
          // If real encoders were used, you might set setIsPlaceholder(false);
        } catch (error: any) {
          console.error('Barcode generation error:', error);
          setGenerationError(error.message || 'Failed to generate barcode pattern.');
          setRenderData([]); // Clear data on error
        } finally {
          setIsGenerating(false);
        }
      }, 50); // Small delay to allow UI update for loading state

      return () => clearTimeout(timerId);
    } else if (!isOpen) {
      setRenderData([]);
      setGenerationError(null);
      setIsGenerating(false);
    }
  }, [isOpen, barcodeValue, barcodeType]);

  if (!isOpen || !barcodeValue) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b">
          <DialogTitle className="text-xl sm:text-2xl">{title}</DialogTitle>
           <AlertDescription className="text-xs text-muted-foreground">
            Value: {barcodeValue} (Type: {barcodeType})
          </AlertDescription>
        </DialogHeader>

        <div className="p-5 sm:p-6 flex flex-col justify-center items-center min-h-[220px] bg-background">
          {isGenerating && (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Generating Barcode...</p>
            </div>
          )}
          
          {generationError && !isGenerating && (
            <Alert variant="destructive" className="w-full mb-3">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>{generationError}</AlertDescription>
            </Alert>
          )}

          {!isGenerating && renderData.length > 0 && (
            <div className="w-full p-4 bg-white rounded-md shadow-md" data-ai-hint="barcode image">
              <BarcodeRendererCSS
                data={renderData}
                height={100} // Example height
                barColor="black"
                spaceColor="white" // Redundant if background is white, but explicit
              />
            </div>
          )}
          
          {!isGenerating && !generationError && isPlaceholder && renderData.length > 0 && (
             <Alert variant="default" className="w-full mt-4 border-blue-500 bg-blue-50 text-blue-700">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertTitle>Developer Note</AlertTitle>
              <AlertDescription>
                This is a visual placeholder. Full UPC/Code128 encoding logic needs to be implemented for scannability.
              </AlertDescription>
            </Alert>
          )}

          {!isGenerating && renderData.length === 0 && !generationError && (
             <p className="text-muted-foreground">Could not generate barcode preview for "{barcodeValue}".</p>
          )}
        </div>
        <DialogFooter className="p-5 sm:p-6 pt-3 border-t">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
