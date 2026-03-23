/**
 * Mock DropoutBear32 SVG Component
 */
import React from 'react';

const DropoutBear32: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="16" cy="16" r="14" fill="#8B4513" />
    <circle cx="12" cy="14" r="2" fill="#000" />
    <circle cx="20" cy="14" r="2" fill="#000" />
    <ellipse cx="16" cy="20" rx="4" ry="3" fill="#DC143C" />
  </svg>
);

export default DropoutBear32;
