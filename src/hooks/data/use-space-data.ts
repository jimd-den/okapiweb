
// src/hooks/data/use-space-data.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Space } from '@/domain/entities';
import type { GetSpaceByIdUseCase } from '@/application/use-cases';

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
        setErrorLoadingSpace("Space not found.");
      }
    } catch (err: any) {
      console.error("Failed to fetch space:", err);
      setErrorLoadingSpace(err.message || "Could not load space details.");
    } finally {
      setIsLoadingSpace(false);
    }
  }, [spaceId, getSpaceByIdUseCase]); 

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
