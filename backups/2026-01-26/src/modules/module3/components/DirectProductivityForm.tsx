import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Check, Calendar, Clock, DollarSign,
    Sparkles, TrendingUp, TrendingDown, CalendarDays,
    Timer, PiggyBank, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Jours de la semaine avec design futuriste
const WEEKDAYS = [
    {
        id: 'monday',
        name: 'Lundi',
        nameEn: 'Monday',
        shortName: 'Lun',
        gradient: 'from-blue-500 to-indigo-600',
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-600 dark:text-blue-400'
    },
    {
        id: 'tuesday',
        name: 'Mardi',
        nameEn: 'Tuesday',
        shortName: 'Mar',
        gradient: 'from-cyan-500 to-teal-600',
        bgClass: 'bg-cyan-500/20',
        textClass: 'text-cyan-600 dark:text-cyan-400'
    },
    {
        id: 'wednesday',
        name: 'Mercredi',
        nameEn: 'Wednesday',
        shortName: 'Mer',
        gradient: 'from-emerald-500 to-green-600',
        bgClass: 'bg-emerald-500/20',
        textClass: 'text-emerald-600 dark:text-emerald-400'
    },
    {
        id: 'thursday',
        name: 'Jeudi',
        nameEn: 'Thursday',
        shortName: 'Jeu',
        gradient: 'from-amber-500 to-orange-600',
        bgClass: 'bg-amber-500/20',
        textClass: 'text-amber-600 dark:text-amber-400'
    },
    {
        id: 'friday',
        name: 'Vendredi',
        nameEn: 'Friday',
        shortName: 'Ven',
        gradient: 'from-orange-500 to-red-600',
        bgClass: 'bg-orange-500/20',
        textClass: 'text-orange-600 dark:text-orange-400'
    },
    {
        id: 'saturday',
        name: 'Samedi',
        nameEn: 'Saturday',
        shortName: 'Sam',
        gradient: 'from-purple-500 to-violet-600',
        bgClass: 'bg-purple-500/20',
        textClass: 'text-purple-600 dark:text-purple-400'
    },
    {
        id: 'sunday',
        name: 'Dimanche',
        nameEn: 'Sunday',
        shortName: 'Dim',
        gradient: 'from-pink-500 to-rose-600',
        bgClass: 'bg-pink-500/20',
        textClass: 'text-pink-600 dark:text-pink-400'
    }
];

interface DirectProductivityEntry {
    id: string;
    selectedDays: string[];
    plannedTimeHours: number;
    plannedTimeMinutes: number;
    recoveredTimeHours: number;
    recoveredTimeMinutes: number;
    lostTimeHours: number;        // Temps utilisé en plus (perte)
    lostTimeMinutes: number;      // Temps utilisé en plus (perte)
    plannedExpenses: number;
    savedExpenses: number;
    excessExpenses: number;       // Dépenses en trop (perte)
    employeeId: string;
    employeeName: string;
    employeeTechLevel: string;
}

interface TeamMember {
    id: string;
    name: string;
    professional_category: string;
    tech_level: string;
}

interface DirectProductivityFormProps {
    teamMembers: TeamMember[];
    periodStart: string;
    periodEnd: string;
    onAddEntry: (entry: DirectProductivityEntry) => void;
    entries: DirectProductivityEntry[];
    onRemoveEntry: (index: number) => void;
}

