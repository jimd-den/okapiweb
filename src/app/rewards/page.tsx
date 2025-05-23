
"use client";

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Palette, ShieldCheck, Zap } from 'lucide-react';
import { UserProfileBadge } from '@/components/user-profile-badge';
import { Progress } from "@/components/ui/progress";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Sample data for unlocks
const unlockedItems = [
  { id: '1', name: 'Ocean Blue Space Theme', icon: Palette, description: 'A calming blue theme for your spaces.' },
  { id: '2', name: 'Efficiency Master Badge', icon: ShieldCheck, description: 'Awarded for completing 50 actions.' },
  { id: '3', name: 'Double Points Weekend', icon: Zap, description: 'All actions earn double points (active next weekend).' },
  { id: '4', name: 'Forest Canopy Theme', icon: Palette, description: 'A vibrant green theme.' },
  { id: '5', name: 'Productivity Pro Badge', icon: ShieldCheck, description: 'Awarded for 100 logged items.' },
  { id: '6', name: 'Super Focus Mode UI', icon: Zap, description: 'Minimalist UI for deep work.' },
];

// Assume UserProgress includes current points and points needed for next level
const userProgressData = {
  currentPoints: 1250,
  level: 5,
  pointsForNextLevel: 2000,
  pointsInCurrentLevel: 250, // currentPoints - pointsAtStartOfLevel(5)
  pointsToLevelUpCurrent: 750, // pointsForNextLevel - currentPoints
};


export default function RewardsPage() {
  const progressPercentage = (userProgressData.pointsInCurrentLevel / (userProgressData.pointsInCurrentLevel + userProgressData.pointsToLevelUpCurrent)) * 100;

  return (
    <div className="flex flex-col h-screen"> {/* Changed min-h-screen to h-screen */}
      <Header pageTitle="Your Rewards & Progress" />
      <div className="flex-grow flex flex-col overflow-hidden"> {/* Manages scrolling for content below header */}
        <ScrollArea className="flex-1">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <Card className="mb-8 shadow-lg">
              <CardHeader className="items-center text-center p-6">
                <Award className="h-20 w-20 text-accent mb-4" />
                <CardTitle className="text-3xl">Level {userProgressData.level}</CardTitle>
                <CardDescription className="text-lg">You have <span className="font-bold text-primary">{userProgressData.currentPoints}</span> points!</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="mb-2 flex justify-between text-md text-muted-foreground">
                  <span>Progress to Level {userProgressData.level + 1}</span>
                  <span>{userProgressData.pointsToLevelUpCurrent} XP to go</span>
                </div>
                <Progress value={progressPercentage} className="w-full h-4 mb-4" />
                <p className="text-center text-muted-foreground text-sm">Keep logging actions and completing tasks to level up!</p>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-semibold mb-6 mt-10">Unlocked Rewards & Customizations</h2>
            {unlockedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unlockedItems.map((item) => (
                  <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-medium">{item.name}</CardTitle>
                      <item.icon className="h-8 w-8 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-md text-muted-foreground">{item.description}</p>
                      <Badge variant="default" className="mt-3 text-sm">Unlocked</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-lg text-muted-foreground text-center py-10">No rewards unlocked yet. Keep up the good work!</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
