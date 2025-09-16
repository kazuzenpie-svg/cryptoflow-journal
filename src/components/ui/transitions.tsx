import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, XCircle, Info, Loader2 } from 'lucide-react';

interface TransitionWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  className
}) => {
  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{loadingText}</span>
          </div>
        </div>
      )}
      <div className={cn("transition-opacity duration-200", isLoading && "opacity-50")}>
        {children}
      </div>
    </div>
  );
};

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  title,
  message,
  action,
  className,
  onClose
}) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          textColor: 'text-success',
          iconColor: 'text-success'
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          textColor: 'text-destructive',
          iconColor: 'text-destructive'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          textColor: 'text-warning',
          iconColor: 'text-warning'
        };
      case 'loading':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          textColor: 'text-primary',
          iconColor: 'text-primary'
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          textColor: 'text-blue-600',
          iconColor: 'text-blue-500'
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, iconColor } = getStatusConfig();

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all duration-200",
      bgColor,
      borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={iconColor}>
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          {title && (
            <h4 className={cn("font-medium text-sm", textColor)}>
              {title}
            </h4>
          )}
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
          {action && (
            <div className="mt-2">
              {action}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  show,
  children,
  className,
  duration = 200
}) => {
  return (
    <div
      className={cn(
        "transition-opacity ease-in-out",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

interface SlideTransitionProps {
  show: boolean;
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  duration?: number;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  show,
  children,
  direction = 'up',
  className,
  duration = 300
}) => {
  const getTransformClass = () => {
    if (show) return 'translate-x-0 translate-y-0';
    
    switch (direction) {
      case 'up':
        return 'translate-y-4';
      case 'down':
        return '-translate-y-4';
      case 'left':
        return 'translate-x-4';
      case 'right':
        return '-translate-x-4';
      default:
        return 'translate-y-4';
    }
  };

  return (
    <div
      className={cn(
        "transition-all ease-in-out",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
        getTransformClass(),
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

interface ScaleTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  show,
  children,
  className,
  duration = 200
}) => {
  return (
    <div
      className={cn(
        "transition-all ease-in-out",
        show ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

// Utility component for smooth page transitions
interface PageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isLoading = false,
  className
}) => {
  return (
    <FadeTransition show={!isLoading} className={className}>
      {children}
    </FadeTransition>
  );
};