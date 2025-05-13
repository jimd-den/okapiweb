import type { SVGProps } from 'react';

export function OkapiLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="Okapi Workflow Game Logo"
      {...props}
    >
      <rect width="100" height="100" rx="20" fill="hsl(var(--primary))" />
      {/* Simple 'O' shape */}
      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="10" />
      {/* Abstract okapi stripes - simplified */}
      <path d="M30 70 Q 40 60 50 70 T 70 70" stroke="hsl(var(--primary-foreground))" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M35 80 Q 45 70 55 80 T 75 80" stroke="hsl(var(--primary-foreground))" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
