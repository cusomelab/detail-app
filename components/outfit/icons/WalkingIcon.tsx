import React from 'react';

export const WalkingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2" />
    <path d="M12 6v6" />
    <path d="M15 12l-3 6" />
    <path d="M9 12l-3 6" />
    <path d="m14 8-2 2-2-2" />
  </svg>
);
