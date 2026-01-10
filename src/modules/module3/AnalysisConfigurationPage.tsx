/**
 * ============================================
 * HCM COST SAVINGS - ANALYSIS CONFIGURATION PAGE
 * ============================================
 *
 * Page intermédiaire avant le calcul des performances
 * Affiche les données des équipes provenant du module PROFIL ENTREPRISE
 *
 * Données transférées depuis: Vue d'Ensemble des Équipes (DataMapping)
 * - Business Lines avec leurs membres
 * - Catégories professionnelles + Tech Level
 * - Taux d'incapacité
 * - Polyvalence F1, F2, F3
 * - Team Leader & Mission
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Users,
  UserCircle,
  Target,
  Bot,
  Cpu,
  Zap,
  User,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  UsersRound,
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Database,
  Workflow,
  Gauge,
  RefreshCw,
  Home
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface TeamMember {
  id: string;
  name: string;
  professional_category: string;
  tech_level: string;
  handicap_shape: string;
  incapacity_rate: number;
  versatility_f1: string;
  versatility_f2: string;
  versatility_f3: string;
  created_at: string;
}

interface BusinessLine {
  id: string;
  name: string;
  description: string;
  team_count: number;
  team_leader: string | null;
  team_mission: string | null;
  members: TeamMember[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getTechIcon = (techLevel: string) => {
  switch (techLevel) {
    case 'IA': return <Bot className="w-4 h-4" />;
    case 'Cobot': return <Cpu className="w-4 h-4" />;
    case 'Autonomous': return <Zap className="w-4 h-4" />;
    default: return <User className="w-4 h-4" />;
  }
};

const getTechColor = (techLevel: string) => {
  switch (techLevel) {
    case 'IA': return 'from-purple-500 to-pink-500';
    case 'Cobot': return 'from-blue-500 to-cyan-500';
    case 'Autonomous': return 'from-orange-500 to-red-500';
    default: return 'from-gray-400 to-gray-500';
  }
};

const getTechBadgeColor = (techLevel: string) => {
  switch (techLevel) {
    case 'IA': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
    case 'Cobot': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    case 'Autonomous': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  }
};

const getFullCategoryLabel = (category: string, techLevel: string) => {
  const baseCategory = category === 'Executives' ? 'Executive'
    : category === 'Supervisors' ? 'Supervisor'
    : category;

  switch (techLevel) {
    case 'IA': return `${baseCategory} + IA`;
    case 'Cobot': return `${baseCategory} + Cobot`;
    case 'Autonomous': return `Autonomous AI ${baseCategory} Agent`;
    default: return baseCategory;
  }
};

/**
 * Calcule le coefficient de versatilité selon la formule Excel source:
 * =SI(F143=0;0;SI(F143="Ne fait pas / ne connaît pas";0;SI(F143="Débutant";7;SI(F143="Confirmé";14;SI(F143="Expérimenté";21)))))
 *
 * Valeurs possibles: 0, 7, 14, 21
 */
const getVersatilityCoefficient = (level: string): number => {
  if (!level || level === "Does not make / does not know" || level === "Ne fait pas / ne connaît pas (n'exerce pas cette activité)") return 0;
  if (level === "Apprentice (learning)" || level === "Débutant (non autonome : en apprentissage)") return 7;
  if (level === "Confirmed (autonomous)" || level === "Confirmé (autonome : fait seul en qualité et en quantité)") return 14;
  if (level === "Experimented (trainer)" || level === "Expérimenté (sait montrer à une autre personne : formateur)") return 21;
  return 0;
};

// Ancienne fonction conservée pour compatibilité (affichage des points visuels)
const getVersatilityScore = (level: string): number => {
  if (!level || level === "Does not make / does not know" || level === "Ne fait pas / ne connaît pas (n'exerce pas cette activité)") return 0;
  if (level === "Apprentice (learning)" || level === "Débutant (non autonome : en apprentissage)") return 1;
  if (level === "Confirmed (autonomous)" || level === "Confirmé (autonome : fait seul en qualité et en quantité)") return 2;
  if (level === "Experimented (trainer)" || level === "Expérimenté (sait montrer à une autre personne : formateur)") return 3;
  return 0;
};

