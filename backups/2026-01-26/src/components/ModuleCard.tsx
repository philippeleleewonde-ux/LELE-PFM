import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModuleConfig, ModuleAccess } from '@/types/modules';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, DollarSign, Award, ArrowRight } from 'lucide-react';

interface ModuleCardProps {
  module: ModuleConfig;
  access: ModuleAccess;
}

const iconMap = {
  TrendingUp,
  Users,
  DollarSign,
  Award
};

export function ModuleCard({ module, access }: ModuleCardProps) {
  const Icon = iconMap[module.icon as keyof typeof iconMap];

  const getAccessBadge = () => {
    if (access.canAdmin) return { label: 'Admin complet', variant: 'default' as const };
    if (access.canWrite) return { label: 'Lecture & Écriture', variant: 'secondary' as const };
    if (access.canRead) return { label: 'Lecture seule', variant: 'outline' as const };
    return null;
  };

  const badge = getAccessBadge();
  if (!badge) return null;

  return (
    <Link to={module.route}>
      <Card 
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary"
        style={{
          borderLeftColor: module.color,
          borderLeftWidth: '4px'
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: module.accentColor }}
            >
              <Icon className="h-6 w-6" style={{ color: module.color }} />
            </div>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
            {module.name}
          </CardTitle>
          <CardDescription>{module.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
            Accéder au module
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
