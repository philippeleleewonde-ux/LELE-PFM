/**
 * Animation "LELE AI réfléchit..." pendant le chargement.
 */
export function LeLeAITypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground">LELE AI</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
