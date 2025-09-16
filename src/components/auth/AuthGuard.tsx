import { ReactNode, memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from './AuthScreen';
import { LoadingScreen } from '@/components/ui/loading';

interface AuthGuardProps {
  children: ReactNode;
}



export const AuthGuard = memo(function AuthGuard({ children }: AuthGuardProps) {
  const { loading, isAuthenticated, initializing } = useAuth();

  // Show optimized loading state
  if (loading || initializing) {
    return (
      <LoadingScreen
        variant="crypto"
        title="CryptoFlow Journal"
        description="Preparing your dashboard..."
        showProgress={true}
        progress={70}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
});