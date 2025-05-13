"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Space } from '@/lib/types';
import { ArrowRight, CalendarDays, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SpaceCardProps {
  space: Space;
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card rounded-xl overflow-hidden">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl mb-1">{space.name}</CardTitle> {/* Driver friendly: larger title */}
        {space.description && <CardDescription className="text-md text-muted-foreground">{space.description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-6 flex-grow space-y-4">
        <div className="flex items-center text-muted-foreground text-sm">
          <CalendarDays className="mr-2 h-5 w-5" />
          <span>Created: {format(parseISO(space.creationDate), 'MMM d, yyyy')}</span>
        </div>
        {space.goal && (
          <p className="text-sm">
            <span className="font-semibold">Current Goal:</span> {space.goal}
          </p>
        )}
        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Tag className="h-5 w-5 text-muted-foreground" />
            {space.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge> 
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 border-t">
        <Link href={`/spaces/${space.id}`} passHref legacyBehavior>
          <Button variant="default" className="w-full text-lg py-3"> {/* Driver friendly: larger button text */}
            Open Space <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
