
"use client";

import { Award } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import { DEFAULT_USER_ID } from '@/lib/constants';

// Use Cases and Repositories
import { GetUserProgressUseCase } from '@/application/use-cases/user-progress/get-user-progress.usecase';
import { IndexedDBUserProgressRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository';


export function UserProfileBadge() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);
  const getUserProgressUseCase = useMemo(() => new GetUserProgressUseCase(userProgressRepository), [userProgressRepository]);

  useEffect(() => {
    getUserProgressUseCase.execute(DEFAULT_USER_ID)
      .then(fetchedProgress => {
        if (fetchedProgress) {
          setProgress(fetchedProgress);
        } else {
          // This case should ideally be handled by the GetUserProgressUseCase
          // which creates a default progress if null for DEFAULT_USER_ID.
          console.warn("User progress not found by use case for UserProfileBadge.");
          // Fallback display for safety, though use case should prevent this.
          setProgress({ userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] });
        }
      })
      .catch(err => {
        console.error("Error fetching user progress for badge:", err);
        // Fallback display on error
        setProgress({ userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] });
      });
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
