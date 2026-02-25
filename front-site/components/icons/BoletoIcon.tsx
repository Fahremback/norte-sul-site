import React from 'react';

// Simplified Boleto Icon (Barcode)
// Source: FontAwesome (Creative Commons Attribution 4.0 International license)
// Adapted for direct SVG embedding
const BoletoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    fill="currentColor" 
    {...props}
  >
    <path d="M0 224v64h64V224H0zm128 0v64h32V224h-32zm64-64v192h32V160h-32zm64 0v192h32V160h-32zm-128 0v192h64V160h-64zM96 224v64h32V224H96zM448 160v192h64V160h-64zm-160 64v64h32V224h-32zm-64 0v64h64V224h-64zm128-64v192h64V160h-64z"/>
  </svg>
);

export default BoletoIcon;
