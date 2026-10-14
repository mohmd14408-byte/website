import React from 'react';
import MinistryLogo from './MinistryLogo';

interface LogoUploaderProps {
  className?: string;
  compact?: boolean;
}

/**
 * Logo display component.
 * Logo editing/changing functionality has been removed as requested.
 * Displays the permanently saved Ministry/School logo.
 */
export default function LogoUploader({ className = '' }: LogoUploaderProps) {
  return (
    <div className={`inline-flex items-center ${className}`} dir="rtl">
      <MinistryLogo variant="light" className="h-12 w-auto" />
    </div>
  );
}
