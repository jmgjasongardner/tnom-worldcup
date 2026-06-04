import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  width?: 'default' | 'wide' | 'narrow';
  className?: string;
}

export function PageContainer({ children, width = 'default', className = '' }: PageContainerProps) {
  const widthClass =
    width === 'wide' ? 'page-container--wide'
    : width === 'narrow' ? 'page-container--narrow'
    : '';

  return (
    <div className={`page-container ${widthClass} ${className}`}>
      {children}
    </div>
  );
}
