
// src/components/dialogs/barcode-display-dialog.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarcodeRendererCSS, type BarRenderData } from '@/components/ui/barcode-renderer-css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription as UIDialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface BarcodeDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeValue: string | null;
  title?: string;
}

// --- UPC-A Encoding Constants ---
const UPC_QUIET_ZONE_MODULES = 9;
const UPC_L_PATTERNS = [ "0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011" ];
const UPC_G_PATTERNS = [ "0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111" ];
const UPC_R_PATTERNS = [ "1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100" ];
const UPC_PARITY_PATTERNS = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
const UPC_GUARD_LEFT_RIGHT = "101";
const UPC_GUARD_CENTER = "01010";

function calculateUPCACheckDigit(elevenDigits: string): string {
  if (!/^\d{11}$/.test(elevenDigits)) {
    throw new Error("Input must be 11 digits to calculate UPC-A check digit.");
  }
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(elevenDigits[i], 10);
    if ((i + 1) % 2 !== 0) { sumOdd += digit; } else { sumEven += digit; }
  }
  const totalSum = (sumOdd * 3) + sumEven;
  const checkDigit = (10 - (totalSum % 10)) % 10;
  return checkDigit.toString();
}

function appendBitsToPattern(bits: string, patternArray: BarRenderData[]) {
  for (const bit of bits) {
    patternArray.push({ isBar: bit === '1', widthFactor: 1 });
  }
}

function generateUPCAVisualData(twelveDigits: string): BarRenderData[] {
  if (!/^\d{12}$/.test(twelveDigits)) {
    throw new Error("UPC-A encoding requires 12 digits.");
  }
  const pattern: BarRenderData[] = [];
  for (let i = 0; i < UPC_QUIET_ZONE_MODULES; i++) pattern.push({ isBar: false, widthFactor: 1 });
  appendBitsToPattern(UPC_GUARD_LEFT_RIGHT, pattern);
  const numberSystemDigit = parseInt(twelveDigits[0], 10);
  const parityPattern = UPC_PARITY_PATTERNS[numberSystemDigit];
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(twelveDigits[i + 1], 10);
    appendBitsToPattern(parityPattern[i] === 'G' ? UPC_G_PATTERNS[digit] : UPC_L_PATTERNS[digit], pattern);
  }
  appendBitsToPattern(UPC_GUARD_CENTER, pattern);
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(twelveDigits[i + 6], 10);
    appendBitsToPattern(UPC_R_PATTERNS[digit], pattern);
  }
  appendBitsToPattern(UPC_GUARD_LEFT_RIGHT, pattern);
  for (let i = 0; i < UPC_QUIET_ZONE_MODULES; i++) pattern.push({ isBar: false, widthFactor: 1 });
  return pattern;
}
// --- End UPC-A Encoding ---

// Placeholder for Code128 generation (complex)
const generateCode128PatternData = (value: string): BarRenderData[] => {
  const data: BarRenderData[] = [];
  for (let i = 0; i < 10; i++) data.push({ isBar: false, widthFactor: 1 }); // Quiet Zone
  if (value.length === 0) { // Handle empty string case for placeholder
    for (let i = 0; i < 20; i++) data.push({ isBar: (i % 2 === 0), widthFactor: 1 }); // Simple alternating pattern for empty
  } else {
    for (let i = 0; i < value.length; i++) {
      data.push({ isBar: true, widthFactor: 1 + (value.charCodeAt(i) % 2) });
      data.push({ isBar: false, widthFactor: 1 });
    }
  }
  for (let i = 0; i < 10; i++) data.push({ isBar: false, widthFactor: 1 }); // Quiet Zone
  return data;
};

