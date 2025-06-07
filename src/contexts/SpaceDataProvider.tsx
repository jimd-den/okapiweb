
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Space } from '@/domain/entities';
import { useSpaceData } from '@/hooks/data';
import type { GetSpaceByIdUseCase } from '@/application/use-cases';
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb';
import { GetSpaceByIdUseCase as GetSpaceByIdUseCaseImpl } from '@/application/use-cases'; 

interface SpaceDataContextType {
  space: Space | null;
  isLoadingSpace: boolean;
  errorLoadingSpace: string | null;
  refreshSpace: () => Promise<void>;
  spaceId: string;
}

const SpaceDataContext = createContext<SpaceDataContextType | undefined>(undefined);

export function useSpaceContext(): SpaceDataContextType {
  const context = useContext(SpaceDataContext);
  if (context === undefined) {
    throw new Error('useSpaceContext must be used within a SpaceDataProvider');
  }
  return context;
}

interface SpaceDataProviderProps {
  children: ReactNode;
  spaceId: string;
  getSpaceByIdUseCaseInstance?: GetSpaceByIdUseCase;
}

export function SpaceDataProvider({
  children,
  spaceId,
  getSpaceByIdUseCaseInstance,
}: SpaceDataProviderProps) {
  const defaultSpaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const defaultGetSpaceByIdUseCase = useMemo(() => new GetSpaceByIdUseCaseImpl(defaultSpaceRepository), [defaultSpaceRepository]);

  const useCaseToUse = getSpaceByIdUseCaseInstance || defaultGetSpaceByIdUseCase;

  const { space, isLoadingSpace, errorLoadingSpace, refreshSpace } = useSpaceData(
    spaceId,
    useCaseToUse
  );

  const value = useMemo(() => ({
    space,
    isLoadingSpace,
    errorLoadingSpace,
    refreshSpace,
    spaceId,
  }), [space, isLoadingSpace, errorLoadingSpace, refreshSpace, spaceId]);

  return (
    <SpaceDataContext.Provider value={value}>
      {children}
    </SpaceDataContext.Provider>
  );
}
