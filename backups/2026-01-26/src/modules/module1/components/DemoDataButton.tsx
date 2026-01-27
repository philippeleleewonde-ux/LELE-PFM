'use client';

import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoDataButtonProps {
  onClick: () => void;
}

export function DemoDataButton({ onClick }: DemoDataButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="default"
      size="sm"
      className="!text-slate-900 dark:!text-slate-900"
      title="Generate Demo Data (Ctrl+G)"
    >
      <div className="flex items-center space-x-2">
        <Zap className="w-4 h-4" />
        <span className="font-medium">Generate Demo</span>
      </div>
    </Button>
  );
}
