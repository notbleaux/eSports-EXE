/**
 * Mock DropoutBear128 SVG Component
 */
import React from 'react';

const DropoutBear128: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="64" cy="64" r="56" fill="#8B4513" />
    <circle cx="48" cy="56" r="8" fill="#000" />
    <circle cx="80" cy="56" r="8" fill="#000" />
    <ellipse cx="64" cy="80" rx="16" ry="12" fill="#DC143C" />
  </svg>
);

export default DropoutBear128;
