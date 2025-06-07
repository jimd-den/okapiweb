
"use client";

import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function RewardsPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header pageTitle="Rewards & Progress" />
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-center">
                <Construction className="h-10 w-10 text-primary mr-3" />
                Rewards Under Construction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg">
                The global rewards and leveling system is being re-evaluated.
                Space-specific metrics are now available on each Space Dashboard!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
