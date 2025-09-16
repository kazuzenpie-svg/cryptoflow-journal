import { ReactNode, memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from './AuthScreen';
import { Card, CardContent } from '@/components/ui/card';

interface AuthGuardProps {
  children: ReactNode;
}

// Enhanced loading component with better visual feedback
const LoadingScreen = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-l-primary/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">CryptoFlow Journal</h3>
            <p className="text-sm text-muted-foreground animate-pulse">
              Preparing your dashboard...
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
));

LoadingScreen.displayName = 'LoadingScreen';

export const AuthGuard = memo(function AuthGuard({ children }: AuthGuardProps) {
  const { loading, isAuthenticated, initializing } = useAuth();

  // Show optimized loading state
  if (loading || initializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
});