# UI Components Integration Guide

This guide shows how to integrate the reusable loading, confirmation, and transition components into your CryptoFlow Journal application for smooth user experiences.

## 🚀 Available Components

### Loading Components (`src/components/ui/loading.tsx`)

- **LoadingScreen**: Full-screen loading with crypto-themed animations
- **LoadingSpinner**: Reusable spinner with different sizes and variants
- **PageLoading**: Skeleton loading for page content
- **InlineLoading**: Small inline loading indicators

### Confirmation Components (`src/components/ui/confirmation.tsx`)

- **ConfirmationDialog**: Generic confirmation dialog
- **DeleteConfirmation**: Pre-configured for delete actions
- **ConnectionConfirmation**: For trader connection requests
- **SignOutConfirmation**: For sign-out actions
- **useConfirmation**: Hook for programmatic confirmations

### Transition Components (`src/components/ui/transitions.tsx`)

- **TransitionWrapper**: Wraps content with loading overlay
- **StatusMessage**: Styled status/notification messages
- **FadeTransition**: Smooth fade in/out animations
- **SlideTransition**: Slide animations (up/down/left/right)
- **ScaleTransition**: Scale in/out animations
- **PageTransition**: For page navigation transitions

## 📖 Integration Examples

### 1. Dashboard Loading States

```typescript
// In your dashboard components
import { LoadingScreen, PageLoading, TransitionWrapper } from '@/components/ui/loading';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Full screen loading
  if (isLoading) {
    return (
      <LoadingScreen
        variant="crypto"
        title="CryptoFlow Journal"
        description="Loading your trading dashboard..."
        showProgress={true}
        progress={loadingProgress}
      />
    );
  }

  return (
    <TransitionWrapper isLoading={dataLoading} loadingText="Updating data...">
      <div className="dashboard-content">
        {/* Your dashboard content */}
      </div>
    </TransitionWrapper>
  );
};
```

### 2. Trader Connection Flow

```typescript
// In InvestorDashboard.tsx
import { ConnectionConfirmation } from '@/components/ui/confirmation';
import { StatusMessage } from '@/components/ui/transitions';

const InvestorDashboard = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const handleConnectClick = (trader) => {
    setSelectedTrader(trader);
    setShowConnectionDialog(true);
  };

  const handleConnectionConfirm = async () => {
    try {
      // Your connection logic here
      await sendConnectionRequest(selectedTrader.trader_uid);
      setConnectionStatus({
        type: 'success',
        message: `Connection request sent to ${selectedTrader.full_name}`
      });
    } catch (error) {
      setConnectionStatus({
        type: 'error',
        message: 'Failed to send connection request'
      });
    }
    setShowConnectionDialog(false);
  };

  return (
    <div>
      {/* Status message */}
      {connectionStatus && (
        <StatusMessage
          type={connectionStatus.type}
          message={connectionStatus.message}
          onClose={() => setConnectionStatus(null)}
        />
      )}

      {/* Trader list with connect buttons */}
      {traders.map(trader => (
        <div key={trader.id}>
          <Button onClick={() => handleConnectClick(trader)}>
            Connect
          </Button>
        </div>
      ))}

      {/* Connection confirmation dialog */}
      <ConnectionConfirmation
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        onConfirm={handleConnectionConfirm}
        traderName={selectedTrader?.full_name || ''}
        traderInfo={
          selectedTrader && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Trader UID: {selectedTrader.trader_uid}</p>
              <p>Success Rate: {selectedTrader.success_rate}%</p>
            </div>
          )
        }
      />
    </div>
  );
};
```

### 3. Delete Operations

```typescript
// In any component that handles deletions
import { DeleteConfirmation } from '@/components/ui/confirmation';

const TradesList = () => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, trade: null });

  const handleDeleteClick = (trade) => {
    setDeleteDialog({ open: true, trade });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTrade(deleteDialog.trade.id);
      // Refresh data or update state
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {/* Your trades list */}
      <DeleteConfirmation
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.trade?.symbol}
        itemType="trade"
      />
    </div>
  );
};
```

### 4. Smooth Page Transitions

```typescript
// In your route components
import { PageTransition, FadeTransition } from '@/components/ui/transitions';

const AnimatedPage = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);
  }, []);

  return (
    <FadeTransition show={isVisible} duration={300}>
      {children}
    </FadeTransition>
  );
};
```

### 5. Form Submissions with Loading

```typescript
// In form components
import { InlineLoading, StatusMessage } from '@/components/ui/loading';
import { useConfirmation } from '@/components/ui/confirmation';

const TradeForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const { confirm, ConfirmationComponent } = useConfirmation();

  const handleSubmit = async (data) => {
    const confirmed = await confirm(
      'Submit Trade',
      'Are you sure you want to submit this trade record?',
      () => {}, // Empty function, actual logic below
      'default'
    );

    if (confirmed) {
      setIsSubmitting(true);
      try {
        await submitTrade(data);
        setSubmitStatus({
          type: 'success',
          message: 'Trade submitted successfully!'
        });
      } catch (error) {
        setSubmitStatus({
          type: 'error',
          message: 'Failed to submit trade'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {submitStatus && (
        <StatusMessage
          type={submitStatus.type}
          message={submitStatus.message}
          onClose={() => setSubmitStatus(null)}
        />
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <InlineLoading text="Submitting..." size="sm" />
        ) : (
          'Submit Trade'
        )}
      </Button>

      {ConfirmationComponent}
    </form>
  );
};
```

## 🎨 Styling and Theming

All components follow your existing design system:

- Use CSS variables for colors (`--primary`, `--destructive`, etc.)
- Support dark/light mode automatically
- Consistent with shadcn/ui components
- Crypto-themed animations for the loading screen

## 🔄 Animation Performance

- All transitions use CSS transforms for optimal performance
- Hardware acceleration enabled for smooth animations
- Configurable duration and easing
- Respects user's motion preferences

## 📱 Responsive Design

- Components work on all screen sizes
- Touch-friendly on mobile devices
- Proper focus management for accessibility

## 🛠 Best Practices

1. **Loading States**: Always provide feedback for async operations
2. **Confirmations**: Use appropriate variants (destructive for deletes, warning for important actions)
3. **Transitions**: Keep animations subtle and fast (200-300ms)
4. **Status Messages**: Auto-dismiss or provide close button
5. **Accessibility**: All components include proper ARIA labels and focus management

## 🚦 Quick Start

1. Import the components you need
2. Add loading states to your async operations
3. Replace alert() calls with proper confirmation dialogs
4. Wrap content in transition components for smooth UX
5. Use status messages for user feedback

The components are designed to work seamlessly with your existing CryptoFlow Journal architecture and provide a consistent, professional user experience across the application.