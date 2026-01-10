import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, Briefcase, Bot, Cpu, Zap,
    ChevronLeft, AlertCircle,
    Building2, TrendingUp, HeartPulse, Layers,
    User, ArrowRight, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
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
    created_at: string;
    team_number?: number; // MISSION TEAMS: Numéro d'équipe
}

interface BusinessLine {
    id: string;
    name: string;
    description: string;
    members: TeamMember[];
    team_count: number; // MISSION TEAMS: Nombre d'équipes
}

// MISSION TEAMS: Grouper les membres par numéro d'équipe
const groupMembersByTeam = (members: TeamMember[], teamCount: number): Map<number, TeamMember[]> => {
    const teamGroups = new Map<number, TeamMember[]>();

    // Initialiser les groupes pour chaque équipe (1 à teamCount)
    for (let i = 1; i <= teamCount; i++) {
        teamGroups.set(i, []);
    }

    // Distribuer les membres dans leurs équipes respectives
    members.forEach((member) => {
        const teamNum = member.team_number || 1;
        const teamMembers = teamGroups.get(teamNum) || [];
        teamMembers.push(member);
        teamGroups.set(teamNum, teamMembers);
    });

    return teamGroups;
};

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

export default function TeamRecapView() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { companyId, isLoading: isCompanyLoading } = useCompany();
    const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                setError(null);

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

                // Fetch team members for each business line
                const businessLinesWithMembers: BusinessLine[] = await Promise.all(
                    businessLinesData.map(async (bl) => {
                        if (!isMounted) return null;

                        // OPTIMISATION 10K: Fetch members avec pagination
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

                        return {
                            id: bl.id,
                            name: bl.activity_name || bl.name,
                            description: bl.description || '',
                            members: allMembers,
                            team_count: bl.team_count || 1 // MISSION TEAMS
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
                setError(err.message || 'Une erreur est survenue');
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <HCMLoader text="Chargement des équipes..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive mb-4">
                            <AlertCircle className="w-5 h-5" />
                            <h3 className="font-semibold">Erreur</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => navigate('/modules/module3')} variant="outline" className="w-full">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Retour
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalEmployees = businessLines.reduce((sum, bl) => sum + bl.members.length, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Animated Background */}
            <div className="absolute inset-0 -z-10">
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
                                    Vue Globale des Équipes
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                                Récapitulatif des Employés
                            </h1>
                            <p className="text-muted-foreground">
                                Vue d'ensemble de toutes vos lignes d'activités et équipes
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
                {businessLines.length === 0 && (
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
                )}

                {/* Business Lines Grid */}
                <div className="space-y-8">
                    {businessLines.map((businessLine, blIndex) => (
                        <motion.div
                            key={businessLine.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: blIndex * 0.1 }}
                        >
                            <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                                <CardHeader className="bg-gradient-to-r from-orange-500/10 via-primary/10 to-purple-500/10 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-500/20">
                                                <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold">
                                                    {businessLine.name}
                                                </CardTitle>
                                                {businessLine.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {businessLine.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-base px-4 py-2">
                                            <Users className="w-4 h-4 mr-2" />
                                            {businessLine.members.length} employé{businessLine.members.length > 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-6">
                                    {businessLine.members.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>Aucun employé dans cette ligne d'activité</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* MISSION TEAMS: Affichage groupé par équipe si plusieurs équipes */}
                                            {businessLine.team_count > 1 ? (
                                                <div className="space-y-6">
                                                    {Array.from(groupMembersByTeam(businessLine.members, businessLine.team_count)).map(([teamNum, teamMembers]) => (
                                                        <div key={teamNum}>
                                                            {/* En-tête d'équipe */}
                                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-200 dark:border-blue-800">
                                                                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                                                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                                                                    Équipe {teamNum}
                                                                </h4>
                                                                <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                    {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
                                                                </Badge>
                                                            </div>

                                                            {teamMembers.length === 0 ? (
                                                                <p className="text-sm text-muted-foreground italic pl-4">Aucun membre dans cette équipe</p>
                                                            ) : (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {teamMembers.map((member, memberIndex) => (
                                                                        <motion.div
                                                                            key={member.id}
                                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            transition={{ delay: memberIndex * 0.05 }}
                                                                        >
                                                                            <Card className="h-full hover:shadow-lg transition-shadow border hover:border-primary/30">
                                                                                <CardContent className="pt-6">
                                                                                    {/* Employee Header */}
                                                                                    <div className="flex items-start justify-between mb-4">
                                                                                        <div className="flex-1">
                                                                                            <h4 className="font-semibold text-foreground mb-2">
                                                                                                {member.name}
                                                                                            </h4>
                                                                                            <Badge className={cn("text-xs", getCategoryColor(member.professional_category))}>
                                                                                                {member.professional_category}
                                                                                            </Badge>
                                                                                        </div>
                                                                                        <div className={cn(
                                                                                            "p-2 rounded-lg bg-gradient-to-br",
                                                                                            getTechColor(member.tech_level)
                                                                                        )}>
                                                                                            {getTechIcon(member.tech_level)}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Tech Level */}
                                                                                    <div className="mb-3">
                                                                                        <p className="text-xs text-muted-foreground mb-1">Niveau Technologique</p>
                                                                                        <Badge variant="outline" className="text-xs">
                                                                                            {member.tech_level}
                                                                                        </Badge>
                                                                                    </div>

                                                                                    {/* Handicap */}
                                                                                    <div className="mb-3 flex items-center gap-2">
                                                                                        <HeartPulse className="w-4 h-4 text-muted-foreground" />
                                                                                        <div className="flex-1">
                                                                                            <p className="text-xs text-muted-foreground">Handicap</p>
                                                                                            <p className="text-xs font-medium truncate">
                                                                                                {member.handicap_shape || 'Non spécifié'}
                                                                                            </p>
                                                                                        </div>
                                                                                        {member.incapacity_rate > 0 && (
                                                                                            <Badge variant="secondary" className="text-xs">
                                                                                                {member.incapacity_rate}%
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Versatility */}
                                                                                    <div className="pt-3 border-t">
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            <Layers className="w-4 h-4 text-muted-foreground" />
                                                                                            <p className="text-xs text-muted-foreground">Polyvalence</p>
                                                                                        </div>
                                                                                        <div className="space-y-1">
                                                                                            {['F1', 'F2', 'F3'].map((fn, idx) => {
                                                                                                const level = [member.versatility_f1, member.versatility_f2, member.versatility_f3][idx];
                                                                                                const stars = getVersatilityStars(level);
                                                                                                return (
                                                                                                    <div key={fn} className="flex items-center gap-2">
                                                                                                        <span className="text-xs font-medium text-muted-foreground w-6">{fn}:</span>
                                                                                                        <div className="flex gap-0.5">
                                                                                                            {[...Array(3)].map((_, i) => (
                                                                                                                <div
                                                                                                                    key={i}
                                                                                                                    className={cn(
                                                                                                                        "w-2 h-2 rounded-full",
                                                                                                                        i < stars ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700"
                                                                                                                    )}
                                                                                                                />
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                /* Affichage simple (1 seule équipe) */
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {businessLine.members.map((member, memberIndex) => (
                                                        <motion.div
                                                            key={member.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: memberIndex * 0.05 }}
                                                        >
                                                            <Card className="h-full hover:shadow-lg transition-shadow border hover:border-primary/30">
                                                                <CardContent className="pt-6">
                                                                    {/* Employee Header */}
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="flex-1">
                                                                            <h4 className="font-semibold text-foreground mb-2">
                                                                                {member.name}
                                                                            </h4>
                                                                            <Badge className={cn("text-xs", getCategoryColor(member.professional_category))}>
                                                                                {member.professional_category}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "p-2 rounded-lg bg-gradient-to-br",
                                                                            getTechColor(member.tech_level)
                                                                        )}>
                                                                            {getTechIcon(member.tech_level)}
                                                                        </div>
                                                                    </div>

                                                                    {/* Tech Level */}
                                                                    <div className="mb-3">
                                                                        <p className="text-xs text-muted-foreground mb-1">Niveau Technologique</p>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {member.tech_level}
                                                                        </Badge>
                                                                    </div>

                                                                    {/* Handicap */}
                                                                    <div className="mb-3 flex items-center gap-2">
                                                                        <HeartPulse className="w-4 h-4 text-muted-foreground" />
                                                                        <div className="flex-1">
                                                                            <p className="text-xs text-muted-foreground">Handicap</p>
                                                                            <p className="text-xs font-medium truncate">
                                                                                {member.handicap_shape || 'Non spécifié'}
                                                                            </p>
                                                                        </div>
                                                                        {member.incapacity_rate > 0 && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                {member.incapacity_rate}%
                                                                            </Badge>
                                                                        )}
                                                                    </div>

                                                                    {/* Versatility */}
                                                                    <div className="pt-3 border-t">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Layers className="w-4 h-4 text-muted-foreground" />
                                                                            <p className="text-xs text-muted-foreground">Polyvalence</p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {['F1', 'F2', 'F3'].map((fn, idx) => {
                                                                                const level = [member.versatility_f1, member.versatility_f2, member.versatility_f3][idx];
                                                                                const stars = getVersatilityStars(level);
                                                                                return (
                                                                                    <div key={fn} className="flex items-center gap-2">
                                                                                        <span className="text-xs font-medium text-muted-foreground w-6">{fn}:</span>
                                                                                        <div className="flex gap-0.5">
                                                                                            {[...Array(3)].map((_, i) => (
                                                                                                <div
                                                                                                    key={i}
                                                                                                    className={cn(
                                                                                                        "w-2 h-2 rounded-full",
                                                                                                        i < stars ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700"
                                                                                                    )}
                                                                                                />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
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
