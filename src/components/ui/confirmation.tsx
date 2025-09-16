import React from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle, Info, Trash2, UserPlus, LogOut } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  icon,
  children,
  loading = false
}) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onOpenChange(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          actionClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          iconColor: 'text-destructive',
          defaultIcon: <XCircle className="w-5 h-5" />
        };
      case 'success':
        return {
          actionClass: 'bg-success text-success-foreground hover:bg-success/90',
          iconColor: 'text-success',
          defaultIcon: <CheckCircle className="w-5 h-5" />
        };
      case 'warning':
        return {
          actionClass: 'bg-warning text-warning-foreground hover:bg-warning/90',
          iconColor: 'text-warning',
          defaultIcon: <AlertTriangle className="w-5 h-5" />
        };
      default:
        return {
          actionClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
          iconColor: 'text-primary',
          defaultIcon: <Info className="w-5 h-5" />
        };
    }
  };

  const { actionClass, iconColor, defaultIcon } = getVariantStyles();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className={iconColor}>
              {icon || defaultIcon}
            </span>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={actionClass}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Preset confirmation dialogs for common actions
interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName?: string;
  itemType?: string;
  loading?: boolean;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  itemType = 'item',
  loading = false
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title={`Delete ${itemType}`}
    description={
      itemName 
        ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
        : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`
    }
    confirmText="Delete"
    variant="destructive"
    onConfirm={onConfirm}
    icon={<Trash2 className="w-5 h-5" />}
    loading={loading}
  />
);

interface ConnectionConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  traderName: string;
  traderInfo?: React.ReactNode;
  loading?: boolean;
}

export const ConnectionConfirmation: React.FC<ConnectionConfirmationProps> = ({
  open,
  onOpenChange,
  onConfirm,
  traderName,
  traderInfo,
  loading = false
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Confirm Trader Connection"
    description={`Send a connection request to ${traderName}? They will need to approve it before you can view their trading data.`}
    confirmText="Send Connection Request"
    variant="default"
    onConfirm={onConfirm}
    icon={<UserPlus className="w-5 h-5" />}
    loading={loading}
  >
    {traderInfo}
  </ConfirmationDialog>
);

interface SignOutConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const SignOutConfirmation: React.FC<SignOutConfirmationProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Sign Out"
    description="Are you sure you want to sign out? You will need to sign in again to access your dashboard."
    confirmText="Sign Out"
    variant="warning"
    onConfirm={onConfirm}
    icon={<LogOut className="w-5 h-5" />}
    loading={loading}
  />
);

// Quick confirmation hook for simple yes/no dialogs
export const useConfirmation = () => {
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
  } | null>(null);

  const confirm = React.useCallback((
    title: string,
    description: string,
    onConfirm: () => void,
    variant: 'default' | 'destructive' | 'success' | 'warning' = 'default'
  ) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        open: true,
        title,
        description,
        onConfirm: () => {
          onConfirm();
          resolve(true);
          setDialog(null);
        },
        variant
      });
    });
  }, []);

  const ConfirmationComponent = dialog ? (
    <ConfirmationDialog
      open={dialog.open}
      onOpenChange={(open) => !open && setDialog(null)}
      title={dialog.title}
      description={dialog.description}
      onConfirm={dialog.onConfirm}
      variant={dialog.variant}
    />
  ) : null;

  return { confirm, ConfirmationComponent };
};