export function BarcodeDisplayDialog({
  isOpen,
  onClose,
  barcodeValue,
  title = 'Generated Barcodes',
}: BarcodeDisplayDialogProps) {
  const [upcaRenderData, setUpcaRenderData] = useState<BarRenderData[]>([]);
  const [isGeneratingUPCA, setIsGeneratingUPCA] = useState(false);
  const [upcaGenerationError, setUpcaGenerationError] = useState<string | null>(null);
  const [isUPCAPlaceholder, setIsUPCAPlaceholder] = useState(true);

  const [code128RenderData, setCode128RenderData] = useState<BarRenderData[]>([]);
  const [isGeneratingCode128, setIsGeneratingCode128] = useState(false);
  const [code128GenerationError, setCode128GenerationError] = useState<string | null>(null);
  const [isCode128Placeholder, setIsCode128Placeholder] = useState(true);

  const [isLoadingOverall, setIsLoadingOverall] = useState(false);

  const resetStates = useCallback(() => {
    setUpcaRenderData([]);
    setIsGeneratingUPCA(false);
    setUpcaGenerationError(null);
    setIsUPCAPlaceholder(true);

    setCode128RenderData([]);
    setIsGeneratingCode128(false);
    setCode128GenerationError(null);
    setIsCode128Placeholder(true);
    setIsLoadingOverall(false);
  }, []);

  useEffect(() => {
    if (isOpen && barcodeValue) {
      setIsLoadingOverall(true);
      
      // Attempt UPC-A generation
      setIsGeneratingUPCA(true);
      setUpcaGenerationError(null);
      setIsUPCAPlaceholder(true);
      const upcaTimerId = setTimeout(() => {
        try {
          let valueToEncodeUpca = barcodeValue;
          if (/^\d{11}$/.test(barcodeValue)) {
            valueToEncodeUpca += calculateUPCACheckDigit(barcodeValue);
          } else if (!/^\d{12}$/.test(barcodeValue)) {
            throw new Error("UPC-A input must be 11 or 12 numeric digits.");
          }
          const upcaData = generateUPCAVisualData(valueToEncodeUpca);
          setUpcaRenderData(upcaData);
          setIsUPCAPlaceholder(false);
          setUpcaGenerationError(null);
        } catch (error: any) {
          setUpcaGenerationError(error.message || 'Failed to generate UPC-A barcode.');
          setUpcaRenderData([]);
        } finally {
          setIsGeneratingUPCA(false);
        }
      }, 50);

      // Attempt Code128 generation (placeholder)
      setIsGeneratingCode128(true);
      setCode128GenerationError(null);
      setIsCode128Placeholder(true);
      const code128TimerId = setTimeout(() => {
        try {
          if (!barcodeValue) { // Check if barcodeValue is empty string for Code128
             throw new Error("Code 128 input cannot be empty.");
          }
          const code128Data = generateCode128PatternData(barcodeValue);
          setCode128RenderData(code128Data);
          setCode128GenerationError(`Code 128 generation is a placeholder. This barcode is not scannable.`);
          setIsCode128Placeholder(true);
        } catch (error: any) {
          setCode128GenerationError(error.message || 'Failed to generate Code 128 barcode.');
          setCode128RenderData([]);
        } finally {
          setIsGeneratingCode128(false);
        }
      }, 50);

      // Update overall loading state after a short delay to allow individual states to update
      const overallLoadingTimer = setTimeout(() => setIsLoadingOverall(false), 100);

      return () => {
        clearTimeout(upcaTimerId);
        clearTimeout(code128TimerId);
        clearTimeout(overallLoadingTimer);
      };
    } else if (!isOpen) {
      resetStates();
    }
  }, [isOpen, barcodeValue, resetStates]);

  if (!isOpen || !barcodeValue) {
    return null;
  }

  const renderBarcodeSection = (
    type: 'UPC-A' | 'Code 128',
    isGenerating: boolean,
    renderData: BarRenderData[],
    generationError: string | null,
    isPlaceholder: boolean
  ) => {
    return (
      <div className="py-3">
        <h3 className="text-md font-semibold mb-2 text-center">{type}</h3>
        {isGenerating && (
          <div className="flex flex-col items-center text-muted-foreground min-h-[120px] justify-center">
            <Loader2 className="h-6 w-6 animate-spin mb-1" />
            <p className="text-xs">Generating {type}...</p>
          </div>
        )}
        {generationError && !isGenerating && (
          <Alert variant={isPlaceholder && type === 'Code 128' ? "default" : "destructive"} className="w-full text-xs p-2">
            {isPlaceholder && type === 'Code 128' ? <Info className="h-4 w-4 text-blue-600" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle className="text-xs">{isPlaceholder && type === 'Code 128' ? "Note" : "Error"}</AlertTitle>
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
        )}
        {!isGenerating && renderData.length > 0 && (
          <div className="w-full p-3 bg-white rounded-md shadow-sm" data-ai-hint={`${type.toLowerCase().replace(/\s+/g, '-')} barcode image`}>
            <BarcodeRendererCSS
              data={renderData}
              height={type === 'UPC-A' ? 100 : 70}
              baseModuleWidth={type === 'UPC-A' ? 2 : 1.5}
            />
          </div>
        )}
        {!isGenerating && renderData.length === 0 && !generationError && (
           <p className="text-xs text-muted-foreground text-center min-h-[120px] flex items-center justify-center">Could not generate {type} barcode for "{barcodeValue}".</p>
        )}
      </div>
    );
  };
  
  const dialogTitleText = `${title}: ${barcodeValue}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 sm:p-5 pb-2 border-b">
          <DialogTitle className="text-lg sm:text-xl">{dialogTitleText}</DialogTitle>
           <UIDialogDescription className="text-xs text-muted-foreground">
            Displaying UPC-A and Code 128 (placeholder) formats.
          </UIDialogDescription>
        </DialogHeader>

        <div className="p-3 sm:p-4 max-h-[60vh] overflow-y-auto">
          {isLoadingOverall && (
            <div className="flex flex-col items-center text-muted-foreground min-h-[240px] justify-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Generating Barcodes...</p>
            </div>
          )}
          {!isLoadingOverall && (
            <>
              {renderBarcodeSection('UPC-A', isGeneratingUPCA, upcaRenderData, upcaGenerationError, isUPCAPlaceholder)}
              <Separator className="my-2" />
              {renderBarcodeSection('Code 128', isGeneratingCode128, code128RenderData, code128GenerationError, isCode128Placeholder)}
            </>
          )}
        </div>
        <DialogFooter className="p-4 sm:p-5 pt-2 border-t">
          <Button type="button" variant="outline" size="default" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
