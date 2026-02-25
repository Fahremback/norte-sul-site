import React from 'react';

const TruckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5A2.25 2.25 0 005.625 21h12.75c.39 0 .744-.12.992-.323m-15.082-6.323a2.25 2.25 0 01-2.24-2.228V6.75a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121 6.75v5.228a2.25 2.25 0 01-2.24 2.228m-15.082-6.323l-.105-.316a2.25 2.25 0 012.24-2.228h15a2.25 2.25 0 012.24 2.228l-.105.316m-19.48 0h19.48" />
    </svg>
);

export default TruckIcon;
