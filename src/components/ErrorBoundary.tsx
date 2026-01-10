import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console for debugging
    console.error('🔴 ERROR BOUNDARY CAUGHT:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-2xl w-full bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Erreur de chargement</h2>
                <p className="text-sm text-muted-foreground">Une erreur s'est produite lors du chargement du module</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">Détails de l'erreur :</h3>
                <pre className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
                  {this.state.error?.toString()}
                </pre>
              </div>

              {this.state.errorInfo && (
                <details className="bg-muted/50 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-foreground mb-2">
                    Stack trace (pour les développeurs)
                  </summary>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-2 overflow-auto max-h-96">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Recharger la page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Retour
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
