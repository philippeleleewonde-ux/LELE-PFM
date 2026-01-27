import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, Bot, Cpu, Zap, Loader2,
    Building2, User, Sparkles, UserCircle, Target, UsersRound
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';

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
    team_number: number; // Clé pour assigner les employés aux équipes
    created_at: string;
}

interface Team {
    id: string;
    team_number: number;
    team_name: string;
    team_mission: string | null;
    team_leader_id: string | null;
    team_leader_name: string | null;
    members: TeamMember[];
}

interface BusinessLine {
    id: string;
    name: string;
    description: string;
    team_count: number;
    teams: Team[];
    unassignedMembers: TeamMember[];
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

// Helper function to get the full category label with tech level
const getFullCategoryLabel = (category: string, techLevel: string) => {
    // Normalize category name (remove 's' at the end if present for display)
    const baseCategory = category === 'Executives' ? 'Executive'
        : category === 'Supervisors' ? 'Supervisor'
        : category;

    switch (techLevel) {
        case 'IA':
            return `${baseCategory} + IA`;
        case 'Cobot':
            return `${baseCategory} + Cobot`;
        case 'Autonomous':
            return `Autonomous AI ${baseCategory} Agent`;
        default:
            return baseCategory;
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

export default function DataMapping() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchBusinessLinesWithMembers();
        }
    }, [user]);

    const fetchBusinessLinesWithMembers = async () => {
        try {
            setLoading(true);

            // Fetch all business lines for this user from the correct table (business_lines from Module 1)
            const { data: businessLinesData, error: blError} = await supabase
                .from('business_lines')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: true });

            if (blError) throw blError;

            if (!businessLinesData || businessLinesData.length === 0) {
                setBusinessLines([]);
                setLoading(false);
                return;
            }

            // Fetch team members and teams for each business line
            const businessLinesWithTeams: BusinessLine[] = await Promise.all(
                businessLinesData.map(async (bl) => {
                    // 1. Fetch all members for this business line
                    const { data: membersData, error: membersError } = await supabase
                        .from('module3_team_members')
                        .select('*')
                        .eq('business_line_id', bl.id)
                        .order('created_at', { ascending: true });

                    if (membersError) {
                        console.error(`Error fetching members for business line ${bl.id}:`, membersError);
                    }

                    const allMembers: TeamMember[] = membersData || [];

                    // 2. Fetch teams from module3_teams
                    const { data: teamsData, error: teamsError } = await supabase
                        .from('module3_teams')
                        .select('*')
                        .eq('business_line_id', bl.id)
                        .order('team_number', { ascending: true });

                    if (teamsError) {
                        console.error(`Error fetching teams for business line ${bl.id}:`, teamsError);
                    }

                    // 3. Afficher TOUTES les équipes avec leurs employés EXACTS
                    // - Filtrer les employés par team_number (colonne clé dans module3_team_members)
                    // - Chaque équipe affiche son Team Leader, Mission, et liste d'employés

                    let teams: Team[] = [];
                    let unassignedMembers: TeamMember[] = [];

                    if (teamsData && teamsData.length > 0) {
                        // Construire TOUTES les équipes avec leurs employés respectifs
                        teams = teamsData.map((teamData: any) => {
                            // Trouver le nom du Team Leader
                            let teamLeaderName: string | null = null;
                            if (teamData.team_leader_id) {
                                const leader = allMembers.find(m => m.id === teamData.team_leader_id);
                                if (leader) {
                                    teamLeaderName = leader.name;
                                }
                            }

                            // Filtrer les employés par team_number (la vraie assignation)
                            const teamMembers = allMembers.filter(m => m.team_number === teamData.team_number);

                            return {
                                id: teamData.id,
                                team_number: teamData.team_number,
                                team_name: teamData.team_name,
                                team_mission: teamData.team_mission || null,
                                team_leader_id: teamData.team_leader_id || null,
                                team_leader_name: teamLeaderName,
                                members: teamMembers
                            };
                        });

                        // Membres sans équipe assignée (team_number null ou non correspondant)
                        const assignedTeamNumbers = new Set(teamsData.map((t: any) => t.team_number));
                        unassignedMembers = allMembers.filter(m => !assignedTeamNumbers.has(m.team_number));
                    } else {
                        // Pas d'équipe configurée: tous les employés sont "non assignés"
                        teams = [];
                        unassignedMembers = allMembers;
                    }

                    return {
                        id: bl.id,
                        name: bl.activity_name || bl.name || 'Ligne d\'activité',
                        description: bl.description || '',
                        team_count: bl.team_count || teams.length || 1,
                        teams,
                        unassignedMembers
                    };
                })
            );

            setBusinessLines(businessLinesWithTeams);
        } catch (err: any) {
            console.error('Error fetching business lines:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total employees (all members from all teams + unassigned)
    const totalEmployees = businessLines.reduce((sum, bl) => {
        const teamsMembers = bl.teams.reduce((tSum, team) => tSum + team.members.length, 0);
        return sum + teamsMembers + bl.unassignedMembers.length;
    }, 0);

    if (loading) {
        return (
            <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0F1C]">
                <CEOSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <HCMLoader text="Chargement du récapitulatif..." />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0F1C]">
            {/* Sidebar */}
            <CEOSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Top Bar */}
                <div className="sticky top-0 z-50 backdrop-blur-xl border-b bg-white/80 border-slate-200 dark:bg-[#0A0F1C]/80 dark:border-white/10">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                            <SidebarToggle />
                            <h2 className="hidden sm:block text-lg font-bold text-slate-800 dark:text-slate-200">
                                LELE HCM Data Mapping
                            </h2>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-4 sm:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 backdrop-blur-sm">
                                    <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                                    <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                                        Récapitulatif Global
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-cyan-600 to-blue-600 dark:from-white dark:via-cyan-200 dark:to-blue-400">
                                    Vue d'Ensemble des Équipes
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Visualisez tous vos employés organisés par ligne d'activité
                                </p>
                            </div>

                            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 dark:from-cyan-500/20 dark:to-blue-600/20 border-cyan-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-lg bg-cyan-500/10">
                                            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalEmployees}</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Employés Total</p>
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
                                <Building2 className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Aucune ligne d'activité</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Commencez par créer une ligne d'activité dans le Module HCM Cost Savings
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {businessLines.map((businessLine, blIndex) => {
                                // Calculate total employees for this business line
                                const blTotalEmployees = businessLine.teams.reduce((sum, t) => sum + t.members.length, 0) + businessLine.unassignedMembers.length;

                                return (
                                <motion.div
                                    key={businessLine.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: blIndex * 0.1 }}
                                >
                                    <Card className="overflow-hidden border-2 hover:border-cyan-500/50 transition-all shadow-lg">
                                        {/* Business Line Header */}
                                        <CardHeader className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-b-2 border-cyan-500/30">
                                            <div className="space-y-4">
                                                {/* Line 1: Business Line Name + Employee Count */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-cyan-500/30 backdrop-blur-sm">
                                                            <Building2 className="w-5 h-5 text-cyan-700 dark:text-cyan-300" />
                                                        </div>
                                                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                                                            {businessLine.name}
                                                        </CardTitle>
                                                    </div>
                                                    <Badge variant="secondary" className="text-base px-4 py-2 text-black">
                                                        <Users className="w-4 h-4 mr-2" />
                                                        {blTotalEmployees} employés
                                                    </Badge>
                                                </div>

                                                {/* Line 2: Nombre d'Équipes */}
                                                <div className="flex items-center gap-2 pl-11">
                                                    <UsersRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                                        Nombre d'Équipes : {businessLine.teams.length > 0 ? businessLine.teams.length : businessLine.team_count || 1}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-6">
                                            {blTotalEmployees === 0 ? (
                                                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p>Aucun employé dans cette ligne d'activité</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Render each team */}
                                                    {businessLine.teams.map((team, teamIndex) => (
                                                        <div key={team.id} className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5 overflow-hidden">
                                                            {/* Team Header: Team Leader & Mission */}
                                                            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/20">
                                                                <div className="flex flex-wrap items-center gap-4">
                                                                    {/* Team Leader */}
                                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                                                                        <UserCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                                        <div>
                                                                            <span className="text-xs text-purple-500 dark:text-purple-400 block">Team Leader</span>
                                                                            <span className={cn(
                                                                                "text-sm font-semibold",
                                                                                team.team_leader_name
                                                                                    ? "text-purple-700 dark:text-purple-300"
                                                                                    : "text-purple-400 dark:text-purple-500 italic"
                                                                            )}>
                                                                                {team.team_leader_name || 'Non renseigné'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Mission */}
                                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 flex-1 min-w-[200px]">
                                                                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                                        <div>
                                                                            <span className="text-xs text-blue-500 dark:text-blue-400 block">Mission de l'équipe</span>
                                                                            <span className={cn(
                                                                                "text-sm font-semibold",
                                                                                team.team_mission
                                                                                    ? "text-blue-700 dark:text-blue-300"
                                                                                    : "text-blue-400 dark:text-blue-500 italic"
                                                                            )}>
                                                                                {team.team_mission || 'Non renseignée'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Employee Count Badge */}
                                                                    <Badge variant="secondary" className="ml-auto px-3 py-2 text-black">
                                                                        <Users className="w-4 h-4 mr-2" />
                                                                        {team.members.length} membres
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            {/* Employee Table */}
                                                            {team.members.length > 0 && (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full">
                                                                        <thead>
                                                                            <tr className="border-b-2 border-cyan-500/20">
                                                                                <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Nom</th>
                                                                                <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Categorie</th>
                                                                                <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">The shape of handicap</th>
                                                                                <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Incapacity rate</th>
                                                                                <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Level of versatility F1</th>
                                                                                <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Level of versatility F2</th>
                                                                                <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Level of versatility F3</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {team.members.map((member, idx) => (
                                                                                <tr
                                                                                    key={member.id}
                                                                                    className={cn(
                                                                                        "border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors",
                                                                                        idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-white/[0.02]"
                                                                                    )}
                                                                                >
                                                                                    <td className="py-4 px-4">
                                                                                        <div className="font-medium text-slate-900 dark:text-white">{member.name}</div>
                                                                                    </td>
                                                                                    <td className="py-4 px-4">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm text-slate-900 dark:text-white">
                                                                                                {getFullCategoryLabel(member.professional_category, member.tech_level)}
                                                                                            </span>
                                                                                            {member.tech_level !== 'Standard' && (
                                                                                                <div className={cn("p-1.5 rounded bg-gradient-to-br", getTechColor(member.tech_level))}>
                                                                                                    {getTechIcon(member.tech_level)}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-4 px-4">
                                                                                        <span className="text-sm text-slate-700 dark:text-slate-300">{member.handicap_shape}</span>
                                                                                    </td>
                                                                                    <td className="py-4 px-4">
                                                                                        <Badge variant="outline" className="font-normal">{member.incapacity_rate}%</Badge>
                                                                                    </td>
                                                                                    <td className="py-4 px-4">
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <span className="text-xs text-slate-600 dark:text-slate-400">{getVersatilityLabel(member.versatility_f1)}</span>
                                                                                            <div className="flex gap-1">
                                                                                                {[...Array(3)].map((_, i) => (
                                                                                                    <div key={i} className={cn("w-2 h-2 rounded-full", i < getVersatilityStars(member.versatility_f1) ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700")} />
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-4 px-4">
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <span className="text-xs text-slate-600 dark:text-slate-400">{getVersatilityLabel(member.versatility_f2)}</span>
                                                                                            <div className="flex gap-1">
                                                                                                {[...Array(3)].map((_, i) => (
                                                                                                    <div key={i} className={cn("w-2 h-2 rounded-full", i < getVersatilityStars(member.versatility_f2) ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700")} />
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-4 px-4">
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <span className="text-xs text-slate-600 dark:text-slate-400">{getVersatilityLabel(member.versatility_f3)}</span>
                                                                                            <div className="flex gap-1">
                                                                                                {[...Array(3)].map((_, i) => (
                                                                                                    <div key={i} className={cn("w-2 h-2 rounded-full", i < getVersatilityStars(member.versatility_f3) ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700")} />
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

                                                    {/* Unassigned members (if any) - show as a special section */}
                                                    {businessLine.unassignedMembers.length > 0 && (
                                                        <div className="rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden">
                                                            {/* Header for unassigned members */}
                                                            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
                                                                <div className="flex flex-wrap items-center gap-4">
                                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                                                                        <UserCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                                        <div>
                                                                            <span className="text-xs text-amber-500 dark:text-amber-400 block">Team Leader</span>
                                                                            <span className="text-sm font-semibold text-amber-400 dark:text-amber-500 italic">Non renseigné</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30 flex-1 min-w-[200px]">
                                                                        <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                                        <div>
                                                                            <span className="text-xs text-orange-500 dark:text-orange-400 block">Mission de l'équipe</span>
                                                                            <span className="text-sm font-semibold text-orange-400 dark:text-orange-500 italic">Non renseignée</span>
                                                                        </div>
                                                                    </div>

                                                                    <Badge variant="secondary" className="ml-auto px-3 py-2 text-black">
                                                                        <Users className="w-4 h-4 mr-2" />
                                                                        {businessLine.unassignedMembers.length} membres
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            {/* Unassigned members table */}
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="border-b-2 border-cyan-500/20">
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Nom</th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Categorie</th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">The shape of handicap</th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Incapacity rate</th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Level of versatility F1</th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Level of versatility F2</th>
                                                                            <th className="text-left py-3 px-4 font-semibold text-sm bg-cyan-500/10 text-slate-900 dark:text-white">Level of versatility F3</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {businessLine.unassignedMembers.map((member, idx) => (
                                                                            <tr
                                                                                key={member.id}
                                                                                className={cn(
                                                                                    "border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors",
                                                                                    idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-white/[0.02]"
                                                                                )}
                                                                            >
                                                                                <td className="py-4 px-4">
                                                                                    <div className="font-medium text-slate-900 dark:text-white">{member.name}</div>
                                                                                </td>
                                                                                <td className="py-4 px-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-sm text-slate-900 dark:text-white">
                                                                                            {getFullCategoryLabel(member.professional_category, member.tech_level)}
                                                                                        </span>
                                                                                        {member.tech_level !== 'Standard' && (
                                                                                            <div className={cn("p-1.5 rounded bg-gradient-to-br", getTechColor(member.tech_level))}>
                                                                                                {getTechIcon(member.tech_level)}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-4 px-4">
                                                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{member.handicap_shape}</span>
                                                                                </td>
                                                                                <td className="py-4 px-4">
                                                                                    <Badge variant="outline" className="font-normal">{member.incapacity_rate}%</Badge>
                                                                                </td>
                                                                                <td className="py-4 px-4">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{getVersatilityLabel(member.versatility_f1)}</span>
                                                                                        <div className="flex gap-1">
                                                                                            {[...Array(3)].map((_, i) => (
                                                                                                <div key={i} className={cn("w-2 h-2 rounded-full", i < getVersatilityStars(member.versatility_f1) ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700")} />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-4 px-4">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{getVersatilityLabel(member.versatility_f2)}</span>
                                                                                        <div className="flex gap-1">
                                                                                            {[...Array(3)].map((_, i) => (
                                                                                                <div key={i} className={cn("w-2 h-2 rounded-full", i < getVersatilityStars(member.versatility_f2) ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700")} />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-4 px-4">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{getVersatilityLabel(member.versatility_f3)}</span>
                                                                                        <div className="flex gap-1">
                                                                                            {[...Array(3)].map((_, i) => (
                                                                                                <div key={i} className={cn("w-2 h-2 rounded-full", i < getVersatilityStars(member.versatility_f3) ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700")} />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
