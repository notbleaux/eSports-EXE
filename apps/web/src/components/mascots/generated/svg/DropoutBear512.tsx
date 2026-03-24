/**
 * Mock DropoutBear512 SVG Component
 */
import React from 'react';

const DropoutBear512: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="256" cy="256" r="224" fill="#8B4513" />
    <circle cx="192" cy="224" r="32" fill="#000" />
    <circle cx="320" cy="224" r="32" fill="#000" />
    <ellipse cx="256" cy="320" rx="64" ry="48" fill="#DC143C" />
  </svg>
);

export default DropoutBear512;
