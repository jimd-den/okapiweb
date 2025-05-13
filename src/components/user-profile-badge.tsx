
"use client";

import { Award } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import { DEFAULT_USER_ID } from '@/lib/constants';

// Use Cases and Repositories
// Stub for now, will be replaced with actual use case
class GetUserProgressUseCase {
  constructor(private repo: any) {} // Replace 'any' with IUserProgressRepository
  async execute(userId: string): Promise<UserProgress | null> {
    console.warn('STUB: GetUserProgressUseCase.execute()', userId);
    // return this.repo.findByUserId(userId);
    // Simulate fetching data for the default user for display purposes
    if (userId === DEFAULT_USER_ID) {
      return {
        userId,
        points: 1250, // Sample data
        level: 5,     // Sample data
        unlockedCustomizations: ['colorScheme_ocean'],
      };
    }
    return null;
  }
}
import { IndexedDBUserProgressRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository.stub';


export function UserProfileBadge() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);
  const getUserProgressUseCase = useMemo(() => new GetUserProgressUseCase(userProgressRepository), [userProgressRepository]);

  useEffect(() => {
    getUserProgressUseCase.execute(DEFAULT_USER_ID)
      .then(setProgress)
      .catch(err => console.error("Error fetching user progress:", err));
  }, [getUserProgressUseCase]);

  if (!progress) {
    return (
      <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted animate-pulse">
        <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
        <div className="space-y-1">
          <div className="w-20 h-4 bg-muted-foreground/20 rounded"></div>
          <div className="w-16 h-3 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg bg-card shadow-sm border border-border">
      <Award className="h-8 w-8 text-accent" />
      <div>
        <p className="text-sm font-semibold text-card-foreground">Level {progress.level}</p>
        <p className="text-xs text-muted-foreground">{progress.points} Points</p>
      </div>
    </div>
  );
}
