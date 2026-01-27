import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberWizard, TeamMemberFormData } from './components/TeamMemberWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, ArrowLeft, ArrowRight, Trash2, Edit2, Bot, Cpu, Zap, Sparkles, UserCircle, Target, Lock, Unlock, Crown, CheckCircle2, Hash, ChevronLeft, ChevronRight } from 'lucide-react';

// OPTIMISATION 10K: Pagination UI
const PAGE_SIZE_UI = 50;
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

// Type for team entity
interface Team {
    id: string;
    business_line_id: string;
    team_number: number;
    team_name: string;
    team_mission: string | null;
    team_leader_id: string | null;
    is_configured: boolean;
}

export default function TeamMembersList() {
    const navigate = useNavigate();
    const location = useLocation();
    const { businessLineId, teamNumber, teamName, teamMission } = location.state || {};

    // User role detection for CEO permissions
    const { user } = useAuth();
    const { role: userRole } = useUserRole(user?.id);
    const isCEO = userRole === 'CEO';

    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [maxEmployees, setMaxEmployees] = useState<number>(0);
    const [totalTeamCount, setTotalTeamCount] = useState<number>(1);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [businessLineName, setBusinessLineName] = useState<string>('');

    // ========== Team Leader Selection ==========
    const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>('');
    const [currentTeamLeader, setCurrentTeamLeader] = useState<string | null>(null);
    const [isTeamLeaderDialogOpen, setIsTeamLeaderDialogOpen] = useState(false);
    const [savingTeamLeader, setSavingTeamLeader] = useState(false);

    // OPTIMISATION 10K: Pagination UI state
    const [currentPage, setCurrentPage] = useState(0);

    // Calculate employees per team (divide total staff_count by team_count)
    const employeesPerTeam = totalTeamCount > 0 ? Math.ceil(maxEmployees / totalTeamCount) : maxEmployees;

    // Check if this team is complete
    const isTeamComplete = employeesPerTeam > 0 && members.length >= employeesPerTeam;

    // Lock editing for non-CEO users when team is complete
    const isLocked = isTeamComplete && !isCEO;

    // OPTIMISATION 10K: Pagination memoized
    const totalPages = useMemo(() => Math.ceil(members.length / PAGE_SIZE_UI), [members.length]);
    const paginatedMembers = useMemo(() => {
        const start = currentPage * PAGE_SIZE_UI;
        return members.slice(start, start + PAGE_SIZE_UI);
    }, [members, currentPage]);

    useEffect(() => {
        if (!businessLineId || !teamNumber) {
            navigate('/modules/module3');
            return;
        }
        fetchBusinessLineInfo();
        fetchTeamInfo();
        fetchMembers();
    }, [businessLineId, teamNumber]);

    const fetchBusinessLineInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('business_lines')
                .select('staff_count, team_count, activity_name')
                .eq('id', businessLineId)
                .single();

            if (!error && data) {
                setMaxEmployees(data.staff_count || 0);
                setTotalTeamCount(data.team_count || 1);
                setBusinessLineName(data.activity_name || '');
            }
        } catch (error) {
            console.error('Error fetching business line info:', error);
        }
    };

    const fetchTeamInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('module3_teams')
                .select('*')
                .eq('business_line_id', businessLineId)
                .eq('team_number', teamNumber)
                .single();

            if (!error && data) {
                setCurrentTeam(data as Team);
                // If team has a leader, find their name
                if (data.team_leader_id) {
                    const { data: leaderData } = await supabase
                        .from('module3_team_members')
                        .select('name')
                        .eq('id', data.team_leader_id)
                        .single();
                    if (leaderData) {
                        setCurrentTeamLeader(leaderData.name);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching team info:', error);
        }
    };

    // Save selected Team Leader
    const handleSaveTeamLeader = async () => {
        if (!selectedTeamLeader || !currentTeam) {
            toast.error("Veuillez sélectionner un Chef d'Équipe");
            return;
        }

        try {
            setSavingTeamLeader(true);

            const selectedMember = members.find(m => m.id === selectedTeamLeader);
            if (!selectedMember) {
                toast.error("Membre non trouvé");
                return;
            }

            const { error } = await supabase
                .from('module3_teams')
                .update({ team_leader_id: selectedTeamLeader })
                .eq('id', currentTeam.id);

            if (error) throw error;

            setCurrentTeamLeader(selectedMember.name);
            setIsTeamLeaderDialogOpen(false);
            setSelectedTeamLeader('');
            toast.success(`${selectedMember.name} a été désigné(e) Chef d'Équipe`);
        } catch (error) {
            console.error('Error saving team leader:', error);
            toast.error("Erreur lors de la sauvegarde du Chef d'Équipe");
        } finally {
            setSavingTeamLeader(false);
        }
    };

    // Auto-open dialog when team is complete and no team leader
    useEffect(() => {
        if (isTeamComplete && !currentTeamLeader && members.length > 0 && !loading) {
            const timer = setTimeout(() => {
                setIsTeamLeaderDialogOpen(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isTeamComplete, currentTeamLeader, members.length, loading]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            // FILTER: Get members for this specific team (business_line + team_number)
            const { data, error } = await supabase
                .from('module3_team_members')
                .select('*')
                .eq('business_line_id', businessLineId)
                .eq('team_number', teamNumber)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error("Erreur lors du chargement des membres");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (data: TeamMemberFormData) => {
        // Check employee limit for this team
        if (employeesPerTeam > 0 && members.length >= employeesPerTeam) {
            toast.error(
                `Cette équipe ne doit contenir que ${employeesPerTeam} employés. Pour en ajouter plus, merci de contacter l'administrateur principal.`,
                { duration: 6000 }
            );
            return;
        }

        try {
            // Insert member with team_number to associate with specific team
            const insertData: Record<string, any> = {
                business_line_id: businessLineId,
                team_number: teamNumber,
                name: data.name,
                professional_category: data.category,
                tech_level: data.techLevel,
                handicap_shape: data.handicap,
                incapacity_rate: data.incapacityRate,
                versatility_f1: data.versatilityF1,
                versatility_f2: data.versatilityF2,
                versatility_f3: data.versatilityF3,
            };

            const { error } = await supabase
                .from('module3_team_members')
                .insert(insertData);

            if (error) throw error;

            toast.success(`Membre ajouté à ${teamName}`);
            setIsWizardOpen(false);
            fetchMembers();
        } catch (error) {
            console.error('Error adding member:', error);
            toast.error("Erreur lors de l'ajout du membre");
        }
    };

    const handleDeleteMember = async (id: string) => {
        try {
            const { error } = await supabase
                .from('module3_team_members')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Membre supprimé");
            fetchMembers();
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.error("Erreur lors de la suppression");
        }
    };

    // ========== Random Name Generator ==========
    const generateRandomName = () => {
        const firstNames = [
            "Marie", "Thomas", "Sophie", "Pierre", "Claire", "Jean", "Isabelle", "François",
            "Camille", "Nicolas", "Julie", "Antoine", "Émilie", "Maxime", "Laura", "Alexandre",
            "Aminata", "Oumar", "Fatou", "Moussa", "Aïssatou", "Ibrahima", "Mariama", "Mamadou",
            "Emma", "Lucas", "Anna", "David", "Elena", "Marco", "Sophia", "Liam", "Mia", "Noah"
        ];

        const lastNames = [
            "Dubois", "Martin", "Bernard", "Lefevre", "Moreau", "Petit", "Durand", "Leroy",
            "Diallo", "Traoré", "Coulibaly", "Diop", "Konaté", "Camara", "Sow", "Ndiaye",
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson"
        ];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return `${firstName} ${lastName}`;
    };

    const generateAIAgentEmployee = () => {
        const aiNames = ["Gemini", "ChatGPT", "Deepseek", "Mistral", "Grok", "Perplexity", "Claude", "Microsoft Copilot", "Autonomous Robot"];
        const aiCategoryMap: { [key: string]: string } = {
            "Executives": "Autonomous AI executive Agent",
            "Supervisors": "Autonomous AI supervisor Agent",
            "Clerk": "Autonomous AI clerk Agent",
            "Worker": "Autonomous AI worker Agent"
        };
        const baseCategories = ["Executives", "Supervisors", "Clerk", "Worker"];
        const techLevels = ["Standard", "IA", "Cobot", "Autonomous"];
        const versatilityLevels = ["Confirmed (autonomous)", "Experimented (trainer)"];

        const baseCategory = baseCategories[Math.floor(Math.random() * baseCategories.length)];

        return {
            name: aiNames[Math.floor(Math.random() * aiNames.length)],
            professional_category: aiCategoryMap[baseCategory],
            tech_level: techLevels[Math.floor(Math.random() * techLevels.length)],
            handicap_shape: "The employee is not handicaped",
            incapacity_rate: 0,
            versatility_f1: versatilityLevels[Math.floor(Math.random() * versatilityLevels.length)],
            versatility_f2: versatilityLevels[Math.floor(Math.random() * versatilityLevels.length)],
            versatility_f3: versatilityLevels[Math.floor(Math.random() * versatilityLevels.length)],
        };
    };

    const generateRandomEmployee = () => {
        const categories = ["Executives", "Supervisors", "Clerk", "Worker"];
        const techLevels = ["Standard", "IA", "Cobot", "Autonomous"];
        const handicapOptions = [
            { shape: "The employee is not handicaped", rate: 0 },
            { shape: "Light handicap: rate from 1 to 15 %", rate: Math.floor(Math.random() * 15) + 1 },
            { shape: "Moderate handicap: rate from 20 to 45 %", rate: Math.floor(Math.random() * 26) + 20 },
            { shape: "Severe handicap: rate above 50 %", rate: Math.floor(Math.random() * 50) + 50 },
        ];
        const versatilityLevels = [
            "Does not make / does not know",
            "Apprentice (learning)",
            "Confirmed (autonomous)",
            "Experimented (trainer)"
        ];

        const handicapIndex = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * handicapOptions.length);
        const handicap = handicapOptions[handicapIndex];

        return {
            name: generateRandomName(),
            professional_category: categories[Math.floor(Math.random() * categories.length)],
            tech_level: techLevels[Math.floor(Math.random() * techLevels.length)],
            handicap_shape: handicap.shape,
            incapacity_rate: handicap.rate,
            versatility_f1: versatilityLevels[Math.floor(Math.random() * versatilityLevels.length)],
            versatility_f2: versatilityLevels[Math.floor(Math.random() * versatilityLevels.length)],
            versatility_f3: versatilityLevels[Math.floor(Math.random() * versatilityLevels.length)],
        };
    };

    const generateDemoEmployees = async () => {
        const availableSlots = employeesPerTeam > 0 ? employeesPerTeam - members.length : 5;

        if (employeesPerTeam > 0 && availableSlots <= 0) {
            toast.error(
                `Cette équipe ne doit contenir que ${employeesPerTeam} employés.`,
                { duration: 6000 }
            );
            return;
        }

        const employeesToGenerate = Math.min(5, availableSlots);

        try {
            setLoading(true);

            const generatedNames = new Set<string>();
            const demoEmployees = [];
            const aiAgentPosition = Math.floor(Math.random() * employeesToGenerate);

            for (let i = 0; i < employeesToGenerate; i++) {
                if (i === aiAgentPosition) {
                    const aiEmployee = generateAIAgentEmployee();
                    if (!generatedNames.has(aiEmployee.name)) {
                        generatedNames.add(aiEmployee.name);
                        demoEmployees.push(aiEmployee);
                    } else {
                        let attempts = 0;
                        let uniqueAI = generateAIAgentEmployee();
                        while (generatedNames.has(uniqueAI.name) && attempts < 10) {
                            uniqueAI = generateAIAgentEmployee();
                            attempts++;
                        }
                        generatedNames.add(uniqueAI.name);
                        demoEmployees.push(uniqueAI);
                    }
                } else {
                    let attempts = 0;
                    let employee = generateRandomEmployee();
                    while (generatedNames.has(employee.name) && attempts < 20) {
                        employee = generateRandomEmployee();
                        attempts++;
                    }
                    generatedNames.add(employee.name);
                    demoEmployees.push(employee);
                }
            }

            // Build insert objects with team_number to associate with specific team
            const employeesWithContext = demoEmployees.map(emp => ({
                ...emp,
                business_line_id: businessLineId,
                team_number: teamNumber,
            }));

            const { error } = await supabase
                .from('module3_team_members')
                .insert(employeesWithContext);

            if (error) throw error;

            const aiCount = demoEmployees.filter(emp =>
                emp.professional_category.includes('Autonomous AI')
            ).length;
            const humanCount = demoEmployees.length - aiCount;

            toast.success(`✨ ${humanCount} humains + 🤖 ${aiCount} AI Agent générés pour ${teamName}!`);
            fetchMembers();
        } catch (error) {
            console.error('Error generating demo employees:', error);
            toast.error("Erreur lors de la génération des profils DEMO");
        } finally {
            setLoading(false);
        }
    };

    // Mark team as configured and navigate
    const handleNextStep = async () => {
        try {
            // Mark team as configured
            if (currentTeam) {
                await supabase
                    .from('module3_teams')
                    .update({ is_configured: true })
                    .eq('id', currentTeam.id);
            }

            // Check if there are more teams to configure
            if (teamNumber < totalTeamCount) {
                // Navigate back to team selection for next team
                toast.success(`Équipe "${teamName}" configurée! Passez à l'équipe suivante.`);
                navigate('/modules/module3', {
                    state: { preSelectedBusinessLine: businessLineId }
                });
            } else {
                // All teams configured, proceed to next module step
                toast.success(`Toutes les équipes de "${businessLineName}" sont configurées!`);
                navigate('/modules/module3/step3');
            }
        } catch (error) {
            console.error('Error updating team status:', error);
            navigate('/modules/module3/step3');
        }
    };

    const getTechIcon = (level: string) => {
        switch (level) {
            case 'IA': return <Cpu className="w-4 h-4 text-blue-500" />;
            case 'Cobot': return <Bot className="w-4 h-4 text-purple-500" />;
            case 'Autonomous': return <Zap className="w-4 h-4 text-orange-500" />;
            default: return null;
        }
    };

    if (loading && !isWizardOpen) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <HCMLoader text="Chargement de l'équipe..." />
            </div>
        );
    }

    if (isWizardOpen) {
        return (
            <div className="min-h-screen bg-background p-8">
                <Card className="max-w-5xl mx-auto shadow-2xl border-primary/10">
                    <CardHeader>
                        <CardTitle>Ajouter un membre à {teamName}</CardTitle>
                        <CardDescription>Configuration détaillée du profil</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TeamMemberWizard
                            onComplete={handleAddMember}
                            onCancel={() => setIsWizardOpen(false)}
                            teamCount={1} // Single team context - no team selection needed
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header with Team Info */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                {teamName}
                            </h1>
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                                <Hash className="w-3 h-3 mr-1" />
                                Équipe {teamNumber} / {totalTeamCount}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {businessLineName} • {teamMission || 'Aucune mission définie'}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => navigate('/modules/module3')}>
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Retour
                        </Button>
                        <Button
                            variant="outline"
                            onClick={generateDemoEmployees}
                            className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10 hover:border-purple-500"
                            disabled={employeesPerTeam > 0 && members.length >= employeesPerTeam}
                        >
                            <Sparkles className="mr-2 w-4 h-4" />
                            Generate DEMO
                        </Button>
                        <Button
                            onClick={() => setIsWizardOpen(true)}
                            className="bg-primary hover:bg-primary/90"
                            disabled={employeesPerTeam > 0 && members.length >= employeesPerTeam}
                            title={employeesPerTeam > 0 && members.length >= employeesPerTeam ? `Limite de ${employeesPerTeam} employés atteinte` : undefined}
                        >
                            <Plus className="mr-2 w-4 h-4" />
                            Ajouter un membre
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className={`border ${
                        isTeamComplete
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-primary/5 border-primary/20'
                    }`}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-full ${
                                isTeamComplete ? 'bg-green-500/10' : 'bg-primary/10'
                            }`}>
                                <Users className={`w-6 h-6 ${
                                    isTeamComplete ? 'text-green-500' : 'text-primary'
                                }`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Membres de l'équipe</p>
                                <h3 className="text-2xl font-bold">
                                    {members.length}
                                    {employeesPerTeam > 0 && (
                                        <span className={`text-base font-normal ml-1 ${
                                            members.length >= employeesPerTeam
                                                ? 'text-green-500'
                                                : 'text-muted-foreground'
                                        }`}>
                                            / {employeesPerTeam}
                                        </span>
                                    )}
                                </h3>
                                {isTeamComplete && (
                                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Équipe complète
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Leader Card */}
                    <Card className={`border ${
                        currentTeamLeader
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : isTeamComplete
                                ? 'bg-red-500/5 border-red-500/20 animate-pulse'
                                : 'bg-muted/5 border-muted/20'
                    }`}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-full ${
                                currentTeamLeader
                                    ? 'bg-amber-500/10'
                                    : isTeamComplete
                                        ? 'bg-red-500/10'
                                        : 'bg-muted/10'
                            }`}>
                                <Crown className={`w-6 h-6 ${
                                    currentTeamLeader
                                        ? 'text-amber-500'
                                        : isTeamComplete
                                            ? 'text-red-500'
                                            : 'text-muted-foreground'
                                }`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Chef d'Équipe</p>
                                {currentTeamLeader ? (
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-amber-600">{currentTeamLeader}</h3>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                ) : isTeamComplete ? (
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 text-red-500 hover:text-red-600"
                                        onClick={() => setIsTeamLeaderDialogOpen(true)}
                                    >
                                        Désigner un chef
                                    </Button>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Disponible quand l'équipe est complète
                                    </p>
                                )}
                            </div>
                            {currentTeamLeader && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsTeamLeaderDialogOpen(true)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {teamMission && (
                        <Card className={`border ${
                            isLocked
                                ? 'bg-slate-500/5 border-slate-500/20'
                                : 'bg-cyan-500/5 border-cyan-500/20'
                        }`}>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className={`p-3 rounded-full ${
                                    isLocked ? 'bg-slate-500/10' : 'bg-cyan-500/10'
                                }`}>
                                    <Target className={`w-6 h-6 ${
                                        isLocked ? 'text-slate-500' : 'text-cyan-500'
                                    }`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-muted-foreground">Mission</p>
                                        {isTeamComplete && (
                                            <div className="flex items-center gap-1">
                                                {isLocked ? (
                                                    <Lock className="w-3 h-3 text-slate-500" />
                                                ) : (
                                                    <Unlock className="w-3 h-3 text-green-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className={`text-sm font-medium truncate max-w-[200px] ${isLocked ? 'text-slate-500' : ''}`} title={teamMission}>
                                        {teamMission}
                                    </h3>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Members Table */}
                <Card className="shadow-xl border-muted">
                    <CardContent className="p-0">
                        {members.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                <div className="p-4 rounded-full bg-muted">
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">Aucun membre dans {teamName}</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        Commencez par ajouter les membres de cette équipe.
                                    </p>
                                </div>
                                <Button onClick={() => setIsWizardOpen(true)}>
                                    <Plus className="mr-2 w-4 h-4" />
                                    Ajouter le premier membre
                                </Button>
                            </div>
                        ) : (
                            <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Catégorie</TableHead>
                                        <TableHead>Tech Level</TableHead>
                                        <TableHead>Handicap</TableHead>
                                        <TableHead>Polyvalence (F1)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedMembers.map((member) => (
                                        <TableRow key={member.id} className="hover:bg-muted/5">
                                            <TableCell className="font-medium">{member.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">
                                                    {member.professional_category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getTechIcon(member.tech_level)}
                                                    <span className="text-sm">{member.tech_level}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {member.handicap_shape === 'The employee is not handicaped' ? 'Non' : 'Oui'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {member.versatility_f1}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                    onClick={() => handleDeleteMember(member.id)}
                                                    disabled={isLocked}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {/* OPTIMISATION 10K: Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                                    <span className="text-sm text-muted-foreground">
                                        Affichage {currentPage * PAGE_SIZE_UI + 1} - {Math.min((currentPage + 1) * PAGE_SIZE_UI, members.length)} sur {members.length} membres
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                            disabled={currentPage === 0}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-sm font-medium px-2">
                                            Page {currentPage + 1} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                            disabled={currentPage >= totalPages - 1}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-8">
                    <p className="text-sm text-muted-foreground">
                        {teamNumber < totalTeamCount
                            ? `Après cette équipe, il reste ${totalTeamCount - teamNumber} équipe(s) à configurer`
                            : 'Dernière équipe de cette ligne d\'activité'
                        }
                    </p>
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
                        disabled={members.length === 0}
                        onClick={handleNextStep}
                    >
                        {teamNumber < totalTeamCount ? 'Équipe suivante' : 'Terminer'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>

            </div>

            {/* Team Leader Selection Dialog */}
            <Dialog open={isTeamLeaderDialogOpen} onOpenChange={setIsTeamLeaderDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            Désigner le Chef d'Équipe
                        </DialogTitle>
                        <DialogDescription>
                            {currentTeamLeader
                                ? `Chef d'équipe actuel : ${currentTeamLeader}. Vous pouvez le modifier ci-dessous.`
                                : `L'équipe "${teamName}" est complète ! Veuillez désigner un Chef d'Équipe.`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Select
                            value={selectedTeamLeader}
                            onValueChange={setSelectedTeamLeader}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionnez un membre..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        <div className="flex items-center gap-2">
                                            <UserCircle className="w-4 h-4 text-muted-foreground" />
                                            <span>{member.name}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">
                                                {member.professional_category}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsTeamLeaderDialogOpen(false);
                                setSelectedTeamLeader('');
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSaveTeamLeader}
                            disabled={!selectedTeamLeader || savingTeamLeader}
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                            {savingTeamLeader ? (
                                <>Enregistrement...</>
                            ) : (
                                <>
                                    <Crown className="w-4 h-4 mr-2" />
                                    Confirmer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
