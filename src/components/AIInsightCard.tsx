import { Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface AIInsightCardProps {
  title: string;
  description?: string;
  insights: string;
  type?: 'success' | 'warning' | 'info';
  confidence?: number;
  className?: string;
}

export function AIInsightCard({ 
  title, 
  description, 
  insights, 
  type = 'info',
  confidence,
  className = '' 
}: AIInsightCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Target className="w-5 h-5 text-blue-500" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'success':
        return 'from-green-500/10 to-emerald-500/10 border-green-500/20';
      case 'warning':
        return 'from-orange-500/10 to-amber-500/10 border-orange-500/20';
      default:
        return 'from-blue-500/10 to-purple-500/10 border-blue-500/20';
    }
  };

  return (
    <Card className={`bg-gradient-to-br ${getGradient()} ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            IA
          </Badge>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{insights}</p>
          {confidence && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Confiance:</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="font-medium">{confidence}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
