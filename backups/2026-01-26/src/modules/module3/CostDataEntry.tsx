import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

// OPTIMISATION 10K: Pagination pour chargement des membres
const PAGE_SIZE_MEMBERS = 100;
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';
import {
    ArrowLeft, ArrowRight, Calendar, Building2, Users, UserCircle,
    Sparkles, Activity, AlertTriangle, Zap, Target,
    Clock, DollarSign, Check, ChevronRight, Shield, Wand2, Trash2, Lock
} from 'lucide-react';

// Import pour synchronisation calendrier (Phase 3)
import { LaunchDateProvider } from '@/components/shared/SmartDateWidgets';
import { calendarEventBus } from '@/lib/fiscal/CalendarEventBus';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';
import { QualityDefectsForm, type QualityDefectEntry } from './components/QualityDefectsForm';
import { OccupationalAccidentForm, type OccupationalAccidentEntry } from './components/OccupationalAccidentForm';
import { DirectProductivityForm, type DirectProductivityEntry } from './components/DirectProductivityForm';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Import du sélecteur de période connecté au calendrier fiscal
import { CalendarPeriodSelector, type PeriodSelection } from '@/components/shared/CalendarPeriodSelector';
// Import du nouveau sélecteur visuel de semaines (style Performance Calendar)
import WeekCalendarSelector, { type WeekSelection } from '@/components/shared/WeekCalendarSelector';

// Types for Cost Data Entry
interface BusinessLine {
    id: string;
    activity_name: string;
    staff_count: number;
    team_count: number;
    team_leader: string | null;
    team_mission: string | null;
}

interface TeamMember {
    id: string;
    name: string;
    professional_category: string;
    tech_level: string;
    team_number: number; // Numéro de l'équipe pour le filtrage
}

interface KPIType {
    id: string;
    code: string;
    name: string;
    nameFr: string;
    description: string;
    gradient: string;
    bgClass: string;
    textClass: string;
    icon: React.ReactNode;
}

interface CostEntry {
    employeeId: string;
    employeeName: string;
    employeeTechLevel: string;
    date: string;
    hours: number;
    minutes: number;
    compensation: number;
}

// Type pour les équipes (chargées depuis module3_teams)
interface Team {
    id: string;
    team_number: number;
    team_name: string;
    team_leader_id: string | null;
    team_leader_name: string | null;  // Nom du team leader (JOIN avec module3_team_members)
    is_configured: boolean;
}

// KPI Definitions - Key Performance Indicators (Drivers of Economic Benefit)
// IMPORTANT: Classes Tailwind complètes pour éviter la purge CSS
const KPI_DEFINITIONS: KPIType[] = [
    {
        id: 'abs',
        code: 'ABS',
        name: 'Absenteeism',
        nameFr: 'Absentéisme',
        description: 'Track employee absences and their impact on productivity',
        gradient: 'from-orange-500 to-amber-600',
        bgClass: 'bg-orange-500/20',
        textClass: 'text-orange-600 dark:text-orange-400',
        icon: <UserCircle className="w-6 h-6" />
    },
    {
        id: 'qd',
        code: 'QD',
        name: 'Quality Defects',
        nameFr: 'Défauts Qualité',
        description: 'Monitor quality issues and defect rates',
        gradient: 'from-rose-500 to-pink-600',
        bgClass: 'bg-rose-500/20',
        textClass: 'text-rose-600 dark:text-rose-400',
        icon: <AlertTriangle className="w-6 h-6" />
    },
    {
        id: 'oa',
        code: 'OA',
        name: 'Occupational Accidents',
        nameFr: 'Accidents de Travail',
        description: 'Record workplace incidents and safety events',
        gradient: 'from-red-500 to-rose-600',
        bgClass: 'bg-red-500/20',
        textClass: 'text-red-600 dark:text-red-400',
        icon: <Zap className="w-6 h-6" />
    },
    {
        id: 'ddp',
        code: 'DDP',
        name: 'Distances from Direct Productivity',
        nameFr: 'Écarts de Productivité Directe',
        description: 'Measure deviations from expected productivity levels',
        gradient: 'from-violet-500 to-purple-600',
        bgClass: 'bg-violet-500/20',
        textClass: 'text-violet-600 dark:text-violet-400',
        icon: <Target className="w-6 h-6" />
    }
    // NOTE: EKH (Écarts de Savoir-faire) sera calculé dans le moteur de calcul - Phase 3
];

