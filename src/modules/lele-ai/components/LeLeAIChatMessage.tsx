import { cn } from '@/lib/utils';
import type { AIMessage } from '../types/lele-ai.types';
import { Bot, User } from 'lucide-react';

interface LeLeAIChatMessageProps {
  message: AIMessage;
}

/**
 * Bulle de message dans le chat LELE AI.
 */
export function LeLeAIChatMessage({ message }: LeLeAIChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('flex gap-3 px-4 py-3', isAssistant ? 'bg-muted/30' : '')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          isAssistant ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {isAssistant ? 'LELE AI' : 'Vous'}
        </p>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
