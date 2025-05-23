
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Space } from '@/domain/entities/space.entity';
import { ArrowRight, CalendarDays, Tag, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface SpaceClockStats {
  totalDurationMs: number;
  isCurrentlyClockedIn: boolean;
}

interface SpaceCardProps {
  space: Space;
  clockStats?: SpaceClockStats;
  onNavigate?: () => void; // Callback for navigation start
}

const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function SpaceCard({ space, clockStats, onNavigate }: SpaceCardProps) {
  const cardClasses = cn(
    "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card rounded-xl overflow-hidden",
    clockStats?.isCurrentlyClockedIn && "border-2 border-green-500 ring-2 ring-green-500/50"
  );

  return (
    <Card className={cardClasses}>
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl mb-1">{space.name}</CardTitle>
            {space.description && <CardDescription className="text-md text-muted-foreground line-clamp-2">{space.description}</CardDescription>}
          </div>
          {clockStats?.isCurrentlyClockedIn && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs whitespace-nowrap shrink-0 ml-2">
              Clocked In
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow space-y-4">
        <div className="flex items-center text-muted-foreground text-sm">
          <CalendarDays className="mr-2 h-5 w-5" />
          <span>Created: {format(parseISO(space.creationDate), 'MMM d, yyyy')}</span>
        </div>
        {clockStats && (
          <div className="flex items-center text-muted-foreground text-sm">
            <Clock className="mr-2 h-5 w-5" />
            <span>Total Time: {formatDuration(clockStats.totalDurationMs)}</span>
          </div>
        )}
        {space.goal && (
          <p className="text-sm line-clamp-2">
            <span className="font-semibold">Current Goal:</span> {space.goal}
          </p>
        )}
        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Tag className="h-5 w-5 text-muted-foreground" />
            {space.tags.slice(0, 3).map((tag) => ( // Show max 3 tags
              <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge> 
            ))}
            {space.tags.length > 3 && <Badge variant="outline" className="text-sm">+{space.tags.length - 3} more</Badge>}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 border-t mt-auto">
        <Link href={`/spaces/${space.id}`} passHref legacyBehavior>
          <Button 
            variant="default" 
            className="w-full text-lg py-3"
            onClick={onNavigate} // Call onNavigate when button is clicked
          >
            Open Space <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
