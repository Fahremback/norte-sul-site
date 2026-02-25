import React from 'react';

// Share Icon
// Source: heroicons (MIT License) - https://heroicons.com/
const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.05.588.08m-5.88.08a2.25 2.25 0 110-2.186m0 2.186c-.195-.025-.39-.05-.588-.08m5.88-.08l-2.186-1.16m2.186 1.16l2.186-1.16m-2.186 1.16v2.186M12 14.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm0 0v2.186m0-2.186c-.195-.025-.39-.05-.588-.08m5.88-.08a2.25 2.25 0 100 2.186m0-2.186c-.195.025-.39.05-.588.08m0-2.186l-2.186-1.16m2.186 1.16l-2.186 1.16m0 0v2.186" />
  </svg>
);

export default ShareIcon;