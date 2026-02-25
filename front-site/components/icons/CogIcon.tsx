import React from 'react';

const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0A7.46 7.46 0 013 12.065M21 12.065A7.46 7.46 0 0119.5 12m-16.5 0a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5M12 4.5A3.75 3.75 0 0115.75 8.25V12m0 3.75v3.75A3.75 3.75 0 0112 19.5m-3.75-3.75V12m0-3.75V4.5A3.75 3.75 0 018.25 8.25M12 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

export default CogIcon;