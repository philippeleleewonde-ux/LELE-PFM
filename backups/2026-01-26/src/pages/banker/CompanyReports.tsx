import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BankerModuleAccess } from '@/components/BankerModuleAccess';
import { ArrowLeft, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Module1Report from './Module1Report';
import Module3Report from './Module3Report';

export default function CompanyReports() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: performanceScores } = useQuery({
    queryKey: ['performance-scores', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_performance_scores')
        .select('*')
        .eq('company_id', companyId!)
        .order('calculation_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Entreprise introuvable</CardTitle>
            <CardDescription>
              L'entreprise demandée n'existe pas ou vous n'avez pas accès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/banker/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au portfolio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/banker/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">{company.name}</h1>
          <div className="flex gap-2 items-center mt-2">
            <Badge variant="outline">{company.industry}</Badge>
            <span className="text-sm text-muted-foreground">
              {company.employees_count} employés
            </span>
          </div>
        </div>
      </div>

      {/* Scores de performance */}
      {performanceScores && performanceScores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {performanceScores.slice(0, 2).map((score) => (
            <Card key={score.id}>
              <CardHeader>
                <CardTitle className="text-sm">Module {score.module_number}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{score.score_value}/100</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={
                      score.risk_level === 'LOW'
                        ? 'default'
                        : score.risk_level === 'MEDIUM'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    Risque {score.risk_level}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Onglets des modules */}
      <Tabs defaultValue="module1" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="module1">
            <TrendingUp className="h-4 w-4 mr-2" />
            Module 1 - Planification
          </TabsTrigger>
          <TabsTrigger value="module3">
            <DollarSign className="h-4 w-4 mr-2" />
            Module 3 - Économies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="module1" className="space-y-4">
          <BankerModuleAccess companyId={companyId!} moduleNumber={1}>
            <Module1Report />
          </BankerModuleAccess>
        </TabsContent>

        <TabsContent value="module3" className="space-y-4">
          <BankerModuleAccess companyId={companyId!} moduleNumber={3}>
            <Module3Report />
          </BankerModuleAccess>
        </TabsContent>
      </Tabs>
    </div>
  );
}
