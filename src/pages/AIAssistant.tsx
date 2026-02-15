import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import { useAILimits } from '@/hooks/useAILimits';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles } from 'lucide-react';
import { LeLeAIChatPanel } from '@/modules/lele-ai/components/LeLeAIChatPanel';

export default function AIAssistant() {
  const { creditsRemaining, planType } = useAILimits();

  return (
    <div className="flex h-screen overflow-hidden">
      <CEOSidebar />

      <main className="flex-1 overflow-y-auto relative">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <SidebarToggle />
              <Bot className="hidden sm:block w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="hidden sm:block text-lg font-bold text-foreground">
                IA LELE-HCM
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {creditsRemaining} crédit{creditsRemaining !== 1 ? 's' : ''}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs capitalize bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
              >
                Plan {planType}
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Content — LELE AI Chat */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <LeLeAIChatPanel />
        </div>
      </main>
    </div>
  );
}
