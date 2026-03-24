/**
 * Mock DropoutBear64 SVG Component
 */
import React from 'react';

const DropoutBear64: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="32" cy="32" r="28" fill="#8B4513" />
    <circle cx="24" cy="28" r="4" fill="#000" />
    <circle cx="40" cy="28" r="4" fill="#000" />
    <ellipse cx="32" cy="40" rx="8" ry="6" fill="#DC143C" />
  </svg>
);

export default DropoutBear64;
