import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, Bot, Cpu, Zap, ChevronLeft,
    Building2, HeartPulse, Layers, User, Sparkles, ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';

// OPTIMISATION 10K: Constante de pagination
const PAGE_SIZE_MEMBERS = 500;

// Types
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
    team_number: number;
    created_at: string;
}

interface Team {
    id: string;
    business_line_id: string;
    team_number: number;
    team_name: string;
    team_mission: string | null;
    team_leader_id: string | null;
    team_leader_name: string | null;
    is_configured: boolean;
    members: TeamMember[];
}

interface BusinessLine {
    id: string;
    name: string;
    description: string;
    teams: Team[];
    members: TeamMember[]; // All members (for backwards compatibility)
}

// Helper functions
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

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Executives': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        case 'Supervisors': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'Clerk': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case 'Worker': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
};

const getVersatilityStars = (level: string) => {
    if (!level || level === "Does not make / does not know") return 0;
    if (level === "Apprentice (learning)") return 1;
    if (level === "Confirmed (autonomous)") return 2;
    if (level === "Experimented (trainer)") return 3;
    return 0;
};

const getVersatilityLabel = (level: string) => {
    if (!level || level === "Does not make / does not know") return "Ne fait pas / ne sait pas";
    if (level === "Apprentice (learning)") return "Apprenti";
    if (level === "Confirmed (autonomous)") return "Confirmé";
    if (level === "Experimented (trainer)") return "Expérimenté";
    return level;
};