export function DirectProductivityForm({
    teamMembers,
    periodStart,
    periodEnd,
    onAddEntry,
    entries,
    onRemoveEntry
}: DirectProductivityFormProps) {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [plannedTimeHours, setPlannedTimeHours] = useState(0);
    const [plannedTimeMinutes, setPlannedTimeMinutes] = useState(0);
    const [recoveredTimeHours, setRecoveredTimeHours] = useState(0);
    const [recoveredTimeMinutes, setRecoveredTimeMinutes] = useState(0);
    const [plannedExpenses, setPlannedExpenses] = useState(0);
    const [savedExpenses, setSavedExpenses] = useState(0);

    // Nouveaux états pour les choix conditionnels et les pertes
    const [timeChoiceType, setTimeChoiceType] = useState<'less' | 'more' | null>(null);
    const [expenseChoiceType, setExpenseChoiceType] = useState<'less' | 'more' | null>(null);
    const [lostTimeHours, setLostTimeHours] = useState(0);
    const [lostTimeMinutes, setLostTimeMinutes] = useState(0);
    const [excessExpenses, setExcessExpenses] = useState(0);

    const handleDayToggle = (dayId: string) => {
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(id => id !== dayId)
                : [...prev, dayId]
        );
    };

    const handleSubmit = () => {
        if (selectedDays.length === 0) {
            toast.error("Sélectionnez au moins un jour");
            return;
        }
        if (!selectedEmployee) {
            toast.error("Sélectionnez un employé");
            return;
        }
        if (plannedTimeHours === 0 && plannedTimeMinutes === 0) {
            toast.error("Le temps planifié ne peut pas être 0");
            return;
        }

        const employee = teamMembers.find(m => m.id === selectedEmployee);

        onAddEntry({
            id: crypto.randomUUID(),
            selectedDays,
            plannedTimeHours,
            plannedTimeMinutes,
            recoveredTimeHours,
            recoveredTimeMinutes,
            lostTimeHours,
            lostTimeMinutes,
            plannedExpenses,
            savedExpenses,
            excessExpenses,
            employeeId: selectedEmployee,
            employeeName: employee?.name || '',
            employeeTechLevel: employee?.tech_level || 'Standard'
        });

        // Reset form
        setSelectedDays([]);
        setSelectedEmployee('');
        setPlannedTimeHours(0);
        setPlannedTimeMinutes(0);
        setRecoveredTimeHours(0);
        setRecoveredTimeMinutes(0);
        setLostTimeHours(0);
        setLostTimeMinutes(0);
        setPlannedExpenses(0);
        setSavedExpenses(0);
        setExcessExpenses(0);
        setTimeChoiceType(null);
        setExpenseChoiceType(null);

        toast.success(`Écart de productivité enregistré pour ${employee?.name}`);
    };

    // Calcul du gain de productivité
    const totalPlannedMinutes = plannedTimeHours * 60 + plannedTimeMinutes;
    const totalRecoveredMinutes = recoveredTimeHours * 60 + recoveredTimeMinutes;
    const productivityGain = totalPlannedMinutes > 0
        ? Math.round((totalRecoveredMinutes / totalPlannedMinutes) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header avec effet gradient - Style Target/Performance */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />

                {/* Animated performance indicator */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-2 right-2 w-16 h-16 rounded-full border-4 border-white/20 border-t-white/60"
                />

                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Target className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Contrôle des Écarts de Productivité Directe
                            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        </h3>
                        <p className="text-white/80 text-sm">
                            Mesurez les gains de temps et les économies réalisées
                        </p>
                    </div>
                </div>

                {/* Real-time productivity gauge */}
                {(plannedTimeHours > 0 || plannedTimeMinutes > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-between text-white text-sm">
                            <span>Gain de productivité</span>
                            <span className="font-bold text-lg">{productivityGain}%</span>
                        </div>
                        <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(productivityGain, 100)}%` }}
                                className={cn(
                                    "h-full rounded-full",
                                    productivityGain >= 80 ? "bg-emerald-400" :
                                    productivityGain >= 50 ? "bg-amber-400" :
                                    "bg-red-400"
                                )}
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Section 2: Sélection des jours */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <span className="text-violet-600 dark:text-violet-400 font-bold text-sm">2</span>
                    </div>
                    <Label className="text-foreground font-semibold text-base">
                        Sélectionnez un ou plusieurs jours
                    </Label>
                </div>

                {/* Weekday selector - Circular cards */}
                <div className="flex flex-wrap gap-3 justify-center">
                    {WEEKDAYS.map((day, index) => {
                        const isSelected = selectedDays.includes(day.id);

                        return (
                            <motion.button
                                key={day.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleDayToggle(day.id)}
                                className={cn(
                                    "relative w-16 h-16 rounded-full border-2 transition-all duration-300",
                                    "flex flex-col items-center justify-center",
                                    "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
                                    isSelected
                                        ? `bg-gradient-to-br ${day.gradient} border-transparent shadow-lg scale-110`
                                        : "bg-card border-border hover:border-primary/30 hover:bg-muted/50"
                                )}
                            >
                                {/* Selection checkmark */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-lg flex items-center justify-center"
                                        >
                                            <Check className="w-3 h-3 text-green-600" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <CalendarDays className={cn(
                                    "w-5 h-5 mb-1 transition-colors",
                                    isSelected ? "text-white" : day.textClass
                                )} />
                                <span className={cn(
                                    "text-xs font-semibold transition-colors",
                                    isSelected ? "text-white" : "text-foreground"
                                )}>
                                    {day.shortName}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Selected days summary */}
                {selectedDays.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-wrap gap-2 pt-3 border-t border-border mt-4 justify-center"
                    >
                        <span className="text-sm text-muted-foreground">Jours sélectionnés:</span>
                        {selectedDays.map(id => {
                            const day = WEEKDAYS.find(d => d.id === id);
                            return day ? (
                                <Badge
                                    key={id}
                                    className={cn("text-xs", day.bgClass, day.textClass)}
                                >
                                    {day.name}
                                </Badge>
                            ) : null;
                        })}
                    </motion.div>
                )}
            </div>

            {/* Section 3 & 4: Temps planifié et récupéré */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-6">
                {/* Section 3: Temps planifié */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <span className="text-violet-600 dark:text-violet-400 font-bold text-sm">3</span>
                        </div>
                        <Label className="text-foreground font-semibold text-base">
                            Quel est le Temps opérationnel planifié de la tâche ? (heures:minutes)
                        </Label>
                    </div>

                    <div className="flex items-center gap-3 max-w-xs">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <Input
                            type="number"
                            min="0"
                            max="99"
                            placeholder="H"
                            value={plannedTimeHours || ''}
                            onChange={(e) => setPlannedTimeHours(parseInt(e.target.value) || 0)}
                            className="bg-background border-input w-20 text-center text-lg"
                        />
                        <span className="text-2xl text-muted-foreground font-bold">:</span>
                        <Input
                            type="number"
                            min="0"
                            max="59"
                            placeholder="M"
                            value={plannedTimeMinutes || ''}
                            onChange={(e) => setPlannedTimeMinutes(parseInt(e.target.value) || 0)}
                            className="bg-background border-input w-20 text-center text-lg"
                        />
                        <span className="text-sm text-muted-foreground">(ex: 35:00)</span>
                    </div>
                </div>

                {/* Section 4: Choix temps réalisé */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <span className="text-violet-600 dark:text-violet-400 font-bold text-sm">4</span>
                        </div>
                        <Label className="text-foreground font-semibold text-base">
                            Quel est le temps opérationnel réalisé ?
                        </Label>
                    </div>

                    {/* Select pour le choix temps */}
                    <Select
                        value={timeChoiceType || ''}
                        onValueChange={(value) => {
                            setTimeChoiceType(value as 'less' | 'more');
                            // Reset les deux champs quand on change de choix
                            setRecoveredTimeHours(0);
                            setRecoveredTimeMinutes(0);
                            setLostTimeHours(0);
                            setLostTimeMinutes(0);
                        }}
                    >
                        <SelectTrigger className="bg-background border-input max-w-lg">
                            <SelectValue placeholder="Sélectionnez une option..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="less">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    <span>Le salarié a-t-il réalisé la tâche en moins de temps ?</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="more">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                    <span>Le salarié a-t-il réalisé la tâche avec plus de temps que prévu ?</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Affichage conditionnel - Temps récupéré (gain) */}
                    <AnimatePresence>
                        {timeChoiceType === 'less' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                            >
                                <Label className="text-emerald-700 dark:text-emerald-400 font-medium mb-3 block">
                                    Temps récupéré et alloué aux autres tâches (heures:minutes)
                                </Label>
                                <div className="flex items-center gap-3 max-w-xs">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="99"
                                        placeholder="H"
                                        value={recoveredTimeHours || ''}
                                        onChange={(e) => setRecoveredTimeHours(parseInt(e.target.value) || 0)}
                                        className="bg-background border-emerald-500/30 w-20 text-center text-lg"
                                    />
                                    <span className="text-2xl text-muted-foreground font-bold">:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="59"
                                        placeholder="M"
                                        value={recoveredTimeMinutes || ''}
                                        onChange={(e) => setRecoveredTimeMinutes(parseInt(e.target.value) || 0)}
                                        className="bg-background border-emerald-500/30 w-20 text-center text-lg"
                                    />
                                    <span className="text-sm text-muted-foreground">(ex: 00:45)</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Affichage conditionnel - Temps perdu (perte) */}
                    <AnimatePresence>
                        {timeChoiceType === 'more' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                            >
                                <Label className="text-red-700 dark:text-red-400 font-medium mb-3 block">
                                    Temps utilisé en plus pour réaliser la tâche (heures:minutes)
                                </Label>
                                <div className="flex items-center gap-3 max-w-xs">
                                    <div className="p-2 rounded-lg bg-red-500/20">
                                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="99"
                                        placeholder="H"
                                        value={lostTimeHours || ''}
                                        onChange={(e) => setLostTimeHours(parseInt(e.target.value) || 0)}
                                        className="bg-background border-red-500/30 w-20 text-center text-lg"
                                    />
                                    <span className="text-2xl text-muted-foreground font-bold">:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="59"
                                        placeholder="M"
                                        value={lostTimeMinutes || ''}
                                        onChange={(e) => setLostTimeMinutes(parseInt(e.target.value) || 0)}
                                        className="bg-background border-red-500/30 w-20 text-center text-lg"
                                    />
                                    <span className="text-sm text-muted-foreground">(ex: 01:30)</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Section 5 & 6: Dépenses planifiées et réalisées */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-6">
                {/* Section 5: Dépenses planifiées */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <span className="text-violet-600 dark:text-violet-400 font-bold text-sm">5</span>
                        </div>
                        <Label className="text-foreground font-semibold text-base">
                            Quelle est la dépense opérationnelle prévue pour la tâche ?
                        </Label>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="ex: 250"
                            value={plannedExpenses || ''}
                            onChange={(e) => setPlannedExpenses(parseFloat(e.target.value) || 0)}
                            className="bg-background border-input max-w-[150px]"
                        />
                        <span className="text-sm text-muted-foreground">€</span>
                    </div>
                </div>

                {/* Section 6: Choix dépenses réalisées */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <span className="text-violet-600 dark:text-violet-400 font-bold text-sm">6</span>
                        </div>
                        <Label className="text-foreground font-semibold text-base">
                            Quelle est la dépense opérationnelle réalisée ?
                        </Label>
                    </div>

                    {/* Select pour le choix dépenses */}
                    <Select
                        value={expenseChoiceType || ''}
                        onValueChange={(value) => {
                            setExpenseChoiceType(value as 'less' | 'more');
                            // Reset les deux champs quand on change de choix
                            setSavedExpenses(0);
                            setExcessExpenses(0);
                        }}
                    >
                        <SelectTrigger className="bg-background border-input max-w-lg">
                            <SelectValue placeholder="Sélectionnez une option..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="less">
                                <div className="flex items-center gap-2">
                                    <PiggyBank className="w-4 h-4 text-emerald-500" />
                                    <span>Le salarié a-t-il dépensé moins que la somme prévue ?</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="more">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                    <span>Le salarié a-t-il dépensé plus que la somme prévue ?</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Affichage conditionnel - Dépenses économisées (gain) */}
                    <AnimatePresence>
                        {expenseChoiceType === 'less' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                            >
                                <Label className="text-emerald-700 dark:text-emerald-400 font-medium mb-3 block">
                                    Dépenses économisées
                                </Label>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="ex: 23"
                                        value={savedExpenses || ''}
                                        onChange={(e) => setSavedExpenses(parseFloat(e.target.value) || 0)}
                                        className="bg-background border-emerald-500/30 max-w-[150px]"
                                    />
                                    <span className="text-sm text-emerald-600 dark:text-emerald-400">€</span>
                                </div>
                                {/* Indicateur taux d'économie */}
                                {plannedExpenses > 0 && savedExpenses > 0 && (
                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-emerald-700 dark:text-emerald-400">Taux d'économie</span>
                                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                            {Math.round((savedExpenses / plannedExpenses) * 100)}%
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Affichage conditionnel - Dépenses en trop (perte) */}
                    <AnimatePresence>
                        {expenseChoiceType === 'more' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                            >
                                <Label className="text-red-700 dark:text-red-400 font-medium mb-3 block">
                                    Le montant de la somme dépensée en plus pour réaliser la tâche
                                </Label>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/20">
                                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="ex: 150"
                                        value={excessExpenses || ''}
                                        onChange={(e) => setExcessExpenses(parseFloat(e.target.value) || 0)}
                                        className="bg-background border-red-500/30 max-w-[150px]"
                                    />
                                    <span className="text-sm text-red-600 dark:text-red-400">€</span>
                                </div>
                                {/* Indicateur taux de dépassement */}
                                {plannedExpenses > 0 && excessExpenses > 0 && (
                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-red-700 dark:text-red-400">Taux de dépassement</span>
                                        <span className="text-red-700 dark:text-red-400 font-bold">
                                            +{Math.round((excessExpenses / plannedExpenses) * 100)}%
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Employé selector */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <span className="text-violet-600 dark:text-violet-400 font-bold text-sm">1</span>
                    </div>
                    <Label className="text-foreground font-semibold text-base">
                        Employé concerné
                    </Label>
                </div>

                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="bg-background border-input max-w-md">
                        <SelectValue placeholder="Sélectionner un employé" />
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

            {/* Bouton d'ajout */}
            <Button
                onClick={handleSubmit}
                disabled={selectedDays.length === 0 || !selectedEmployee || (plannedTimeHours === 0 && plannedTimeMinutes === 0)}
                className="w-full md:w-auto bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
            >
                <Check className="w-4 h-4 mr-2" />
                Ajouter cet écart de productivité
            </Button>

            {/* Liste des entrées */}
            {entries.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <h4 className="text-foreground font-semibold">Écarts de productivité enregistrés</h4>
                        <Badge className="bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30">
                            {entries.length} entrée(s)
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        {entries.map((entry, index) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-foreground font-medium">{entry.employeeName}</span>
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
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {entry.selectedDays.map(dayId => {
                                                const day = WEEKDAYS.find(d => d.id === dayId);
                                                return day ? (
                                                    <Badge
                                                        key={dayId}
                                                        variant="outline"
                                                        className={cn("text-xs", day.bgClass, day.textClass)}
                                                    >
                                                        {day.shortName}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                        <div className="text-sm mt-1 space-y-1">
                                            <p className="text-muted-foreground">
                                                Planifié: {entry.plannedTimeHours}h{entry.plannedTimeMinutes.toString().padStart(2, '0')}
                                                {(entry.recoveredTimeHours > 0 || entry.recoveredTimeMinutes > 0) && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                                                        • Récupéré: {entry.recoveredTimeHours}h{entry.recoveredTimeMinutes.toString().padStart(2, '0')}
                                                    </span>
                                                )}
                                                {(entry.lostTimeHours > 0 || entry.lostTimeMinutes > 0) && (
                                                    <span className="text-red-600 dark:text-red-400 ml-2">
                                                        • Perdu: {entry.lostTimeHours}h{entry.lostTimeMinutes.toString().padStart(2, '0')}
                                                    </span>
                                                )}
                                            </p>
                                            {entry.plannedExpenses > 0 && (
                                                <p className="text-muted-foreground">
                                                    Budget: {entry.plannedExpenses}€
                                                    {entry.savedExpenses > 0 && (
                                                        <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                                                            • Économisé: {entry.savedExpenses}€
                                                        </span>
                                                    )}
                                                    {entry.excessExpenses > 0 && (
                                                        <span className="text-red-600 dark:text-red-400 ml-2">
                                                            • Dépassement: +{entry.excessExpenses}€
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemoveEntry(index)}
                                    className="text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                >
                                    Supprimer
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DirectProductivityForm;
export { WEEKDAYS };
export type { DirectProductivityEntry };
