"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { SpaceCard } from '@/components/space-card';
import { CreateSpaceDialog } from '@/components/create-space-dialog';
import type { Space } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';

// Mock function, replace with actual db.ts calls
async function fetchSpacesFromDB(): Promise<Space[]> {
  console.log('Fetching spaces from DB');
  // In a real app: const spaces = await getAllSpacesDB(); return spaces || [];
  // Sample data for now:
  return [
    { id: '1', name: 'Morning Routine', description: 'Get the day started right!', creationDate: new Date(Date.now() - 86400000 * 2).toISOString(), tags: ['personal', 'health'], goal: 'Meditate for 10 mins', sequentialSteps: true },
    { id: '2', name: 'Project Phoenix', description: 'Client web app development', creationDate: new Date().toISOString(), tags: ['work', 'webdev', 'urgent'], goal: 'Deploy staging server' },
    { id: '3', name: 'Okapi Research', creationDate: new Date(Date.now() - 86400000 * 5).toISOString(), tags: ['learning', 'animals'] },
  ];
}

export default function HomePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<Space[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchSpacesFromDB()
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
  }, []);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const result = spaces.filter(space =>
      space.name.toLowerCase().includes(lowerSearchTerm) ||
      (space.description && space.description.toLowerCase().includes(lowerSearchTerm)) ||
      space.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredSpaces(result);
  }, [searchTerm, spaces]);

  const handleSpaceCreated = (newSpace: Space) => {
    setSpaces(prevSpaces => [newSpace, ...prevSpaces]);
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
              className="pl-10 pr-4 py-3 text-md w-full" /* Driver friendly: larger input */
            />
          </div>
          <CreateSpaceDialog onSpaceCreated={handleSpaceCreated} />
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
            {!searchTerm && <CreateSpaceDialog onSpaceCreated={handleSpaceCreated} />}
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
