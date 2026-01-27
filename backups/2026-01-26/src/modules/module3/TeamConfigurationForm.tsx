import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getBusinessLinesByCompanyId } from '@/lib/businessLinesService';
import { SupabaseService } from '@/modules/module1/services/SupabaseService';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { BusinessLine } from '@/types/business-lines';
import { AlertCircle, Building2, Target, ArrowRight, Sparkles, Users, CheckCircle2, Info, UsersRound, Lock, Hash, Edit3 } from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Type for team entity
interface Team {
  id: string;
  business_line_id: string;
  team_number: number;
  team_name: string;
  team_mission: string | null;
  is_configured: boolean;
}

export default function TeamConfigurationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId, isLoading: isCompanyLoading } = useCompany();

  // User role detection for CEO permissions
  const { user } = useAuth();
  const { role: userRole } = useUserRole(user?.id);
  const isCEO = userRole === 'CEO';

  // Form state
  const [selectedBusinessLine, setSelectedBusinessLine] = useState('');
  const [selectedTeamNumber, setSelectedTeamNumber] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamMission, setTeamMission] = useState('');

  // Data state
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [businessLinesWithStats, setBusinessLinesWithStats] = useState<Array<BusinessLine & {
    registeredCount: number;
    configuredTeamsCount: number;
  }>>([]);
  const [existingTeams, setExistingTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected line info
  const selectedLineInfo = businessLinesWithStats.find(line => line.id === selectedBusinessLine);
  const totalTeamsForLine = selectedLineInfo?.team_count || 1;

  // Generate team options (1 to teamCount)
  const teamOptions = Array.from({ length: totalTeamsForLine }, (_, i) => i + 1);

  // Check if selected team already exists
  const existingTeam = existingTeams.find(
    t => t.business_line_id === selectedBusinessLine && t.team_number === selectedTeamNumber
  );

  // Lock editing for non-CEO users when team is already configured
  const isFieldsLocked = existingTeam?.is_configured && !isCEO;

  // Function to refresh stats (employee counts and configured teams)
  const refreshStats = useCallback(async (lines: BusinessLine[]) => {
    if (!lines || lines.length === 0) return;

    const linesWithStats = await Promise.all(
      lines.map(async (line) => {
        // Count employees for this business line
        const { count: employeeCount, error: countError } = await supabase
          .from('module3_team_members')
          .select('*', { count: 'exact', head: true })
          .eq('business_line_id', line.id);

        // Count configured teams
        const { count: teamsCount, error: teamsError } = await supabase
          .from('module3_teams')
          .select('*', { count: 'exact', head: true })
          .eq('business_line_id', line.id)
          .eq('is_configured', true);

        return {
          ...line,
          registeredCount: countError ? 0 : (employeeCount || 0),
          configuredTeamsCount: teamsError ? 0 : (teamsCount || 0)
        };
      })
    );
    setBusinessLinesWithStats(linesWithStats);
  }, []);

  // Refresh stats when returning from TeamMembersList or when page becomes visible
  useEffect(() => {
    if (businessLines.length > 0) {
      // Refresh stats whenever businessLines are loaded
      refreshStats(businessLines);

      // Pre-select the business line if coming back from team members
      if (location.state?.preSelectedBusinessLine) {
        setSelectedBusinessLine(location.state.preSelectedBusinessLine);
      }
    }
  }, [location.state, location.key, businessLines, refreshStats]);

  // Also refresh when window regains focus (user comes back from another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (businessLines.length > 0) {
        refreshStats(businessLines);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [businessLines, refreshStats]);

  useEffect(() => {
    const init = async () => {
      if (isCompanyLoading) return;

      if (!companyId) {
        setError("Aucune entreprise associée à votre profil.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch Business Lines
        let { data: lines, error: linesError } = await getBusinessLinesByCompanyId(companyId);

        // AUTO-REPAIR: If table is empty, try to sync from Module 1 JSON
        if (!linesError && (!lines || lines.length === 0)) {
          try {
            const cfoData = await SupabaseService.loadCFOData();
            if (cfoData.success && cfoData.data?.businessLines?.length > 0) {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("User not found for auto-repair");

              const linesToInsert = cfoData.data.businessLines.map((line: any, index: number) => ({
                company_id: companyId,
                user_id: user.id,
                activity_name: line.activityName,
                staff_count: line.staffCount,
                team_count: line.teamCount,
                budget: line.budget,
                display_order: index + 1,
                source: 'module1_autorepair',
                is_active: true
              }));

              const { error: insertError } = await supabase
                .from('business_lines')
                .insert(linesToInsert);

              if (!insertError) {
                // Refetch
                const { data: refreshedLines } = await getBusinessLinesByCompanyId(companyId);
                lines = refreshedLines;
              }
            }
          } catch (repairError) {
            console.error('Auto-Repair Error:', repairError);
          }
        }

        if (linesError) {
          console.error('Error fetching business lines:', linesError);
          setError("Erreur lors du chargement des lignes d'activité.");
        } else {
          setBusinessLines(lines || []);

          // Fetch employee counts AND configured teams count for each business line
          if (lines && lines.length > 0) {
            const linesWithStats = await Promise.all(
              lines.map(async (line) => {
                // Count employees
                const { count: employeeCount, error: countError } = await supabase
                  .from('module3_team_members')
                  .select('*', { count: 'exact', head: true })
                  .eq('business_line_id', line.id);

                // Count configured teams
                const { count: teamsCount, error: teamsError } = await supabase
                  .from('module3_teams')
                  .select('*', { count: 'exact', head: true })
                  .eq('business_line_id', line.id)
                  .eq('is_configured', true);

                return {
                  ...line,
                  registeredCount: countError ? 0 : (employeeCount || 0),
                  configuredTeamsCount: teamsError ? 0 : (teamsCount || 0)
                };
              })
            );
            setBusinessLinesWithStats(linesWithStats);
          }
        }

      } catch (err) {
        console.error('Initialization error:', err);
        setError("Une erreur inattendue est survenue.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [companyId, isCompanyLoading]);

  // Fetch existing teams when business line changes
  useEffect(() => {
    const fetchTeams = async () => {
      if (!selectedBusinessLine) {
        setExistingTeams([]);
        return;
      }

      const { data, error } = await supabase
        .from('module3_teams')
        .select('*')
        .eq('business_line_id', selectedBusinessLine)
        .order('team_number', { ascending: true });

      if (!error && data) {
        setExistingTeams(data as Team[]);
      }
    };

    fetchTeams();
    // Reset team selection when business line changes
    setSelectedTeamNumber(null);
    setTeamName('');
    setTeamMission('');
  }, [selectedBusinessLine]);

  // Load existing team data when team number is selected
  useEffect(() => {
    if (existingTeam) {
      setTeamName(existingTeam.team_name);
      setTeamMission(existingTeam.team_mission || '');
    } else {
      // Default name for new team
      if (selectedTeamNumber && selectedLineInfo) {
        setTeamName(`Équipe ${selectedTeamNumber} - ${selectedLineInfo.activity_name}`);
      }
      setTeamMission('');
    }
  }, [selectedTeamNumber, existingTeam, selectedLineInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessLine || !selectedTeamNumber || !teamName) return;

    try {
      setSaving(true);

      if (existingTeam) {
        // UPDATE existing team
        const { error: updateError } = await supabase
          .from('module3_teams')
          .update({
            team_name: teamName,
            team_mission: teamMission,
          })
          .eq('id', existingTeam.id);

        if (updateError) throw new Error(`Failed to update team: ${updateError.message}`);
        toast.success(`Équipe "${teamName}" mise à jour`);
      } else {
        // INSERT new team
        const { error: insertError } = await supabase
          .from('module3_teams')
          .insert({
            business_line_id: selectedBusinessLine,
            team_number: selectedTeamNumber,
            team_name: teamName,
            team_mission: teamMission,
            is_configured: false, // Will be marked true after employees are added
          });

        if (insertError) throw new Error(`Failed to create team: ${insertError.message}`);
        toast.success(`Équipe "${teamName}" créée`);
      }

      // Navigate to team members page with team context
      navigate('/modules/module3/team-members', {
        state: {
          businessLineId: selectedBusinessLine,
          teamNumber: selectedTeamNumber,
          teamName: teamName,
          teamMission: teamMission,
        }
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  if (isCompanyLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background/50 backdrop-blur-sm">
        <HCMLoader text="Chargement de la configuration..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 md:p-8">

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-2xl shadow-2xl border-primary/10 bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-8 border-b border-border/50">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              HCM COST SAVINGS
            </CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground">
              Configuration des équipes par ligne d'activité
            </CardDescription>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Secured access to 100% in ASP mode
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Business Lines Recap Section */}
          {businessLinesWithStats.length > 0 && (
            <div className="mb-8 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-cyan-500" />
                <h3 className="font-semibold text-base">
                  Vos lignes d'activités et équipes
                </h3>
              </div>
              <div className="space-y-3">
                {businessLinesWithStats.map((line) => (
                  <div
                    key={line.id}
                    className={`p-3 rounded-md border transition-colors ${
                      selectedBusinessLine === line.id
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-background/50 border-border/30 hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="font-medium">{line.activity_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className={`text-sm font-medium ${
                          line.registeredCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-500'
                        }`}>
                          {line.registeredCount} / {line.staff_count} employés
                        </span>
                        {line.registeredCount > 0 && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    {/* Teams Progress */}
                    <div className="flex items-center gap-2 mt-2 pl-6">
                      <UsersRound className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-muted-foreground">
                        Équipes configurées :{' '}
                        <span className={`font-semibold ${
                          line.configuredTeamsCount >= (line.team_count || 1)
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {line.configuredTeamsCount} / {line.team_count || 1}
                        </span>
                      </span>
                      {line.configuredTeamsCount >= (line.team_count || 1) && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                          Complet
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Step 1: Business Line Select */}
            <div className="space-y-3">
              <Label htmlFor="businessLine" className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                1. Ligne d'activité
              </Label>
              <Select
                value={selectedBusinessLine}
                onValueChange={setSelectedBusinessLine}
              >
                <SelectTrigger className="h-12 text-base bg-background/50 border-input/50 focus:ring-primary/20 transition-all hover:border-primary/50">
                  <SelectValue placeholder="Sélectionnez votre ligne d'activité" />
                </SelectTrigger>
                <SelectContent>
                  {businessLines.map((line) => (
                    <SelectItem key={line.id} value={line.id} className="cursor-pointer">
                      <span className="font-medium">{line.activity_name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({line.team_count || 1} équipe{(line.team_count || 1) > 1 ? 's' : ''})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Team Number Select (only if business line selected) */}
            {selectedBusinessLine && (
              <div className="space-y-3">
                <Label htmlFor="teamNumber" className="text-base font-semibold flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-500" />
                  2. Sélectionnez l'équipe à configurer
                </Label>
                <Select
                  value={selectedTeamNumber?.toString() || ''}
                  onValueChange={(v) => setSelectedTeamNumber(parseInt(v, 10))}
                >
                  <SelectTrigger className="h-12 text-base bg-background/50 border-input/50 focus:ring-primary/20 transition-all hover:border-primary/50">
                    <SelectValue placeholder="Choisissez le numéro d'équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamOptions.map((num) => {
                      const team = existingTeams.find(t => t.team_number === num);
                      const isConfigured = team?.is_configured;
                      return (
                        <SelectItem key={num} value={num.toString()} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Équipe {num}</span>
                            {team && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  isConfigured
                                    ? 'bg-green-500/10 text-green-600 border-green-500/30'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                }`}
                              >
                                {isConfigured ? 'Configurée' : 'En cours'}
                              </Badge>
                            )}
                            {!team && (
                              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                                Nouvelle
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground ml-1">
                  Cette ligne d'activité contient {totalTeamsForLine} équipe{totalTeamsForLine > 1 ? 's' : ''} (défini dans Module 1)
                </p>
              </div>
            )}

            {/* Step 3: Team Name (only if team number selected) */}
            {selectedTeamNumber && (
              <div className="space-y-3">
                <Label htmlFor="teamName" className="text-base font-semibold flex items-center gap-2">
                  <Edit3 className={`w-4 h-4 ${isFieldsLocked ? 'text-slate-400' : 'text-purple-500'}`} />
                  3. Nom de l'équipe
                  {isFieldsLocked && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
                </Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={`h-12 text-base transition-all ${
                    isFieldsLocked
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 cursor-not-allowed opacity-60'
                      : 'bg-background/50 border-input/50 focus:ring-primary/20 hover:border-primary/50'
                  }`}
                  placeholder="Ex: Équipe Production Matin, Service Client A..."
                  disabled={isFieldsLocked}
                />
                {existingTeam && (
                  <p className="text-xs text-amber-500 ml-1">
                    Cette équipe existe déjà. Vous pouvez modifier son nom.
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Team Mission (optional) */}
            {selectedTeamNumber && (
              <div className="space-y-3">
                <Label htmlFor="teamMission" className="text-base font-semibold flex items-center gap-2">
                  <Target className={`w-4 h-4 ${isFieldsLocked ? 'text-slate-400' : 'text-cyan-500'}`} />
                  4. Mission de l'équipe (optionnel)
                  {isFieldsLocked && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
                </Label>
                <Input
                  id="teamMission"
                  value={teamMission}
                  onChange={(e) => setTeamMission(e.target.value)}
                  className={`h-12 text-base transition-all ${
                    isFieldsLocked
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 cursor-not-allowed opacity-60'
                      : 'bg-background/50 border-input/50 focus:ring-primary/20 hover:border-primary/50'
                  }`}
                  placeholder="Ex: Gestion de la production, Support client..."
                  disabled={isFieldsLocked}
                />
                {isFieldsLocked && (
                  <p className="text-xs text-orange-500 ml-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Équipe configurée - Modification réservée au profil CEO
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                disabled={!selectedBusinessLine || !selectedTeamNumber || !teamName || saving}
              >
                {saving ? 'Sauvegarde...' : 'Suivant - Ajouter les employés'}
                {!saving && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
