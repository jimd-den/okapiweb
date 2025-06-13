
"use client";

import { UserCircle2 } from 'lucide-react'; // Using a generic user icon

// Removed UserProgress related imports and logic as global leveling is being deprecated.

export function UserProfileBadge() {
  // Simplified to a static display.
  // If user authentication is added later, this can show user info.
  return (
    <div className="flex items-center space-x-2 p-2 rounded-lg bg-card shadow-sm border border-border">
      <UserCircle2 className="h-8 w-8 text-muted-foreground" />
      {/* 
        Optionally, if user authentication exists, display username:
        <div>
          <p className="text-sm font-semibold text-card-foreground">User Name</p>
        </div> 
      */}
    </div>
  );
}