export default function TeamRecapGlobal() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { companyId, isLoading: isCompanyLoading } = useCompany();
    const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // Use minimum loading time (800ms) to ensure HCM logo is visible
    const loading = useMinimumLoading(dataLoading || isCompanyLoading, 800);

    useEffect(() => {
        // Guard: wait for companyId to be available
        if (!user || isCompanyLoading || !companyId) {
            return;
        }

        let isMounted = true;

        const fetchBusinessLinesWithMembers = async () => {
            try {
                setDataLoading(true);

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
                    setDataLoading(false);
                    return;
                }

                // Fetch teams and members for each business line
                const businessLinesWithMembers: BusinessLine[] = await Promise.all(
                    businessLinesData.map(async (bl) => {
                        if (!isMounted) return null;

                        // OPTIMISATION 10K: Fetch all members avec pagination
                        let allMembers: any[] = [];
                        let page = 0;
                        let hasMore = true;
                        while (hasMore) {
                            const from = page * PAGE_SIZE_MEMBERS;
                            const to = from + PAGE_SIZE_MEMBERS - 1;
                            const { data: membersData, error: membersError } = await supabase
                                .from('module3_team_members')
                                .select('*')
                                .eq('business_line_id', bl.id)
                                .order('created_at', { ascending: true })
                                .range(from, to);

                            if (membersError) {
                                console.error(`Error fetching members for business line ${bl.id}:`, membersError);
                                hasMore = false;
                            } else if (membersData && membersData.length > 0) {
                                allMembers = [...allMembers, ...membersData];
                                page++;
                                hasMore = membersData.length === PAGE_SIZE_MEMBERS;
                            } else {
                                hasMore = false;
                            }
                        }

                        // Fetch teams from module3_teams table
                        const { data: teamsData, error: teamsError } = await supabase
                            .from('module3_teams')
                            .select('*')
                            .eq('business_line_id', bl.id)
                            .order('team_number', { ascending: true });

                        if (teamsError) {
                            console.error(`Error fetching teams for business line ${bl.id}:`, teamsError);
                        }

                        // Build teams with their members and leader names
                        const teams: Team[] = (teamsData || []).map((team: any) => {
                            // Filter members by team_number
                            const teamMembers = allMembers.filter(
                                (m: any) => m.team_number === team.team_number
                            );

                            // Find team leader name if team_leader_id is set
                            let teamLeaderName: string | null = null;
                            if (team.team_leader_id) {
                                const leader = allMembers.find((m: any) => m.id === team.team_leader_id);
                                if (leader) {
                                    teamLeaderName = leader.name;
                                }
                            }

                            return {
                                id: team.id,
                                business_line_id: team.business_line_id,
                                team_number: team.team_number,
                                team_name: team.team_name,
                                team_mission: team.team_mission,
                                team_leader_id: team.team_leader_id,
                                team_leader_name: teamLeaderName,
                                is_configured: team.is_configured,
                                members: teamMembers
                            };
                        });

                        return {
                            id: bl.id,
                            name: bl.activity_name || bl.name,
                            description: bl.description || '',
                            teams: teams,
                            members: allMembers
                        };
                    })
                );

                if (!isMounted) return;

                // Filter out null values
                const validBusinessLines = businessLinesWithMembers.filter((bl): bl is BusinessLine => bl !== null);
                setBusinessLines(validBusinessLines);
            } catch (err: any) {
                if (!isMounted) return;
                console.error('Error fetching business lines:', err);
            } finally {
                if (isMounted) {
                    setDataLoading(false);
                }
            }
        };

        fetchBusinessLinesWithMembers();

        // Cleanup function to prevent state updates on unmounted component
        return () => {
            isMounted = false;
        };
    }, [user, isCompanyLoading, companyId]);

    const totalEmployees = businessLines.reduce((sum, bl) => sum + bl.members.length, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <HCMLoader text="Chargement du récapitulatif..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Animated Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-300/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/modules/module3')}
                        className="mb-4"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Retour au Module 3
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                <span className="text-sm font-medium text-primary">
                                    Récapitulatif Global
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                                Vue d'Ensemble des Équipes
                            </h1>
                            <p className="text-muted-foreground">
                                Visualisez tous vos employés organisés par ligne d'activité
                            </p>
                        </div>

                        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{totalEmployees}</p>
                                        <p className="text-xs text-muted-foreground">Employés Total</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Empty State */}
                {businessLines.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Aucune ligne d'activité</h3>
                            <p className="text-muted-foreground mb-6">
                                Commencez par créer une ligne d'activité dans le Module 3
                            </p>
                            <Button onClick={() => navigate('/modules/module3')}>
                                Créer une ligne d'activité
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {businessLines.map((businessLine, blIndex) => (
                            <motion.div
                                key={businessLine.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: blIndex * 0.1 }}
                            >
                                <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all shadow-lg">
                                    {/* Business Line Header */}
                                    <CardHeader className="bg-gradient-to-r from-cyan-500/20 via-primary/20 to-purple-500/20 border-b-2 border-cyan-500/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-cyan-500/30 backdrop-blur-sm">
                                                    <Building2 className="w-5 h-5 text-cyan-700 dark:text-cyan-300" />
                                                </div>
                                                <CardTitle className="text-xl font-bold text-foreground">
                                                    {businessLine.name}
                                                </CardTitle>
                                            </div>
                                            <Badge variant="secondary" className="text-base px-4 py-2">
                                                <Users className="w-4 h-4 mr-2" />
                                                {businessLine.members.length}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-6">
                                        {businessLine.teams.length === 0 && businessLine.members.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>Aucune équipe configurée dans cette ligne d'activité</p>
                                            </div>
                                        ) : businessLine.teams.length > 0 ? (
                                            /* Display teams with their info */
                                            <div className="space-y-8">
                                                {businessLine.teams.map((team, teamIndex) => (
                                                    <div key={team.id} className="border rounded-lg overflow-hidden">
                                                        {/* Team Header with Leader & Mission */}
                                                        <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 p-4 border-b">
                                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 rounded-lg bg-orange-500/20">
                                                                        <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-bold text-lg text-foreground">
                                                                            {team.team_name || `Équipe ${team.team_number}`}
                                                                        </h3>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {team.members.length} employé{team.members.length > 1 ? 's' : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col md:flex-row gap-4 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <User className="w-4 h-4 text-primary" />
                                                                        <span className="font-medium">Chef d'équipe:</span>
                                                                        <span className={team.team_leader_name ? "text-foreground" : "text-muted-foreground italic"}>
                                                                            {team.team_leader_name || "Non renseigné"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                                                        <span className="font-medium">Mission:</span>
                                                                        <span className={team.team_mission ? "text-foreground" : "text-muted-foreground italic"}>
                                                                            {team.team_mission || "Non renseignée"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Team Members Table */}
                                                        {team.members.length === 0 ? (
                                                            <div className="text-center py-6 text-muted-foreground">
                                                                <p>Aucun employé dans cette équipe</p>
                                                            </div>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="border-b-2 border-cyan-500/20">
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                                Nom
                                                                            </th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                                Categorie
                                                                            </th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                                The shape of handicap
                                                                            </th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                                Incapacity rate
                                                                            </th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                                Level of versatility F1
                                                                            </th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                                Level of versatility F2
                                                                            </th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                                Level of versatility F3
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {team.members.map((member, idx) => (
                                                                            <tr
                                                                                key={member.id}
                                                                                className={cn(
                                                                                    "border-b border-border/50 hover:bg-muted/30 transition-colors",
                                                                                    idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                                                                                )}
                                                                            >
                                                                                {/* Name */}
                                                                                <td className="py-4 px-4">
                                                                                    <div className="font-medium text-foreground">
                                                                                        {member.name}
                                                                                    </div>
                                                                                </td>

                                                                                {/* Category */}
                                                                                <td className="py-4 px-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-sm text-foreground">
                                                                                            {member.professional_category}
                                                                                        </span>
                                                                                        {member.tech_level !== 'Standard' && (
                                                                                            <div className={cn(
                                                                                                "p-1.5 rounded bg-gradient-to-br",
                                                                                                getTechColor(member.tech_level)
                                                                                            )}>
                                                                                                {getTechIcon(member.tech_level)}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </td>

                                                                                {/* Handicap */}
                                                                                <td className="py-4 px-4">
                                                                                    <span className="text-sm text-foreground">
                                                                                        {member.handicap_shape}
                                                                                    </span>
                                                                                </td>

                                                                                {/* Incapacity Rate */}
                                                                                <td className="py-4 px-4">
                                                                                    <Badge variant="outline" className="font-normal">
                                                                                        {member.incapacity_rate}%
                                                                                    </Badge>
                                                                                </td>

                                                                                {/* Versatility F1 */}
                                                                                <td className="py-4 px-4">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {getVersatilityLabel(member.versatility_f1)}
                                                                                        </span>
                                                                                        <div className="flex gap-1">
                                                                                            {[...Array(3)].map((_, i) => (
                                                                                                <div
                                                                                                    key={i}
                                                                                                    className={cn(
                                                                                                        "w-2 h-2 rounded-full",
                                                                                                        i < getVersatilityStars(member.versatility_f1)
                                                                                                            ? "bg-orange-500"
                                                                                                            : "bg-gray-300 dark:bg-gray-700"
                                                                                                    )}
                                                                                                />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>

                                                                                {/* Versatility F2 */}
                                                                                <td className="py-4 px-4">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {getVersatilityLabel(member.versatility_f2)}
                                                                                        </span>
                                                                                        <div className="flex gap-1">
                                                                                            {[...Array(3)].map((_, i) => (
                                                                                                <div
                                                                                                    key={i}
                                                                                                    className={cn(
                                                                                                        "w-2 h-2 rounded-full",
                                                                                                        i < getVersatilityStars(member.versatility_f2)
                                                                                                            ? "bg-orange-500"
                                                                                                            : "bg-gray-300 dark:bg-gray-700"
                                                                                                    )}
                                                                                                />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>

                                                                                {/* Versatility F3 */}
                                                                                <td className="py-4 px-4">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {getVersatilityLabel(member.versatility_f3)}
                                                                                        </span>
                                                                                        <div className="flex gap-1">
                                                                                            {[...Array(3)].map((_, i) => (
                                                                                                <div
                                                                                                    key={i}
                                                                                                    className={cn(
                                                                                                        "w-2 h-2 rounded-full",
                                                                                                        i < getVersatilityStars(member.versatility_f3)
                                                                                                            ? "bg-orange-500"
                                                                                                            : "bg-gray-300 dark:bg-gray-700"
                                                                                                    )}
                                                                                                />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Fallback: Display members without team grouping (legacy data) */
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b-2 border-cyan-500/20">
                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                Nom
                                                            </th>
                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                Categorie
                                                            </th>
                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                The shape of handicap
                                                            </th>
                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                Incapacity rate
                                                            </th>
                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                Level of versatility F1
                                                            </th>
                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                Level of versatility F2
                                                            </th>
                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-foreground">
                                                                Level of versatility F3
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {businessLine.members.map((member, idx) => (
                                                            <tr
                                                                key={member.id}
                                                                className={cn(
                                                                    "border-b border-border/50 hover:bg-muted/30 transition-colors",
                                                                    idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                                                                )}
                                                            >
                                                                {/* Name */}
                                                                <td className="py-4 px-4">
                                                                    <div className="font-medium text-foreground">
                                                                        {member.name}
                                                                    </div>
                                                                </td>

                                                                {/* Category */}
                                                                <td className="py-4 px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-foreground">
                                                                            {member.professional_category}
                                                                        </span>
                                                                        {member.tech_level !== 'Standard' && (
                                                                            <div className={cn(
                                                                                "p-1.5 rounded bg-gradient-to-br",
                                                                                getTechColor(member.tech_level)
                                                                            )}>
                                                                                {getTechIcon(member.tech_level)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Handicap */}
                                                                <td className="py-4 px-4">
                                                                    <span className="text-sm text-foreground">
                                                                        {member.handicap_shape}
                                                                    </span>
                                                                </td>

                                                                {/* Incapacity Rate */}
                                                                <td className="py-4 px-4">
                                                                    <Badge variant="outline" className="font-normal">
                                                                        {member.incapacity_rate}%
                                                                    </Badge>
                                                                </td>

                                                                {/* Versatility F1 */}
                                                                <td className="py-4 px-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {getVersatilityLabel(member.versatility_f1)}
                                                                        </span>
                                                                        <div className="flex gap-1">
                                                                            {[...Array(3)].map((_, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    className={cn(
                                                                                        "w-2 h-2 rounded-full",
                                                                                        i < getVersatilityStars(member.versatility_f1)
                                                                                            ? "bg-orange-500"
                                                                                            : "bg-gray-300 dark:bg-gray-700"
                                                                                    )}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Versatility F2 */}
                                                                <td className="py-4 px-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {getVersatilityLabel(member.versatility_f2)}
                                                                        </span>
                                                                        <div className="flex gap-1">
                                                                            {[...Array(3)].map((_, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    className={cn(
                                                                                        "w-2 h-2 rounded-full",
                                                                                        i < getVersatilityStars(member.versatility_f2)
                                                                                            ? "bg-orange-500"
                                                                                            : "bg-gray-300 dark:bg-gray-700"
                                                                                    )}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Versatility F3 */}
                                                                <td className="py-4 px-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {getVersatilityLabel(member.versatility_f3)}
                                                                        </span>
                                                                        <div className="flex gap-1">
                                                                            {[...Array(3)].map((_, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    className={cn(
                                                                                        "w-2 h-2 rounded-full",
                                                                                        i < getVersatilityStars(member.versatility_f3)
                                                                                            ? "bg-orange-500"
                                                                                            : "bg-gray-300 dark:bg-gray-700"
                                                                                    )}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