export default function CostDataEntry() {
    const navigate = useNavigate();
    const { companyId, isLoading: isCompanyLoading } = useCompany();
    const { user } = useAuth();

    // Wizard step state
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // Step 1: Selection state
    const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedBusinessLine, setSelectedBusinessLine] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [teams, setTeams] = useState<Team[]>([]); // Équipes chargées depuis module3_teams
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');

    // Step 2: KPI Selection
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

    // Step 3: Cost entries for selected KPI
    const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
    const [currentEntry, setCurrentEntry] = useState<Partial<CostEntry>>({});

    // Quality Defects specific entries
    const [qualityDefectEntries, setQualityDefectEntries] = useState<QualityDefectEntry[]>([]);

    // Occupational Accidents specific entries
    const [occupationalAccidentEntries, setOccupationalAccidentEntries] = useState<OccupationalAccidentEntry[]>([]);

    // Direct Productivity specific entries
    const [directProductivityEntries, setDirectProductivityEntries] = useState<DirectProductivityEntry[]>([]);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generatingDemo, setGeneratingDemo] = useState(false);
    const [deletingDemo, setDeletingDemo] = useState(false);

    // État pour suivre si la période sélectionnée est verrouillée
    const [isPeriodLocked, setIsPeriodLocked] = useState(false);

    // OPTIMISATION 10K: Pagination state pour membres
    const [membersPage, setMembersPage] = useState(0);
    const [hasMoreMembers, setHasMoreMembers] = useState(false);
    const [totalMembersCount, setTotalMembersCount] = useState(0);
    const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);

    // Fetch business lines on mount
    useEffect(() => {
        if (!isCompanyLoading && companyId) {
            fetchBusinessLines();
        }
    }, [companyId, isCompanyLoading]);

    const fetchBusinessLines = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('business_lines')
                .select('id, activity_name, staff_count, team_count, team_leader, team_mission')
                .eq('company_id', companyId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setBusinessLines(data || []);
        } catch (error) {
            console.error('Error fetching business lines:', error);
            toast.error("Erreur lors du chargement des lignes d'activité");
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour charger les équipes depuis module3_teams avec le nom du team leader
    const fetchTeams = async (businessLineId: string) => {
        try {
            const { data, error } = await supabase
                .from('module3_teams')
                .select(`
                    id,
                    team_number,
                    team_name,
                    team_leader_id,
                    is_configured,
                    team_leader:module3_team_members!team_leader_id(name)
                `)
                .eq('business_line_id', businessLineId)
                .order('team_number', { ascending: true });

            if (error) throw error;

            // Transformer les données pour extraire le nom du team leader
            const teamsWithLeaderName = (data || []).map(team => ({
                ...team,
                team_leader_name: team.team_leader?.name || null
            }));

            setTeams(teamsWithLeaderName);
            setSelectedTeam('all'); // Reset à "Toutes les équipes" quand on change de ligne
        } catch (error) {
            console.error('Erreur lors du chargement des équipes:', error);
            setTeams([]);
        }
    };

    // OPTIMISATION 10K: Fonction de chargement paginé des membres
    const fetchTeamMembers = useCallback(async (businessLineId: string, page: number = 0, append: boolean = false) => {
        try {
            if (page === 0) {
                setLoadingMoreMembers(false);
            } else {
                setLoadingMoreMembers(true);
            }

            const from = page * PAGE_SIZE_MEMBERS;
            const to = from + PAGE_SIZE_MEMBERS - 1;

            const { data, error, count } = await supabase
                .from('module3_team_members')
                .select('id, name, professional_category, tech_level, team_number', { count: 'exact' })
                .eq('business_line_id', businessLineId)
                .order('name', { ascending: true })
                .range(from, to);

            if (error) throw error;

            if (append) {
                setTeamMembers(prev => [...prev, ...(data || [])]);
            } else {
                setTeamMembers(data || []);
            }

            setTotalMembersCount(count || 0);
            setHasMoreMembers((count || 0) > (page + 1) * PAGE_SIZE_MEMBERS);
            setMembersPage(page);
        } catch (error) {
            console.error('Error fetching team members:', error);
            toast.error("Erreur lors du chargement des membres de l'équipe");
        } finally {
            setLoadingMoreMembers(false);
        }
    }, []);

    // OPTIMISATION 10K: Charger plus de membres
    const loadMoreMembers = useCallback(() => {
        if (selectedBusinessLine && hasMoreMembers && !loadingMoreMembers) {
            fetchTeamMembers(selectedBusinessLine, membersPage + 1, true);
        }
    }, [selectedBusinessLine, hasMoreMembers, loadingMoreMembers, membersPage, fetchTeamMembers]);

    // OPTIMISATION 10K: Fetch team members when business line changes (après définition de fetchTeamMembers)
    useEffect(() => {
        if (selectedBusinessLine) {
            setMembersPage(0);
            fetchTeamMembers(selectedBusinessLine, 0, false);
        }
    }, [selectedBusinessLine, fetchTeamMembers]);

    const handleNextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleKPISelect = (kpiId: string) => {
        setSelectedKPI(kpiId);
        // Reset entries when changing KPI
        setCostEntries([]);
        setCurrentEntry({});
        setQualityDefectEntries([]);
        setOccupationalAccidentEntries([]);
        setDirectProductivityEntries([]);
    };

    const handleAddEntry = () => {
        if (!currentEntry.employeeId || !currentEntry.date) {
            toast.error("Veuillez sélectionner un employé et une date");
            return;
        }

        // Validation: date doit être dans la période sélectionnée
        const entryDate = new Date(currentEntry.date);
        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        if (entryDate < startDate || entryDate > endDate) {
            toast.error(`La date doit être comprise entre ${periodStart} et ${periodEnd}`);
            return;
        }

        const employee = teamMembers.find(m => m.id === currentEntry.employeeId);
        setCostEntries([...costEntries, {
            employeeId: currentEntry.employeeId,
            employeeName: employee?.name || '',
            employeeTechLevel: employee?.tech_level || 'Standard',
            date: currentEntry.date,
            hours: currentEntry.hours || 0,
            minutes: currentEntry.minutes || 0,
            compensation: currentEntry.compensation || 0
        }]);
        setCurrentEntry({});
        toast.success(`Entrée ajoutée pour ${employee?.name}`);
    };

    // Handler pour ajouter une entrée Quality Defects
    const handleAddQualityDefectEntry = (entry: QualityDefectEntry) => {
        setQualityDefectEntries(prev => [...prev, entry]);
    };

    // Handler pour supprimer une entrée Quality Defects
    const handleRemoveQualityDefectEntry = (index: number) => {
        setQualityDefectEntries(prev => prev.filter((_, i) => i !== index));
    };

    // Handler pour ajouter une entrée Occupational Accidents
    const handleAddOccupationalAccidentEntry = (entry: OccupationalAccidentEntry) => {
        setOccupationalAccidentEntries(prev => [...prev, entry]);
    };

    // Handler pour supprimer une entrée Occupational Accidents
    const handleRemoveOccupationalAccidentEntry = (index: number) => {
        setOccupationalAccidentEntries(prev => prev.filter((_, i) => i !== index));
    };

    // Handler pour ajouter une entrée Direct Productivity
    const handleAddDirectProductivityEntry = (entry: DirectProductivityEntry) => {
        setDirectProductivityEntries(prev => [...prev, entry]);
    };

    // Handler pour supprimer une entrée Direct Productivity
    const handleRemoveDirectProductivityEntry = (index: number) => {
        setDirectProductivityEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveAll = async () => {
        // Vérifier les entrées selon le type de KPI
        const isQualityDefects = selectedKPI === 'qd';
        const isOccupationalAccident = selectedKPI === 'oa';
        const isDirectProductivity = selectedKPI === 'ddp';

        // Déterminer les entrées à sauvegarder selon le KPI
        let entries: unknown[];
        if (isQualityDefects) {
            entries = qualityDefectEntries;
        } else if (isOccupationalAccident) {
            entries = occupationalAccidentEntries;
        } else if (isDirectProductivity) {
            entries = directProductivityEntries;
        } else {
            entries = costEntries;
        }

        if (!selectedKPI || entries.length === 0) {
            toast.error("Veuillez ajouter au moins une entrée");
            return;
        }

        try {
            setSaving(true);

            // Prepare data for insertion selon le type de KPI
            let entriesData;

            if (isQualityDefects) {
                // Données spécifiques aux défauts qualité
                entriesData = qualityDefectEntries.map(entry => ({
                    company_id: companyId,
                    business_line_id: selectedBusinessLine,
                    employee_id: entry.employeeId,
                    kpi_type: selectedKPI,
                    period_start: periodStart,
                    period_end: periodEnd,
                    event_date: entry.date,
                    duration_hours: entry.hours,
                    duration_minutes: entry.minutes,
                    compensation_amount: entry.compensation,
                    defect_types: entry.defectTypes, // Champ spécifique QD
                    created_by: user?.id
                }));
            } else if (isOccupationalAccident) {
                // Données spécifiques aux accidents de travail
                entriesData = occupationalAccidentEntries.map(entry => ({
                    company_id: companyId,
                    business_line_id: selectedBusinessLine,
                    employee_id: entry.employeeId,
                    kpi_type: selectedKPI,
                    period_start: periodStart,
                    period_end: periodEnd,
                    event_date: entry.date,
                    duration_hours: entry.hours,
                    duration_minutes: entry.minutes,
                    compensation_amount: entry.compensation,
                    responsibility_level: entry.responsibilityLevel, // Champ spécifique OA
                    created_by: user?.id
                }));
            } else if (isDirectProductivity) {
                // Données spécifiques aux écarts de productivité directe
                entriesData = directProductivityEntries.map(entry => ({
                    company_id: companyId,
                    business_line_id: selectedBusinessLine,
                    employee_id: entry.employeeId,
                    kpi_type: selectedKPI,
                    period_start: periodStart,
                    period_end: periodEnd,
                    event_date: periodEnd, // Utiliser la fin de période pour DDP (respect contrainte cost_entries_event_in_period)
                    duration_hours: entry.plannedTimeHours,
                    duration_minutes: entry.plannedTimeMinutes,
                    compensation_amount: entry.plannedExpenses,
                    // Champs spécifiques DDP - Gains
                    selected_days: entry.selectedDays,
                    recovered_time_hours: entry.recoveredTimeHours,
                    recovered_time_minutes: entry.recoveredTimeMinutes,
                    saved_expenses: entry.savedExpenses,
                    // Champs spécifiques DDP - Pertes
                    lost_time_hours: entry.lostTimeHours,
                    lost_time_minutes: entry.lostTimeMinutes,
                    excess_expenses: entry.excessExpenses,
                    created_by: user?.id
                }));
            } else {
                // Données standard pour les autres KPIs
                entriesData = costEntries.map(entry => ({
                    company_id: companyId,
                    business_line_id: selectedBusinessLine,
                    employee_id: entry.employeeId,
                    kpi_type: selectedKPI,
                    period_start: periodStart,
                    period_end: periodEnd,
                    event_date: entry.date,
                    duration_hours: entry.hours,
                    duration_minutes: entry.minutes,
                    compensation_amount: entry.compensation,
                    created_by: user?.id
                }));
            }

            const { error } = await supabase
                .from('module3_cost_entries')
                .insert(entriesData);

            if (error) throw error;

            toast.success(`${entries.length} entrées sauvegardées avec succès`);

            // Émettre l'événement DATA_ENTERED pour synchronisation (Phase 3)
            // Cela notifie CalendarPeriodSelector et PerformanceCalendarPage
            const totalAmount = entriesData.reduce((sum: number, e: any) => sum + (Number(e.compensation_amount) || 0), 0);
            calendarEventBus.emitDataEntered(
                periodStart,
                periodEnd,
                selectedKPI || '',
                totalAmount,
                entries.length
            );

            // Reset and go back to KPI selection
            setCostEntries([]);
            setQualityDefectEntries([]);
            setOccupationalAccidentEntries([]);
            setDirectProductivityEntries([]);
            setSelectedKPI(null);
            setCurrentStep(2);
        } catch (error: any) {
            console.error('Error saving cost entries:', error);
            // Afficher l'erreur réelle pour le debugging
            const errorMessage = error?.message || error?.details || 'Unknown error';
            const errorCode = error?.code || '';

            // If table doesn't exist, show helpful message
            if (errorCode === '42P01') {
                toast.error("La table de données n'existe pas encore. Migration requise.");
            } else if (errorCode === '42703') {
                // Column does not exist
                toast.error(`Colonne manquante dans la base de données. Migration requise: ${errorMessage}`);
            } else if (errorCode === '23503') {
                // Foreign key violation - employee_id not found
                toast.error("Erreur: Un employé référencé n'existe pas dans la base de données.");
            } else if (errorCode === '23505') {
                // Unique constraint violation
                toast.error("Erreur: Cette entrée existe déjà.");
            } else if (errorCode === '42501' || errorMessage.includes('policy')) {
                // RLS policy violation
                toast.error("Erreur de permissions: Vous n'avez pas les droits pour cette opération.");
            } else {
                toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
            }
        } finally {
            setSaving(false);
        }
    };

    // Fonction pour générer des données démo réalistes
    const handleGenerateDemo = async () => {
        if (!companyId) {
            toast.error("Aucune entreprise sélectionnée");
            return;
        }

        try {
            setGeneratingDemo(true);
            toast.info("Génération des données démo en cours...");

            // 1. Récupérer toutes les lignes d'activité
            const { data: allBusinessLines, error: blError } = await supabase
                .from('business_lines')
                .select('id, activity_name')
                .eq('company_id', companyId);

            if (blError) throw blError;
            if (!allBusinessLines || allBusinessLines.length === 0) {
                toast.error("Aucune ligne d'activité trouvée. Veuillez d'abord créer des lignes.");
                return;
            }

            // 2. Définir la période (cette semaine)
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

            const demoPeriodStart = startOfWeek.toISOString().split('T')[0];
            const demoPeriodEnd = endOfWeek.toISOString().split('T')[0];

            // Fonction pour générer une date aléatoire dans la période
            const getRandomDateInPeriod = (): string => {
                const start = startOfWeek.getTime();
                const end = endOfWeek.getTime();
                const randomDate = new Date(start + Math.random() * (end - start));
                return randomDate.toISOString().split('T')[0];
            };

            // Fonction pour générer des heures réalistes
            const getRandomHours = (min: number, max: number): number => {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            };

            // Fonction pour générer des minutes (0, 15, 30, 45)
            const getRandomMinutes = (): number => {
                const options = [0, 15, 30, 45];
                return options[Math.floor(Math.random() * options.length)];
            };

            // Fonction pour générer des compensations réalistes
            const getRandomCompensation = (min: number, max: number): number => {
                return Math.round((Math.random() * (max - min) + min) * 100) / 100;
            };

            // Types de défauts qualité
            const defectTypeOptions = [
                'Erreur de saisie',
                'Non-conformité produit',
                'Défaut de communication',
                'Retard de livraison',
                'Documentation incomplète',
                'Processus non respecté'
            ];

            // Niveaux de responsabilité pour accidents
            const responsibilityLevels = ['low', 'medium', 'high'];

            let totalEntriesGenerated = 0;
            const allEntriesToInsert: unknown[] = [];

            // 3. Pour chaque ligne d'activité
            for (const bl of allBusinessLines) {
                // Récupérer les membres de cette ligne
                const { data: members, error: membersError } = await supabase
                    .from('module3_team_members')
                    .select('id, name')
                    .eq('business_line_id', bl.id);

                if (membersError) {
                    console.error(`Erreur pour ligne ${bl.activity_name}:`, membersError);
                    continue;
                }

                if (!members || members.length === 0) {
                    continue;
                }

                // Sélectionner jusqu'à 3 employés aléatoires
                const shuffled = [...members].sort(() => 0.5 - Math.random());
                const selectedEmployees = shuffled.slice(0, Math.min(3, members.length));

                // 4. Générer des entrées pour chaque KPI
                for (const kpi of KPI_DEFINITIONS) {
                    for (const emp of selectedEmployees) {
                        // Nombre d'entrées aléatoire par employé/KPI (1-3)
                        const numEntries = Math.floor(Math.random() * 3) + 1;

                        for (let i = 0; i < numEntries; i++) {
                            let entryData: Record<string, unknown> = {
                                company_id: companyId,
                                business_line_id: bl.id,
                                employee_id: emp.id,
                                kpi_type: kpi.id,
                                period_start: demoPeriodStart,
                                period_end: demoPeriodEnd,
                                event_date: getRandomDateInPeriod(),
                                created_by: user?.id
                            };

                            // Données spécifiques selon le type de KPI
                            switch (kpi.id) {
                                case 'abs': // Absentéisme
                                    entryData = {
                                        ...entryData,
                                        duration_hours: getRandomHours(1, 8),
                                        duration_minutes: getRandomMinutes(),
                                        compensation_amount: getRandomCompensation(50, 300)
                                    };
                                    break;

                                case 'qd': // Défauts Qualité
                                    const selectedDefects = defectTypeOptions
                                        .sort(() => 0.5 - Math.random())
                                        .slice(0, Math.floor(Math.random() * 3) + 1);
                                    entryData = {
                                        ...entryData,
                                        duration_hours: getRandomHours(0, 4),
                                        duration_minutes: getRandomMinutes(),
                                        compensation_amount: getRandomCompensation(20, 150),
                                        defect_types: selectedDefects
                                    };
                                    break;

                                case 'oa': // Accidents de travail
                                    entryData = {
                                        ...entryData,
                                        duration_hours: getRandomHours(1, 16),
                                        duration_minutes: getRandomMinutes(),
                                        compensation_amount: getRandomCompensation(100, 500),
                                        responsibility_level: responsibilityLevels[Math.floor(Math.random() * responsibilityLevels.length)]
                                    };
                                    break;

                                case 'ddp': // Écarts de Productivité Directe
                                    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
                                    const selectedDays = days
                                        .sort(() => 0.5 - Math.random())
                                        .slice(0, Math.floor(Math.random() * 3) + 2);
                                    entryData = {
                                        ...entryData,
                                        duration_hours: getRandomHours(2, 8),
                                        duration_minutes: getRandomMinutes(),
                                        compensation_amount: getRandomCompensation(100, 400),
                                        selected_days: selectedDays,
                                        recovered_time_hours: getRandomHours(0, 4),
                                        recovered_time_minutes: getRandomMinutes(),
                                        saved_expenses: getRandomCompensation(0, 100)
                                    };
                                    break;
                            }

                            allEntriesToInsert.push(entryData);
                            totalEntriesGenerated++;
                        }
                    }
                }
            }

            // 5. Insérer toutes les entrées en batch
            if (allEntriesToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('module3_cost_entries')
                    .insert(allEntriesToInsert);

                if (insertError) throw insertError;

                toast.success(
                    `✨ ${totalEntriesGenerated} entrées démo générées avec succès pour ${allBusinessLines.length} lignes d'activité!`,
                    { duration: 5000 }
                );
            } else {
                toast.warning("Aucune entrée générée. Vérifiez que des membres existent dans vos lignes d'activité.");
            }

        } catch (error: unknown) {
            console.error('Erreur génération démo:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            toast.error(`Erreur lors de la génération: ${errorMessage}`);
        } finally {
            setGeneratingDemo(false);
        }
    };

    // Fonction pour supprimer TOUTES les données démo (cost entries + team members)
    const handleDeleteAllDemoData = async () => {
        if (!companyId) {
            toast.error("Aucune entreprise sélectionnée");
            return;
        }

        // Confirmation explicite
        const confirmed = window.confirm(
            "ATTENTION: Cette action va supprimer TOUTES les données de Module 3:\n\n" +
            "- Toutes les entrées de coûts (module3_cost_entries)\n" +
            "- Tous les membres d'équipe (module3_team_members)\n\n" +
            "Cette action est IRREVERSIBLE.\n\n" +
            "Voulez-vous vraiment continuer?"
        );

        if (!confirmed) {
            toast.info("Suppression annulée");
            return;
        }

        try {
            setDeletingDemo(true);
            toast.info("Suppression des données en cours...");

            // 1. Récupérer toutes les lignes d'activité de l'entreprise
            const { data: allBusinessLines, error: blError } = await supabase
                .from('business_lines')
                .select('id')
                .eq('company_id', companyId);

            if (blError) throw blError;

            if (!allBusinessLines || allBusinessLines.length === 0) {
                toast.warning("Aucune ligne d'activité trouvée");
                return;
            }

            const businessLineIds = allBusinessLines.map(bl => bl.id);

            // 2. Supprimer toutes les entrées de coûts pour ces lignes d'activité
            const { error: costError, count: costCount } = await supabase
                .from('module3_cost_entries')
                .delete()
                .in('business_line_id', businessLineIds)
                .select('*', { count: 'exact', head: true });

            if (costError) {
                console.error('Erreur suppression cost_entries:', costError);
                throw costError;
            }

            // 3. Supprimer tous les membres d'équipe pour ces lignes d'activité
            const { error: membersError, count: membersCount } = await supabase
                .from('module3_team_members')
                .delete()
                .in('business_line_id', businessLineIds)
                .select('*', { count: 'exact', head: true });

            if (membersError) {
                console.error('Erreur suppression team_members:', membersError);
                throw membersError;
            }

            // Rafraîchir les données locales
            setTeamMembers([]);
            setCostEntries([]);
            setQualityDefectEntries([]);
            setOccupationalAccidentEntries([]);
            setDirectProductivityEntries([]);

            toast.success(
                `Toutes les données Module 3 ont été supprimées avec succès!`,
                { duration: 5000 }
            );

        } catch (error: unknown) {
            console.error('Erreur suppression données démo:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            toast.error(`Erreur lors de la suppression: ${errorMessage}`);
        } finally {
            setDeletingDemo(false);
        }
    };

    const selectedBusinessLineData = businessLines.find(bl => bl.id === selectedBusinessLine);
    const selectedKPIData = KPI_DEFINITIONS.find(kpi => kpi.id === selectedKPI);

    // Filtrer les membres selon l'équipe sélectionnée
    const filteredTeamMembers = useMemo(() => {
        if (selectedTeam === 'all') {
            return teamMembers;
        }
        return teamMembers.filter(member =>
            member.team_number === parseInt(selectedTeam)
        );
    }, [teamMembers, selectedTeam]);

    if (loading || isCompanyLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <HCMLoader text="Chargement des données..." />
            </div>
        );
    }

    return (
        <LaunchDateProvider companyId={companyId || ''}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">
                            HCM COST SAVINGS - Module 3
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent">
                        Contrôle des Indicateurs de Performance
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        2- Les données des coûts générés au quotidien par votre activité
                    </p>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-600 dark:text-green-400">
                        <Shield className="w-3 h-3" />
                        Secured access to 100% in ASP mode
                    </div>

                    {/* Boutons GENERATE DEMO et DELETE ALL DEMO DATA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-center"
                    >
                        <div className="flex flex-col items-center">
                            <Button
                                onClick={handleGenerateDemo}
                                disabled={generatingDemo || deletingDemo}
                                className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
                            >
                                {generatingDemo ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Wand2 className="w-5 h-5 mr-2" />
                                        </motion.div>
                                        Génération en cours...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5 mr-2" />
                                        GENERATE DEMO
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Génère des données réalistes
                            </p>
                        </div>

                        <div className="flex flex-col items-center">
                            <Button
                                onClick={handleDeleteAllDemoData}
                                disabled={deletingDemo || generatingDemo}
                                variant="destructive"
                                className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 hover:from-red-700 hover:via-red-800 hover:to-rose-900 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105"
                            >
                                {deletingDemo ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Trash2 className="w-5 h-5 mr-2" />
                                        </motion.div>
                                        Suppression en cours...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-5 h-5 mr-2" />
                                        DELETE ALL DEMO DATA
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-red-500 mt-2">
                                Supprime TOUTES les données Module 3
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Progress Steps */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-4"
                >
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                                currentStep >= step
                                    ? "bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/30"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {currentStep > step ? <Check className="w-5 h-5" /> : step}
                            </div>
                            {step < 3 && (
                                <div className={cn(
                                    "w-16 h-1 rounded-full transition-all duration-300",
                                    currentStep > step ? "bg-gradient-to-r from-primary to-purple-600" : "bg-muted"
                                )} />
                            )}
                        </div>
                    ))}
                </motion.div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    {/* Step 1: Selection */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-card/50 border-border backdrop-blur-xl shadow-2xl">
                                <CardHeader className="border-b border-border">
                                    <CardTitle className="text-xl text-foreground flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-primary" />
                                        Sélection du contexte
                                    </CardTitle>
                                    <CardDescription>
                                        Identifiez la ligne d'activité, l'équipe et la période d'analyse
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Business Line Select */}
                                        <div className="space-y-3">
                                            <Label className="text-foreground flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-primary" />
                                                Ligne d'activité
                                            </Label>
                                            <Select value={selectedBusinessLine} onValueChange={(value) => {
                                                    setSelectedBusinessLine(value);
                                                    fetchTeams(value); // Charger les équipes de cette ligne
                                                }}>
                                                <SelectTrigger className="h-12 bg-background border-input hover:border-primary/50 transition-colors">
                                                    <SelectValue placeholder="Sélectionnez une ligne" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {businessLines.map((line) => (
                                                        <SelectItem key={line.id} value={line.id}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{line.activity_name}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {line.staff_count} emp.
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedBusinessLineData && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {selectedBusinessLineData.team_leader && (
                                                        <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30">
                                                            <UserCircle className="w-3 h-3 mr-1" />
                                                            {selectedBusinessLineData.team_leader}
                                                        </Badge>
                                                    )}
                                                    {selectedBusinessLineData.team_mission && (
                                                        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">
                                                            <Target className="w-3 h-3 mr-1" />
                                                            {selectedBusinessLineData.team_mission}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Team Select */}
                                        <div className="space-y-3">
                                            <Label className="text-foreground flex items-center gap-2">
                                                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                Select your team
                                            </Label>
                                            <Select
                                                value={selectedTeam}
                                                onValueChange={setSelectedTeam}
                                                disabled={!selectedBusinessLine}
                                            >
                                                <SelectTrigger className="h-12 bg-background border-input hover:border-purple-500/50 transition-colors disabled:opacity-50">
                                                    <SelectValue placeholder="Sélectionnez une équipe" />
                                                </SelectTrigger>
                                                <SelectContent
                                                    position="popper"
                                                    sideOffset={5}
                                                    className="max-h-[300px] overflow-y-auto z-50"
                                                >
                                                    {/* Option "Toutes les équipes" */}
                                                    <SelectItem value="all">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            <span>Toutes les équipes</span>
                                                            {selectedBusinessLineData && (
                                                                <Badge variant="outline" className="text-xs ml-2">
                                                                    {teamMembers.length} membres
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </SelectItem>

                                                    {/* Liste des équipes depuis module3_teams avec nom du Team Leader */}
                                                    {teams.map((team) => (
                                                        <SelectItem key={team.id} value={team.team_number.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <UserCircle className="w-4 h-4" />
                                                                <span>
                                                                    {team.team_leader_name
                                                                        ? `Équipe de ${team.team_leader_name}`
                                                                        : `Équipe ${team.team_number}`
                                                                    }
                                                                </span>
                                                                <Badge variant="outline" className="text-xs ml-2">
                                                                    #{team.team_number}
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedBusinessLineData && filteredTeamMembers.length > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {filteredTeamMembers.length} employé(s) disponible(s) pour la saisie{selectedTeam !== 'all' && ` (Équipe ${selectedTeam})`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Period Selection - Calendrier visuel style Performance Calendar */}
                                    {companyId && (
                                        <WeekCalendarSelector
                                            companyId={companyId}
                                            businessLineId={selectedBusinessLine || undefined}
                                            onPeriodChange={(period: WeekSelection) => {
                                                setPeriodStart(period.periodStart);
                                                setPeriodEnd(period.periodEnd);
                                                // Tracker si la période est verrouillée
                                                setIsPeriodLocked(period.isLocked);
                                            }}
                                            selectedPeriod={periodStart && periodEnd ? {
                                                periodStart,
                                                periodEnd,
                                                weekNumber: 1,
                                                globalWeekNumber: 1,
                                                yearOffset: 1,
                                                isLocked: isPeriodLocked,
                                                hasData: false
                                            } : undefined}
                                        />
                                    )}

                                    {/* Avertissement si la période est verrouillée (Phase 3 - Style vert validé) */}
                                    {isPeriodLocked && periodStart && periodEnd && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3"
                                        >
                                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-800/30">
                                                <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                                                    Période validée et verrouillée
                                                    <Check className="w-4 h-4" />
                                                </h4>
                                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                    Les données de cette période ont été validées et verrouillées par le gestionnaire.
                                                    Vous pouvez consulter les données existantes en mode lecture seule.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(-1)}
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Retour
                                        </Button>
                                        <Button
                                            onClick={handleNextStep}
                                            disabled={!selectedBusinessLine || !periodStart || !periodEnd}
                                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground shadow-lg shadow-primary/25"
                                        >
                                            Suivant
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Step 2: KPI Selection */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-card/50 border-border backdrop-blur-xl shadow-2xl">
                                <CardHeader className="border-b border-border">
                                    <CardTitle className="text-xl text-foreground flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-primary" />
                                        Sélection de l'indicateur de performance
                                    </CardTitle>
                                    <CardDescription>
                                        Key Performance Indicators (Drivers of Economic Benefit)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {/* KPI Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                                        {KPI_DEFINITIONS.map((kpi, index) => (
                                            <motion.div
                                                key={kpi.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <button
                                                    onClick={() => handleKPISelect(kpi.id)}
                                                    aria-label={`Sélectionner l'indicateur ${kpi.nameFr}`}
                                                    className={cn(
                                                        "w-full h-full p-4 rounded-xl border-2 transition-all duration-300 text-left group focus:outline-none focus:ring-2 focus:ring-primary/50",
                                                        selectedKPI === kpi.id
                                                            ? `bg-gradient-to-br ${kpi.gradient} border-transparent shadow-lg`
                                                            : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all",
                                                        selectedKPI === kpi.id
                                                            ? "bg-white/20 text-white"
                                                            : cn(kpi.bgClass, kpi.textClass)
                                                    )}>
                                                        {kpi.icon}
                                                    </div>
                                                    <h3 className={cn(
                                                        "font-bold mb-1 transition-colors",
                                                        selectedKPI === kpi.id ? "text-white" : "text-foreground"
                                                    )}>
                                                        {kpi.nameFr}
                                                    </h3>
                                                    <p className={cn(
                                                        "text-xs mb-2 transition-colors",
                                                        selectedKPI === kpi.id ? "text-white/80" : "text-muted-foreground"
                                                    )}>
                                                        ({kpi.code})
                                                    </p>
                                                    <p className={cn(
                                                        "text-xs transition-colors line-clamp-2",
                                                        selectedKPI === kpi.id ? "text-white/70" : "text-muted-foreground/70"
                                                    )}>
                                                        {kpi.description}
                                                    </p>
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-between pt-4 border-t border-border">
                                        <Button
                                            variant="outline"
                                            onClick={handlePrevStep}
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Précédent
                                        </Button>
                                        <Button
                                            onClick={handleNextStep}
                                            disabled={!selectedKPI}
                                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground shadow-lg shadow-primary/25"
                                        >
                                            Suivant
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Step 3: Cost Data Entry */}
                    {currentStep === 3 && selectedKPIData && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-card/50 border-border backdrop-blur-xl shadow-2xl">
                                {/* Header conditionnel - pas pour QD, OA et DDP car ils ont leur propre header */}
                                {selectedKPI !== 'qd' && selectedKPI !== 'oa' && selectedKPI !== 'ddp' && (
                                    <CardHeader className={cn(
                                        "border-b border-border bg-gradient-to-r",
                                        selectedKPIData.gradient
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                                    {selectedKPIData.icon}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl text-white">
                                                        Contrôle de l'indicateur "{selectedKPIData.nameFr}"
                                                    </CardTitle>
                                                    <CardDescription className="text-white/70">
                                                        ({selectedKPIData.code}) - {selectedKPIData.name}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge className="bg-white/20 text-white border-white/30">
                                                {costEntries.length} entrée(s)
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                )}
                                <CardContent className="p-6 space-y-6">
                                    {/* QUALITY DEFECTS - Formulaire spécifique */}
                                    {selectedKPI === 'qd' ? (
                                        <QualityDefectsForm
                                            teamMembers={teamMembers}
                                            periodStart={periodStart}
                                            periodEnd={periodEnd}
                                            onAddEntry={handleAddQualityDefectEntry}
                                            entries={qualityDefectEntries}
                                            onRemoveEntry={handleRemoveQualityDefectEntry}
                                        />
                                    ) : selectedKPI === 'oa' ? (
                                        /* OCCUPATIONAL ACCIDENTS - Formulaire spécifique */
                                        <OccupationalAccidentForm
                                            teamMembers={teamMembers}
                                            periodStart={periodStart}
                                            periodEnd={periodEnd}
                                            onAddEntry={handleAddOccupationalAccidentEntry}
                                            entries={occupationalAccidentEntries}
                                            onRemoveEntry={handleRemoveOccupationalAccidentEntry}
                                        />
                                    ) : selectedKPI === 'ddp' ? (
                                        /* DIRECT PRODUCTIVITY - Formulaire spécifique */
                                        <DirectProductivityForm
                                            teamMembers={teamMembers}
                                            periodStart={periodStart}
                                            periodEnd={periodEnd}
                                            onAddEntry={handleAddDirectProductivityEntry}
                                            entries={directProductivityEntries}
                                            onRemoveEntry={handleRemoveDirectProductivityEntry}
                                        />
                                    ) : (
                                        <>
                                            {/* Entry Form - Standard pour autres KPIs */}
                                            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                                                <h3 className="text-foreground font-semibold flex items-center gap-2">
                                                    <UserCircle className="w-4 h-4 text-primary" />
                                                    Nouvelle entrée
                                                </h3>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {/* Employee - MISSION 3: Afficher Nom + tech_level */}
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground text-sm">1- Employé concerné</Label>
                                                        <Select
                                                            value={currentEntry.employeeId || ''}
                                                            onValueChange={(v) => setCurrentEntry({...currentEntry, employeeId: v})}
                                                        >
                                                            <SelectTrigger className="bg-background border-input">
                                                                <SelectValue placeholder="Sélectionner" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {teamMembers.map((member) => (
                                                                    <SelectItem key={member.id} value={member.id}>
                                                                        <div className="flex items-center gap-2">
                                                                            <span>{member.name}</span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn(
                                                                                    "text-xs",
                                                                                    member.tech_level === 'IA' && "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
                                                                                    member.tech_level === 'Cobot' && "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
                                                                                    member.tech_level === 'Autonomous' && "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
                                                                                    member.tech_level === 'Standard' && "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
                                                                                )}
                                                                            >
                                                                                {member.tech_level || 'Standard'}
                                                                            </Badge>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Date */}
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground text-sm">2- Date de l'événement</Label>
                                                        <Input
                                                            type="date"
                                                            value={currentEntry.date || ''}
                                                            onChange={(e) => setCurrentEntry({...currentEntry, date: e.target.value})}
                                                            className="bg-background border-input"
                                                        />
                                                    </div>

                                                    {/* Duration */}
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground text-sm flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Durée (heures:minutes)
                                                        </Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="24"
                                                                placeholder="H"
                                                                value={currentEntry.hours || ''}
                                                                onChange={(e) => setCurrentEntry({...currentEntry, hours: parseInt(e.target.value) || 0})}
                                                                className="bg-background border-input w-16"
                                                            />
                                                            <span className="text-muted-foreground self-center">:</span>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="59"
                                                                placeholder="M"
                                                                value={currentEntry.minutes || ''}
                                                                onChange={(e) => setCurrentEntry({...currentEntry, minutes: parseInt(e.target.value) || 0})}
                                                                className="bg-background border-input w-16"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Compensation */}
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground text-sm flex items-center gap-1">
                                                            <DollarSign className="w-3 h-3" />
                                                            3- Compensations payées
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="ex: 23"
                                                            value={currentEntry.compensation || ''}
                                                            onChange={(e) => setCurrentEntry({...currentEntry, compensation: parseFloat(e.target.value) || 0})}
                                                            className="bg-background border-input"
                                                        />
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={handleAddEntry}
                                                    disabled={!currentEntry.employeeId || !currentEntry.date}
                                                    className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                                >
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Ajouter cette entrée
                                                </Button>
                                            </div>

                                            {/* Entries List with Counter */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-foreground font-semibold">Entrées enregistrées</h3>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={cn(
                                                            "text-sm px-3 py-1",
                                                            costEntries.length > 0
                                                                ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
                                                                : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {costEntries.length} entrée(s)
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {costEntries.length === 0 ? (
                                                    <div className="p-6 rounded-lg border border-dashed border-border bg-muted/30 text-center">
                                                        <UserCircle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                                                        <p className="text-muted-foreground text-sm">
                                                            Aucune entrée pour le moment
                                                        </p>
                                                        <p className="text-muted-foreground/70 text-xs mt-1">
                                                            Ajoutez les événements survenus pendant la période du {periodStart} au {periodEnd}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {costEntries.map((entry, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground text-sm font-bold">
                                                                        {index + 1}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-foreground font-medium">{entry.employeeName}</p>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn(
                                                                                    "text-xs",
                                                                                    entry.employeeTechLevel === 'IA' && "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
                                                                                    entry.employeeTechLevel === 'Cobot' && "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
                                                                                    entry.employeeTechLevel === 'Autonomous' && "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
                                                                                    entry.employeeTechLevel === 'Standard' && "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
                                                                                )}
                                                                            >
                                                                                {entry.employeeTechLevel}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-muted-foreground text-sm">
                                                                            {entry.date} • {entry.hours}h{entry.minutes.toString().padStart(2, '0')}m • {entry.compensation}€
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setCostEntries(costEntries.filter((_, i) => i !== index))}
                                                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10"
                                                                >
                                                                    Supprimer
                                                                </Button>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-4 justify-between pt-4 border-t border-border">
                                        <Button
                                            variant="outline"
                                            onClick={handlePrevStep}
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Changer d'indicateur
                                        </Button>

                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setCostEntries([]);
                                                    setCurrentEntry({});
                                                    setQualityDefectEntries([]);
                                                    setOccupationalAccidentEntries([]);
                                                    setDirectProductivityEntries([]);
                                                }}
                                            >
                                                Réinitialiser
                                            </Button>
                                            <Button
                                                onClick={handleSaveAll}
                                                disabled={
                                                    (selectedKPI === 'qd'
                                                        ? qualityDefectEntries.length === 0
                                                        : selectedKPI === 'oa'
                                                            ? occupationalAccidentEntries.length === 0
                                                            : selectedKPI === 'ddp'
                                                                ? directProductivityEntries.length === 0
                                                                : costEntries.length === 0) || saving
                                                }
                                                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground shadow-lg shadow-primary/25"
                                            >
                                                {saving ? 'Sauvegarde...' : 'Sauvegarder et terminer'}
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
        </LaunchDateProvider>
    );
}
