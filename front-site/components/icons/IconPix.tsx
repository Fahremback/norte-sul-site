import React from 'react';

// Simplified PIX Icon based on common representations
// Source: Lucide Icons (MIT License) - https://lucide.dev/icons/pix
// Adapted for simplicity and direct SVG embedding
const IconPix: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 8c0-2.2-1.8-4-4-4H7c-2.2 0-4 1.8-4 4v8c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4Z" />
    <path d="m15 12-4-4" />
    <path d="M15 12h-6" />
    <path d="m15 12 1-4" />
    <path d="M9 12v6" />
    <path d="M9 12H7" />
  </svg>
);

export default IconPix;