const getVersatilityLabel = (level: string) => {
  if (!level || level === "Does not make / does not know") return "Ne fait pas";
  if (level === "Apprentice (learning)") return "Apprenti";
  if (level === "Confirmed (autonomous)") return "Confirmé";
  if (level === "Experimented (trainer)") return "Expert";
  return level;
};

const getVersatilityColor = (score: number) => {
  if (score === 0) return 'bg-gray-300 dark:bg-gray-700';
  if (score === 1) return 'bg-yellow-500';
  if (score === 2) return 'bg-blue-500';
  return 'bg-green-500';
};

// ============================================
// STATISTICS COMPONENT
// ============================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  gradient: string;
  delay?: number;
}

function StatCard({ icon, label, value, subValue, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
        "bg-gradient-to-br",
        gradient
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 mb-1">{label}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
              {subValue && (
                <p className="text-xs text-white/60 mt-1">{subValue}</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// EXPANDABLE BUSINESS LINE CARD
// ============================================

interface BusinessLineCardProps {
  businessLine: BusinessLine;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function BusinessLineCard({ businessLine, index, isExpanded, onToggle }: BusinessLineCardProps) {
  // Calculate statistics
  const avgIncapacity = businessLine.members.length > 0
    ? businessLine.members.reduce((sum, m) => sum + (m.incapacity_rate || 0), 0) / businessLine.members.length
    : 0;

  // Coefficient de compétence moyen = moyenne de (F1+F2+F3)/63 pour chaque salarié
  const avgVersatility = businessLine.members.length > 0
    ? businessLine.members.reduce((sum, m) => {
        const coef1 = getVersatilityCoefficient(m.versatility_f1);
        const coef2 = getVersatilityCoefficient(m.versatility_f2);
        const coef3 = getVersatilityCoefficient(m.versatility_f3);
        return sum + ((coef1 + coef2 + coef3) / 63) * 100;
      }, 0) / businessLine.members.length
    : 0;

  const techDistribution = businessLine.members.reduce((acc, m) => {
    const tech = m.tech_level || 'Standard';
    acc[tech] = (acc[tech] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn(
        "overflow-hidden border-2 transition-all duration-500",
        isExpanded
          ? "border-cyan-500/50 shadow-2xl shadow-cyan-500/20"
          : "border-border hover:border-cyan-500/30 hover:shadow-lg"
      )}>
        {/* Header - Always visible */}
        <CardHeader
          className={cn(
            "cursor-pointer transition-all duration-300",
            "bg-gradient-to-r from-slate-900/5 via-cyan-500/10 to-blue-500/5",
            "dark:from-slate-900/50 dark:via-cyan-500/20 dark:to-blue-500/10",
            "border-b-2",
            isExpanded ? "border-cyan-500/50" : "border-transparent"
          )}
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            {/* Left: Business Line Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {businessLine.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {businessLine.members.length} employés
                  </span>
                  <span className="flex items-center gap-1">
                    <UsersRound className="w-3 h-3" />
                    {businessLine.team_count || 1} équipe(s)
                  </span>
                </CardDescription>
              </div>
            </div>

            {/* Right: Quick Stats + Expand Button */}
            <div className="flex items-center gap-4">
              {/* Quick Stats Badges */}
              <div className="hidden md:flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                  <Gauge className="w-3 h-3 mr-1" />
                  {avgIncapacity.toFixed(1)}% inc.
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  <Layers className="w-3 h-3 mr-1" />
                  {avgVersatility.toFixed(1)}% coef.
                </Badge>
              </div>

              {/* Expand Button */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full transition-all duration-300",
                  isExpanded
                    ? "bg-cyan-500/20 text-cyan-600"
                    : "hover:bg-cyan-500/10"
                )}
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <CardContent className="p-6 space-y-6">
                {/* Team Leader & Mission */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Team Leader */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <UserCircle className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-500 dark:text-purple-400">Team Leader</p>
                        <p className="font-semibold text-foreground">
                          {businessLine.team_leader || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mission */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Target className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-500 dark:text-blue-400">Mission</p>
                        <p className="font-semibold text-foreground">
                          {businessLine.team_mission || 'Non renseignée'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tech Distribution */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    Distribution Technologique
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(techDistribution).map(([tech, count]) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5",
                          getTechBadgeColor(tech)
                        )}
                      >
                        <div className={cn(
                          "p-1 rounded",
                          `bg-gradient-to-br ${getTechColor(tech)}`
                        )}>
                          {getTechIcon(tech)}
                        </div>
                        <span>{tech}: {count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Members Table */}
                <div className="rounded-xl border-2 border-cyan-500/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-3 border-b border-cyan-500/20">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-500" />
                      Liste des Employés ({businessLine.members.length})
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">#</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Nom</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Catégorie</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Handicap</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Taux Inc.</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">F1</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">F2</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">F3</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Coefficient de compétence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {businessLine.members.map((member, idx) => {
                          // Coefficients selon formule Excel (0, 7, 14, 21)
                          const coefF1 = getVersatilityCoefficient(member.versatility_f1);
                          const coefF2 = getVersatilityCoefficient(member.versatility_f2);
                          const coefF3 = getVersatilityCoefficient(member.versatility_f3);
                          // Coefficient de compétence = (F1 + F2 + F3) / 63
                          const coefficientCompetence = (coefF1 + coefF2 + coefF3) / 63;
                          // Score visuel (0-3) pour les points
                          const v1 = getVersatilityScore(member.versatility_f1);
                          const v2 = getVersatilityScore(member.versatility_f2);
                          const v3 = getVersatilityScore(member.versatility_f3);

                          return (
                            <motion.tr
                              key={member.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={cn(
                                "border-b border-border/50 transition-colors",
                                "hover:bg-cyan-500/5",
                                idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                              )}
                            >
                              <td className="py-3 px-4 font-mono text-sm text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "p-1.5 rounded-lg",
                                    `bg-gradient-to-br ${getTechColor(member.tech_level)}`
                                  )}>
                                    {getTechIcon(member.tech_level)}
                                  </div>
                                  <span className="font-medium text-foreground">
                                    {member.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="text-xs">
                                  {getFullCategoryLabel(member.professional_category, member.tech_level)}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {member.handicap_shape || '-'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-mono",
                                    member.incapacity_rate > 50
                                      ? "bg-red-500/10 text-red-600 border-red-500/30"
                                      : member.incapacity_rate > 20
                                        ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
                                        : "bg-green-500/10 text-green-600 border-green-500/30"
                                  )}
                                >
                                  {member.incapacity_rate}%
                                </Badge>
                              </td>
                              {/* F1 - Coefficient (0, 7, 14, 21) */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={cn(
                                    "text-sm font-bold px-2 py-0.5 rounded",
                                    coefF1 === 0 ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400" :
                                    coefF1 === 7 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                                    coefF1 === 14 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  )}>
                                    {coefF1}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {getVersatilityLabel(member.versatility_f1)}
                                  </span>
                                </div>
                              </td>
                              {/* F2 - Coefficient (0, 7, 14, 21) */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={cn(
                                    "text-sm font-bold px-2 py-0.5 rounded",
                                    coefF2 === 0 ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400" :
                                    coefF2 === 7 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                                    coefF2 === 14 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  )}>
                                    {coefF2}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {getVersatilityLabel(member.versatility_f2)}
                                  </span>
                                </div>
                              </td>
                              {/* F3 - Coefficient (0, 7, 14, 21) */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={cn(
                                    "text-sm font-bold px-2 py-0.5 rounded",
                                    coefF3 === 0 ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400" :
                                    coefF3 === 7 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                                    coefF3 === 14 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  )}>
                                    {coefF3}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {getVersatilityLabel(member.versatility_f3)}
                                  </span>
                                </div>
                              </td>
                              {/* Coefficient de compétence = (F1+F2+F3)/63 */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Progress
                                    value={coefficientCompetence * 100}
                                    className="w-16 h-2 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500"
                                  />
                                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                                    {(coefficientCompetence * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AnalysisConfigurationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId, isLoading: isCompanyLoading } = useCompany();

  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Guard: wait for companyId to be available
    if (!user || isCompanyLoading || !companyId) {
      return;
    }

    let isMounted = true;

    const fetchBusinessLinesWithMembers = async () => {
      try {
        setLoading(true);

        // Fetch all business lines for this company
        const { data: businessLinesData, error: blError } = await supabase
          .from('business_lines')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true });

        if (!isMounted) return;
        if (blError) throw blError;

        if (!businessLinesData || businessLinesData.length === 0) {
          setBusinessLines([]);
          setLoading(false);
          return;
        }

        // Fetch team members and team info for each business line
        const businessLinesWithMembers: BusinessLine[] = await Promise.all(
          businessLinesData.map(async (bl) => {
            if (!isMounted) return null;

            // Fetch team members
            const { data: membersData, error: membersError } = await supabase
              .from('module3_team_members')
              .select('*')
              .eq('business_line_id', bl.id)
              .order('created_at', { ascending: true });

            if (membersError) {
              console.error(`Error fetching members for business line ${bl.id}:`, membersError);
            }

            const allMembers = membersData || [];

            // Fetch team info from module3_teams to get team_leader and team_mission
            const { data: teamsData, error: teamsError } = await supabase
              .from('module3_teams')
              .select('*')
              .eq('business_line_id', bl.id)
              .order('team_number', { ascending: true });

            if (teamsError) {
              console.error(`Error fetching teams for business line ${bl.id}:`, teamsError);
            }

            // Get team leader name from first configured team (or first team with a leader)
            let teamLeaderName: string | null = null;
            let teamMission: string | null = null;

            if (teamsData && teamsData.length > 0) {
              // Find the first team with a leader
              const teamWithLeader = teamsData.find((t: any) => t.team_leader_id);
              if (teamWithLeader && teamWithLeader.team_leader_id) {
                // Find the leader's name from members
                const leader = allMembers.find((m: any) => m.id === teamWithLeader.team_leader_id);
                if (leader) {
                  teamLeaderName = leader.name;
                }
              }
              // Get mission from first team
              const teamWithMission = teamsData.find((t: any) => t.team_mission);
              if (teamWithMission) {
                teamMission = teamWithMission.team_mission;
              }
            }

            return {
              id: bl.id,
              name: bl.activity_name || bl.name || 'Ligne d\'activité',
              description: bl.description || '',
              team_count: bl.team_count || 0,
              team_leader: teamLeaderName,
              team_mission: teamMission,
              members: allMembers
            };
          })
        );

        if (!isMounted) return;

        // Filter out null values (from unmounted checks)
        const validBusinessLines = businessLinesWithMembers.filter((bl): bl is BusinessLine => bl !== null);
        setBusinessLines(validBusinessLines);

        // Auto-expand first business line if only one
        if (validBusinessLines.length === 1) {
          setExpandedLines(new Set([validBusinessLines[0].id]));
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching business lines:', err);
        toast.error("Erreur lors du chargement des données");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBusinessLinesWithMembers();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [user, isCompanyLoading, companyId]);

  const toggleBusinessLine = (id: string) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLines(new Set(businessLines.map(bl => bl.id)));
  };

  const collapseAll = () => {
    setExpandedLines(new Set());
  };

  const handleContinue = () => {
    if (businessLines.length === 0 || businessLines.every(bl => bl.members.length === 0)) {
      toast.error("Aucune donnée d'équipe disponible pour le calcul");
      return;
    }
    navigate('/modules/module3/data-alignment');
  };

  // Calculate global statistics
  const totalEmployees = businessLines.reduce((sum, bl) => sum + bl.members.length, 0);
  const totalBusinessLines = businessLines.length;

  const globalAvgIncapacity = totalEmployees > 0
    ? businessLines.reduce((sum, bl) =>
        sum + bl.members.reduce((s, m) => s + (m.incapacity_rate || 0), 0), 0
      ) / totalEmployees
    : 0;

  // Coefficient de compétence global = moyenne de (F1+F2+F3)/63 pour tous les salariés
  const globalAvgVersatility = totalEmployees > 0
    ? businessLines.reduce((sum, bl) =>
        sum + bl.members.reduce((s, m) => {
          const coef1 = getVersatilityCoefficient(m.versatility_f1);
          const coef2 = getVersatilityCoefficient(m.versatility_f2);
          const coef3 = getVersatilityCoefficient(m.versatility_f3);
          return s + ((coef1 + coef2 + coef3) / 63) * 100;
        }, 0), 0
      ) / totalEmployees
    : 0;

  if (loading || isCompanyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <HCMLoader text="Chargement des données des équipes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
            <Database className="w-4 h-4 text-cyan-500 animate-pulse" />
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
              HCM COST SAVINGS - Configuration de l'Analyse
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Vue d'Ensemble des Équipes
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Données transférées depuis le module PROFIL ENTREPRISE / LELE HCM Data Mapping
          </p>

          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Données synchronisées
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Prêt pour l'analyse
            </Badge>
          </div>

          {/* Bouton Retour Menu Principal */}
          <Button
            onClick={() => navigate('/modules/module3')}
            variant="outline"
            className="mt-4 gap-2 border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            <Home className="w-4 h-4" />
            Retour menu principal
          </Button>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Building2 className="w-6 h-6 text-white" />}
            label="Lignes d'Activité"
            value={totalBusinessLines}
            subValue="Départements actifs"
            gradient="from-cyan-600 to-blue-700"
            delay={0.1}
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-white" />}
            label="Total Employés"
            value={totalEmployees}
            subValue="Dans toutes les équipes"
            gradient="from-purple-600 to-pink-700"
            delay={0.2}
          />
          <StatCard
            icon={<Gauge className="w-6 h-6 text-white" />}
            label="Taux Inc. Moyen"
            value={`${globalAvgIncapacity.toFixed(1)}%`}
            subValue="Moyenne globale"
            gradient="from-orange-600 to-red-700"
            delay={0.3}
          />
          <StatCard
            icon={<Layers className="w-6 h-6 text-white" />}
            label="Coef. Compétence Moy."
            value={`${globalAvgVersatility.toFixed(1)}%`}
            subValue="(F1+F2+F3)/63"
            gradient="from-green-600 to-emerald-700"
            delay={0.4}
          />
        </div>

        {/* Data Flow Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-slate-900/5 via-cyan-500/5 to-blue-500/5 dark:from-slate-900/30 dark:via-cyan-500/10 dark:to-blue-500/10 border-2 border-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <Database className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="font-semibold text-foreground">Profil Entreprise</p>
                    <p className="text-xs text-muted-foreground">Data Mapping</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-cyan-500" />
                  <div className="w-20 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-green-500 rounded-full" />
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="font-semibold text-foreground">HCM Cost Savings</p>
                    <p className="text-xs text-muted-foreground">Calcul Performance</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs"
            >
              Tout déplier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs"
            >
              Tout replier
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Actualiser
          </Button>
        </motion.div>

        {/* Business Lines */}
        {businessLines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune ligne d'activité</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Aucune donnée d'équipe n'a été trouvée. Veuillez d'abord configurer vos lignes d'activité
                  et ajouter des employés dans le module HCM Cost Savings.
                </p>
                <Button
                  onClick={() => navigate('/modules/module3/team-identification')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Configurer les équipes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {businessLines.map((businessLine, index) => (
              <BusinessLineCard
                key={businessLine.id}
                businessLine={businessLine}
                index={index}
                isExpanded={expandedLines.has(businessLine.id)}
                onToggle={() => toggleBusinessLine(businessLine.id)}
              />
            ))}
          </div>
        )}

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/modules/module3')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au menu
          </Button>

          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground hidden md:block">
              {totalEmployees} employés prêts pour l'analyse
            </p>
            <Button
              onClick={handleContinue}
              disabled={totalEmployees === 0}
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25"
            >
              Alignement des données
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
