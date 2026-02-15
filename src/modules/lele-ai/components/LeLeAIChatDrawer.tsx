import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { X, Send, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLeLeAI } from '../providers/LeLeAIProvider';
import { getPersona } from '../config/personas';
import { LeLeAIChatMessage } from './LeLeAIChatMessage';
import { LeLeAITypingIndicator } from './LeLeAITypingIndicator';

/**
 * Drawer latéral du chat LELE AI.
 * S'ouvre depuis le côté droit avec les messages de conversation.
 */
export function LeLeAIChatDrawer() {
  const { state, dispatch, sendMessage, userRole, userName } = useLeLeAI();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const persona = getPersona(userRole);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  // Focus input quand le drawer s'ouvre
  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [state.isOpen]);

  const handleSend = async () => {
    if (!input.trim() || state.isLoading) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = async (question: string) => {
    await sendMessage(question);
  };

  if (!state.isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={() => dispatch({ type: 'CLOSE_CHAT' })}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-[400px] bg-background border-l border-border z-50',
          'flex flex-col shadow-xl',
          'animate-in slide-in-from-right duration-300'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">LELE AI</h3>
              <p className="text-[10px] text-muted-foreground">
                {persona.tone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => dispatch({ type: 'CLEAR_MESSAGES' })}
              title="Effacer la conversation"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => dispatch({ type: 'CLOSE_CHAT' })}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {state.messages.length === 0 ? (
            <div className="p-4 space-y-4">
              {/* Message d'accueil */}
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">{persona.greeting(userName)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Comment puis-je vous aider ?
                </p>
              </div>

              {/* Questions suggérées */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">
                  Questions suggérées
                </p>
                {persona.suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {state.messages.map((msg) => (
                <LeLeAIChatMessage key={msg.id} message={msg} />
              ))}
              {state.isLoading && <LeLeAITypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 bg-card">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[40px] max-h-[120px]"
              rows={1}
              disabled={state.isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || state.isLoading}
              className="h-10 w-10 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            LELE AI peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>
    </>
  );
}
