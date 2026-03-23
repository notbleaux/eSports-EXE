/**
 * Mock DropoutBear256 SVG Component
 */
import React from 'react';

const DropoutBear256: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="128" cy="128" r="112" fill="#8B4513" />
    <circle cx="96" cy="112" r="16" fill="#000" />
    <circle cx="160" cy="112" r="16" fill="#000" />
    <ellipse cx="128" cy="160" rx="32" ry="24" fill="#DC143C" />
  </svg>
);

export default DropoutBear256;
