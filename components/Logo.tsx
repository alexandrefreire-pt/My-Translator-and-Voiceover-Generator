import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="20" width="80" height="60" rx="15" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="4"/>
      <path d="M30 50 L40 65 L50 35 L60 65 L70 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="85" cy="15" r="8" fill="#800020" />
    </svg>
  );
};

export default Logo;