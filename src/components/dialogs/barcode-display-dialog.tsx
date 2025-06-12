
// src/components/dialogs/barcode-display-dialog.tsx
"use client";

import React, { useEffect, useState } from 'react';
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

interface BarcodeDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeValue: string | null;
  barcodeType?: string; // e.g., 'code128', 'upca'
  title?: string;
}

// --- UPC-A Encoding Constants ---
const UPC_QUIET_ZONE_MODULES = 9; // Standard minimum quiet zone for UPC-A

// Structure: For each digit 0-9, the 7-module bar/space pattern. '0' is space, '1' is bar.
const UPC_L_PATTERNS = [ "0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011" ];
const UPC_G_PATTERNS = [ "0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111" ];
const UPC_R_PATTERNS = [ "1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100" ];

// Parity patterns for the first 6 data digits, determined by the Number System digit (0-9)
const UPC_PARITY_PATTERNS = [
  "LLLLLL", // 0
  "LLGLGG", // 1
  "LLGGLG", // 2
  "LLGGGL", // 3
  "LGLLGG", // 4
  "LGGLLG", // 5
  "LGGGLL", // 6
  "LGLGLG", // 7
  "LGLGGL", // 8
  "LGGLGL"  // 9
];

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
    if ((i + 1) % 2 !== 0) { // Odd positions (1st, 3rd, ...)
      sumOdd += digit;
    } else { // Even positions (2nd, 4th, ...)
      sumEven += digit;
    }
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

  // 1. Quiet Zone (Left)
  for (let i = 0; i < UPC_QUIET_ZONE_MODULES; i++) pattern.push({ isBar: false, widthFactor: 1 });

  // 2. Left Guard Bars
  appendBitsToPattern(UPC_GUARD_LEFT_RIGHT, pattern);

  // 3. Left-Hand Data (6 digits)
  const numberSystemDigit = parseInt(twelveDigits[0], 10);
  const parityPattern = UPC_PARITY_PATTERNS[numberSystemDigit];
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(twelveDigits[i + 1], 10);
    const useGCode = parityPattern[i] === 'G';
    appendBitsToPattern(useGCode ? UPC_G_PATTERNS[digit] : UPC_L_PATTERNS[digit], pattern);
  }

  // 4. Center Guard Bars
  appendBitsToPattern(UPC_GUARD_CENTER, pattern);

  // 5. Right-Hand Data (last 5 data digits + check digit)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(twelveDigits[i + 6], 10); // Digits 7 through 12
    appendBitsToPattern(UPC_R_PATTERNS[digit], pattern);
  }

  // 6. Right Guard Bars
  appendBitsToPattern(UPC_GUARD_LEFT_RIGHT, pattern);

  // 7. Quiet Zone (Right)
  for (let i = 0; i < UPC_QUIET_ZONE_MODULES; i++) pattern.push({ isBar: false, widthFactor: 1 });

  return pattern;
}
// --- End UPC-A Encoding ---


// Placeholder for Code128 generation (complex)
const generateCode128PatternData = (value: string): BarRenderData[] => {
  const data: BarRenderData[] = [];
   // Start with a quiet zone
  for (let i = 0; i < 10; i++) data.push({ isBar: false, widthFactor: 1 });
  // Simplified placeholder pattern
  for (let i = 0; i < value.length; i++) {
    data.push({ isBar: true, widthFactor: 1 + (value.charCodeAt(i) % 2) });
    data.push({ isBar: false, widthFactor: 1 });
  }
   // End with a quiet zone
  for (let i = 0; i < 10; i++) data.push({ isBar: false, widthFactor: 1 });
  return data;
};


export function BarcodeDisplayDialog({
  isOpen,
  onClose,
  barcodeValue,
  barcodeType = 'code128',
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
      setIsPlaceholder(true);

      const timerId = setTimeout(() => {
        try {
          let data: BarRenderData[] = [];
          if (barcodeType.toLowerCase() === 'upca' || barcodeType.toLowerCase() === 'upc-a') {
            if (!/^\d{11}$/.test(barcodeValue) && !/^\d{12}$/.test(barcodeValue)) {
              throw new Error("UPC-A input must be 11 or 12 numeric digits.");
            }
            let valueToEncode = barcodeValue;
            if (barcodeValue.length === 11) {
              valueToEncode += calculateUPCACheckDigit(barcodeValue);
            }
            // Optionally, validate the check digit if 12 digits are provided.
            // For now, we trust it if 12 digits are given.
            // const providedCheckDigit = valueToEncode[11];
            // const calculated = calculateUPCACheckDigit(valueToEncode.substring(0,11));
            // if (providedCheckDigit !== calculated) {
            //   throw new Error(`Provided check digit ${providedCheckDigit} is incorrect. Calculated: ${calculated}.`);
            // }
            data = generateUPCAVisualData(valueToEncode);
            setIsPlaceholder(false); // UPC-A is now implemented
             setGenerationError(null); // Clear previous placeholder message if any
          } else if (barcodeType.toLowerCase() === 'code128') {
            data = generateCode128PatternData(barcodeValue);
            setGenerationError(`Code128 generation is a placeholder. This barcode is not scannable.`);
            setIsPlaceholder(true);
          } else {
            throw new Error(`Unsupported barcode type: ${barcodeType}.`);
          }
          setRenderData(data);
        } catch (error: any) {
          console.error('Barcode generation error:', error);
          setGenerationError(error.message || 'Failed to generate barcode pattern.');
          setRenderData([]);
        } finally {
          setIsGenerating(false);
        }
      }, 50);

      return () => clearTimeout(timerId);
    } else if (!isOpen) {
      setRenderData([]);
      setGenerationError(null);
      setIsGenerating(false);
      setIsPlaceholder(true);
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
           <UIDialogDescription className="text-xs text-muted-foreground">
            Value: {barcodeValue} (Type: {barcodeType})
          </UIDialogDescription>
        </DialogHeader>

        <div className="p-5 sm:p-6 flex flex-col justify-center items-center min-h-[220px] bg-background">
          {isGenerating && (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Generating Barcode...</p>
            </div>
          )}
          
          {generationError && !isGenerating && (
            <Alert variant={isPlaceholder && barcodeType.toLowerCase() !== 'upca' ? "default" : "destructive"} className="w-full mb-3">
               {isPlaceholder && barcodeType.toLowerCase() !== 'upca' ? <Info className="h-5 w-5 text-blue-600" /> : <AlertTriangle className="h-5 w-5" />}
              <AlertTitle>{isPlaceholder && barcodeType.toLowerCase() !== 'upca' ? "Developer Note" : "Error"}</AlertTitle>
              <AlertDescription>{generationError}</AlertDescription>
            </Alert>
          )}

          {!isGenerating && renderData.length > 0 && (
            <div className="w-full p-4 bg-white rounded-md shadow-md" data-ai-hint="barcode image">
              <BarcodeRendererCSS
                data={renderData}
                height={100}
                baseModuleWidth={barcodeType.toLowerCase() === 'upca' ? 2 : 1.5} // UPC-A bars are often wider
                barColor="black"
                spaceColor="white"
              />
            </div>
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

