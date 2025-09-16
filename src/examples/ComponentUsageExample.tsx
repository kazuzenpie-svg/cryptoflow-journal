import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Import the reusable components
import { 
  LoadingScreen, 
  LoadingSpinner, 
  PageLoading, 
  InlineLoading 
} from '@/components/ui/loading';

import { 
  ConfirmationDialog, 
  DeleteConfirmation, 
  ConnectionConfirmation, 
  SignOutConfirmation,
  useConfirmation 
} from '@/components/ui/confirmation';

import { 
  TransitionWrapper, 
  StatusMessage, 
  FadeTransition, 
  SlideTransition, 
  ScaleTransition,
  PageTransition 
} from '@/components/ui/transitions';

/**
 * This example demonstrates how to use the reusable UI components
 * for loading states, confirmations, and smooth transitions
 */
export const ComponentUsageExample: React.FC = () => {
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showPageLoading, setShowPageLoading] = useState(false);

  // Confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [customConfirmOpen, setCustomConfirmOpen] = useState(false);

  // Transition states
  const [showFadeContent, setShowFadeContent] = useState(true);
  const [showSlideContent, setShowSlideContent] = useState(true);
  const [showScaleContent, setShowScaleContent] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Use the confirmation hook
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Simulate async operations
  const simulateLoading = (duration: number = 2000) => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), duration);
  };

  const handleDeleteConfirm = () => {
    console.log('Item deleted');
    setStatusMessage('Item deleted successfully');
  };

  const handleConnectionConfirm = () => {
    console.log('Connection request sent');
    setStatusMessage('Connection request sent');
  };

  const handleSignOut = () => {
    console.log('User signed out');
    setStatusMessage('Signed out successfully');
  };

  const handleCustomConfirm = async () => {
    const result = await confirm(
      'Custom Action',
      'This is a custom confirmation dialog created with the useConfirmation hook.',
      () => console.log('Custom action confirmed'),
      'warning'
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">UI Components Usage Examples</h1>
        <p className="text-muted-foreground">
          Demonstration of reusable loading, confirmation, and transition components
        </p>
      </div>

      {/* Loading Components Section */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Components</CardTitle>
          <CardDescription>
            Various loading states for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowFullScreen(true)}>
              Show Full Screen Loading
            </Button>
            <Button onClick={() => setShowPageLoading(!showPageLoading)}>
              Toggle Page Loading
            </Button>
            <Button onClick={() => simulateLoading()}>
              Simulate Loading (2s)
            </Button>
          </div>

          {/* Inline loading examples */}
          <div className="space-y-2">
            <h4 className="font-medium">Inline Loading Examples:</h4>
            <InlineLoading text="Fetching data..." />
            <LoadingSpinner size="lg" variant="primary" />
          </div>

          {/* TransitionWrapper with loading */}
          <TransitionWrapper isLoading={isLoading} loadingText="Processing...">
            <Card className="p-4">
              <p>This content will be covered with a loading overlay when isLoading is true.</p>
            </Card>
          </TransitionWrapper>

          {/* Page loading skeleton */}
          {showPageLoading && <PageLoading />}
        </CardContent>
      </Card>

      {/* Confirmation Components Section */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Dialogs</CardTitle>
          <CardDescription>
            Reusable confirmation dialogs for different actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Item
            </Button>
            <Button onClick={() => setShowConnectionDialog(true)}>
              Connect to Trader
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSignOutDialog(true)}
            >
              Sign Out
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setCustomConfirmOpen(true)}
            >
              Custom Confirmation
            </Button>
            <Button onClick={handleCustomConfirm}>
              Hook-based Confirmation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transition Components Section */}
      <Card>
        <CardHeader>
          <CardTitle>Transition Components</CardTitle>
          <CardDescription>
            Smooth transitions and animations for better UX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowFadeContent(!showFadeContent)}>
              Toggle Fade Transition
            </Button>
            <Button onClick={() => setShowSlideContent(!showSlideContent)}>
              Toggle Slide Transition
            </Button>
            <Button onClick={() => setShowScaleContent(!showScaleContent)}>
              Toggle Scale Transition
            </Button>
          </div>

          {/* Transition examples */}
          <div className="space-y-4">
            <FadeTransition show={showFadeContent}>
              <Card className="p-4 bg-blue-50 dark:bg-blue-950/20">
                <p>This content fades in and out smoothly.</p>
              </Card>
            </FadeTransition>

            <SlideTransition show={showSlideContent} direction="up">
              <Card className="p-4 bg-green-50 dark:bg-green-950/20">
                <p>This content slides up and down with smooth animation.</p>
              </Card>
            </SlideTransition>

            <ScaleTransition show={showScaleContent}>
              <Card className="p-4 bg-purple-50 dark:bg-purple-950/20">
                <p>This content scales in and out with smooth animation.</p>
              </Card>
            </ScaleTransition>
          </div>

          {/* Status message */}
          {statusMessage && (
            <StatusMessage
              type="success"
              message={statusMessage}
              onClose={() => setStatusMessage(null)}
            />
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <DeleteConfirmation
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        itemName="Sample Item"
        itemType="trading record"
      />

      <ConnectionConfirmation
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        onConfirm={handleConnectionConfirm}
        traderName="John Doe"
        traderInfo={
          <div className="text-sm text-muted-foreground">
            <p>Trader UID: TRD-12345</p>
            <p>Success Rate: 85%</p>
          </div>
        }
      />

      <SignOutConfirmation
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
      />

      <ConfirmationDialog
        open={customConfirmOpen}
        onOpenChange={setCustomConfirmOpen}
        title="Custom Confirmation"
        description="This is a custom confirmation dialog with additional content."
        confirmText="Proceed"
        variant="warning"
        onConfirm={() => {
          console.log('Custom action confirmed');
          setStatusMessage('Custom action completed');
        }}
      >
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">Additional information or form fields can go here.</p>
        </div>
      </ConfirmationDialog>

      {/* Full screen loading */}
      {showFullScreen && (
        <div className="fixed inset-0 z-50">
          <LoadingScreen
            variant="crypto"
            title="CryptoFlow Journal"
            description="Loading your trading dashboard..."
            showProgress={true}
            progress={75}
          />
          <Button
            className="fixed top-4 right-4 z-51"
            variant="outline"
            onClick={() => setShowFullScreen(false)}
          >
            Close
          </Button>
        </div>
      )}

      {/* Hook-based confirmation component */}
      {ConfirmationComponent}
    </div>
  );
};

export default ComponentUsageExample;