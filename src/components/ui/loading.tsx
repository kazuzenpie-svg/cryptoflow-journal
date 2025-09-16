import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, Wallet } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'default',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const variantClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
};

interface LoadingScreenProps {
  title?: string;
  description?: string;
  showProgress?: boolean;
  progress?: number;
  variant?: 'default' | 'crypto' | 'minimal';
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = 'CryptoFlow Journal',
  description = 'Preparing your dashboard...',
  showProgress = false,
  progress = 70,
  variant = 'default',
  className
}) => {
  const cryptoVariant = (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className={cn("w-full max-w-md", className)}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Dual ring spinner with wallet icon */}
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-l-primary/40 rounded-full animate-spin" 
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            
            {/* Title and description */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gradient-primary">{title}</h3>
              <p className="text-sm text-muted-foreground animate-pulse">
                {description}
              </p>
            </div>
            
            {/* Progress bar */}
            {showProgress && (
              <div className="w-full space-y-2">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all duration-500 ease-out animate-pulse" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center text-muted-foreground">{progress}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const minimalVariant = (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <LoadingSpinner size="md" variant="primary" />
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
  );

  const defaultVariant = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" variant="primary" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );

  switch (variant) {
    case 'crypto':
      return cryptoVariant;
    case 'minimal':
      return minimalVariant;
    default:
      return defaultVariant;
  }
};

interface PageLoadingProps {
  children?: React.ReactNode;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ children, className }) => (
  <div className={cn("space-y-6", className)}>
    {children || (
      <>
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted/50 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-muted/30 rounded animate-pulse"></div>
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="crypto-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted/50 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    )}
  </div>
);

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  text = 'Loading...', 
  size = 'sm',
  className 
}) => (
  <div className={cn("flex items-center space-x-2", className)}>
    <LoadingSpinner size={size} variant="primary" />
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);