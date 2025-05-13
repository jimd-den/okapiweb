
"use client";

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { SpaceCard } from '@/components/space-card';
import { CreateSpaceDialog } from '@/components/create-space-dialog';
import type { Space } from '@/domain/entities/space.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';

// Use Cases and Repositories
import { GetAllSpacesUseCase } from '@/application/use-cases/space/get-all-spaces.usecase';
import { CreateSpaceUseCase, type CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';


export default function HomePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<Space[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Instantiate repositories and use cases
  // useMemo ensures these are created only once per component lifecycle,
  // unless their dependencies change (none in this case).
  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const getAllSpacesUseCase = useMemo(() => new GetAllSpacesUseCase(spaceRepository), [spaceRepository]);
  const createSpaceUseCase = useMemo(() => new CreateSpaceUseCase(spaceRepository), [spaceRepository]);

  useEffect(() => {
    setIsLoading(true);
    getAllSpacesUseCase.execute()
      .then(data => {
        setSpaces(data);
        setFilteredSpaces(data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch spaces:", err);
        setError("Could not load spaces. Please try again later.");
      })
      .finally(() => setIsLoading(false));
  }, [getAllSpacesUseCase]); // Dependency on the use case instance

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const result = spaces.filter(space =>
      space.name.toLowerCase().includes(lowerSearchTerm) ||
      (space.description && space.description.toLowerCase().includes(lowerSearchTerm)) ||
      (space.tags && space.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
    setFilteredSpaces(result);
  }, [searchTerm, spaces]);

  const handleSpaceCreated = (newSpace: Space) => {
    // Add to the beginning of the list for immediate visibility
    setSpaces(prevSpaces => [newSpace, ...prevSpaces]);
    // If no search term, also add to filteredSpaces
    if (!searchTerm) {
      setFilteredSpaces(prevFiltered => [newSpace, ...prevFiltered]);
    }
    // If there is a search term, the filter effect will re-run and include it if it matches
  };
  
  // Bound function to pass to CreateSpaceDialog
  const executeCreateSpace = async (data: CreateSpaceInputDTO): Promise<Space> => {
    return createSpaceUseCase.execute(data);
  };


  return (
    <div className="flex flex-col min-h-screen">
      <Header pageTitle="My Workflow Spaces" />
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search spaces by name, tag, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 text-md w-full"
            />
          </div>
          <CreateSpaceDialog 
            onSpaceCreated={handleSpaceCreated}
            createSpace={executeCreateSpace} 
          />
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-xl text-muted-foreground">Loading Spaces...</p>
          </div>
        )}

        {error && !isLoading && (
           <div className="flex flex-col items-center justify-center text-center py-20 bg-destructive/10 p-6 rounded-lg">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-destructive mb-2">Oops! Something went wrong.</h2>
            <p className="text-lg text-destructive/80">{error}</p>
          </div>
        )}

        {!isLoading && !error && filteredSpaces.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">No Spaces Found</h2>
            <p className="text-lg text-muted-foreground mb-6">
              {searchTerm ? "Try a different search term or " : "It looks like you don't have any spaces yet. "}
              {!searchTerm && "Create your first space to get started!"}
            </p>
            {!searchTerm && 
              <CreateSpaceDialog 
                onSpaceCreated={handleSpaceCreated} 
                createSpace={executeCreateSpace}
              />
            }
          </div>
        )}

        {!isLoading && !error && filteredSpaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {filteredSpaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
