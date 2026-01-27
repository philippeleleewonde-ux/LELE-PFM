import { HCMLoader } from '@/components/ui/HCMLoader';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <HCMLoader text={message} />
    </div>
  );
}
