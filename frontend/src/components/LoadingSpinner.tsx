import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
  fullScreen = false,
}) => {
  const containerClass = fullScreen
    ? 'fixed inset-0 bg-background bg-opacity-80 backdrop-blur-sm z-50 flex flex-col items-center justify-center'
    : 'w-full py-12 flex flex-col items-center justify-center space-y-4';

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        {/* Glow effect */}
        <div className="absolute w-12 h-12 rounded-full bg-primary/20 blur-md animate-pulse"></div>
        <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
      </div>
      <p className="text-sm font-medium text-textSecondary tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;
