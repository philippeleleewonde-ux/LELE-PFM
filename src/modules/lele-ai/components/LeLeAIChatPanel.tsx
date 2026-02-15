import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { Send, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLeLeAI } from '../providers/LeLeAIProvider';
import { getPersona } from '../config/personas';
import { LeLeAIChatMessage } from './LeLeAIChatMessage';
import { LeLeAITypingIndicator } from './LeLeAITypingIndicator';
import { LeLeAIMorningBrief } from './LeLeAIMorningBrief';

/**
 * Panel inline du chat LELE AI.
 * S'affiche dans le flux de la page (onglet IA LELE-HCM), pas en overlay.
 */
export function LeLeAIChatPanel() {
  const { state, dispatch, sendMessage, userRole, userName } = useLeLeAI();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const persona = getPersona(userRole);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  // Focus input au montage
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

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

  return (
    <div className="flex gap-4 h-[calc(100vh-320px)] min-h-[400px]">
      {/* Zone principale du chat */}
      <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => dispatch({ type: 'CLEAR_MESSAGES' })}
            title="Effacer la conversation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Morning Brief */}
        <div className="px-4 pt-4">
          <LeLeAIMorningBrief />
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

      {/* Sidebar droite — Questions suggérées */}
      {state.messages.length === 0 && (
        <div className="hidden lg:flex flex-col w-64 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            Questions suggérées
          </p>
          <div className="space-y-2">
            {persona.suggestedQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedQuestion(question)}
                className={cn(
                  'w-full text-left text-xs px-3 py-2.5 rounded-lg',
                  'border border-border hover:bg-accent hover:border-primary/30',
                  'transition-colors duration-200'
                )}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
