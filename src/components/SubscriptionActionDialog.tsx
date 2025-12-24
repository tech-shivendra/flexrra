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
import { Pause, Play, Loader2, AlertTriangle } from 'lucide-react';

interface SubscriptionActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'pause' | 'resume';
  remainingPauses?: number;
  daysUntilCanPause?: number;
  isLoading: boolean;
  onConfirm: () => void;
}

export const SubscriptionActionDialog = ({
  open,
  onOpenChange,
  action,
  remainingPauses = 0,
  daysUntilCanPause = 0,
  isLoading,
  onConfirm,
}: SubscriptionActionDialogProps) => {
  const isPause = action === 'pause';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isPause ? 'bg-warning/10' : 'bg-success/10'
          }`}>
            {isPause ? (
              <Pause className="h-7 w-7 text-warning" />
            ) : (
              <Play className="h-7 w-7 text-success" />
            )}
          </div>
          <AlertDialogTitle className="text-center">
            {isPause ? 'Pause Subscription?' : 'Resume Subscription?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            {isPause ? (
              <>
                <p>
                  Your subscription will be paused and you won't be able to access gyms until you resume.
                </p>
                {remainingPauses > 0 && (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-warning/10 px-4 py-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {remainingPauses} pause{remainingPauses > 1 ? 's' : ''} remaining
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Note: You must wait 10 days after resuming before you can pause again.
                </p>
              </>
            ) : (
              <p>
                Your subscription will be resumed and you'll get access to all partner gyms again.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-3">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={isPause ? 'bg-warning hover:bg-warning/90' : ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPause ? 'Pausing...' : 'Resuming...'}
              </>
            ) : (
              <>
                {isPause ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Subscription
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume Subscription
                  </>
                )}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
