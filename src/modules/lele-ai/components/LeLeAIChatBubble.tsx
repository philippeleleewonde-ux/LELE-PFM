import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeLeAI } from '../providers/LeLeAIProvider';

/**
 * Bouton flottant en bas à droite pour ouvrir le chat LELE AI.
 */
export function LeLeAIChatBubble() {
  const { state, dispatch } = useLeLeAI();

  if (state.isOpen) return null;

  const hasUnread = state.nudges.some((n) => !n.isRead);

  return (
    <button
      onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'w-14 h-14 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-all duration-200 hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
      aria-label="Ouvrir LELE AI"
    >
      <Sparkles className="w-6 h-6" />

      {/* Badge notification */}
      {hasUnread && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
          <span className="text-[10px] font-bold text-destructive-foreground">
            {state.nudges.filter((n) => !n.isRead).length}
          </span>
        </span>
      )}
    </button>
  );
}
