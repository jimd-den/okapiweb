
// src/hooks/data/use-space-data.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Space } from '@/domain/entities/space.entity';
import type { GetSpaceByIdUseCase } from '@/application/use-cases/space/get-space-by-id.usecase';
import { useToast } from '@/hooks/use-toast';

interface UseSpaceDataReturn {
  space: Space | null;
  isLoadingSpace: boolean;
  errorLoadingSpace: string | null;
  refreshSpace: () => Promise<void>;
}

export function useSpaceData(
  spaceId: string,
  getSpaceByIdUseCase: GetSpaceByIdUseCase
): UseSpaceDataReturn {
  const [space, setSpace] = useState<Space | null>(null);
  const [isLoadingSpace, setIsLoadingSpace] = useState<boolean>(true);
  const [errorLoadingSpace, setErrorLoadingSpace] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSpace = useCallback(async () => {
    if (!spaceId || !getSpaceByIdUseCase) {
      setErrorLoadingSpace("Space ID or use case not provided.");
      setIsLoadingSpace(false);
      return;
    }
    setIsLoadingSpace(true);
    setErrorLoadingSpace(null);
    try {
      const data = await getSpaceByIdUseCase.execute(spaceId);
      setSpace(data);
      if (!data) {
        // This case might be handled by the page component redirecting
        // but good to note here.
        setErrorLoadingSpace("Space not found.");
      }
    } catch (err: any) {
      console.error("Failed to fetch space:", err);
      setErrorLoadingSpace(err.message || "Could not load space details.");
      // Toasting for critical data load failure can be done here or in the component
      // For now, let the component decide based on the error state.
      // toast({
      //   title: "Error Loading Space",
      //   description: err.message || "An unexpected error occurred.",
      //   variant: "destructive",
      // });
    } finally {
      setIsLoadingSpace(false);
    }
  }, [spaceId, getSpaceByIdUseCase, toast]);

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  return {
    space,
    isLoadingSpace,
    errorLoadingSpace,
    refreshSpace: fetchSpace,
  };
}
