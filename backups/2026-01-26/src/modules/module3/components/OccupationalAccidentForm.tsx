import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Check, Calendar, Clock, DollarSign,
    Sparkles, AlertOctagon, ShieldAlert, ShieldCheck,
    ShieldQuestion, Shield, ShieldX, UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Niveaux de responsabilité avec design futuriste
const RESPONSIBILITY_LEVELS = [
    {
        id: 'none',
        level: 0,
        name: 'Aucune responsabilité',
        nameEn: 'No responsible at all',
        description: 'L\'employé n\'est pas responsable de l\'accident',
        icon: ShieldCheck,
        gradient: 'from-emerald-500 to-green-600',
        bgClass: 'bg-emerald-500/20',
        borderClass: 'border-emerald-500/50',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        ringColor: 'ring-emerald-500/50'
    },
    {
        id: 'little',
        level: 1,
        name: 'Légèrement responsable',
        nameEn: 'A little bit responsible',
        description: 'Responsabilité mineure dans l\'incident',
        icon: Shield,
        gradient: 'from-teal-500 to-cyan-600',
        bgClass: 'bg-teal-500/20',
        borderClass: 'border-teal-500/50',
        textClass: 'text-teal-600 dark:text-teal-400',
        ringColor: 'ring-teal-500/50'
    },
    {
        id: 'insufficient',
        level: 2,
        name: 'Insuffisamment responsable',
        nameEn: 'Insufficiently responsible',
        description: 'Responsabilité partielle faible',
        icon: ShieldQuestion,
        gradient: 'from-blue-500 to-indigo-600',
        bgClass: 'bg-blue-500/20',
        borderClass: 'border-blue-500/50',
        textClass: 'text-blue-600 dark:text-blue-400',
        ringColor: 'ring-blue-500/50'
    },
    {
        id: 'average',
        level: 3,
        name: 'Moyennement responsable',
        nameEn: 'Averagely responsible',
        description: 'Responsabilité partagée équitablement',
        icon: ShieldAlert,
        gradient: 'from-amber-500 to-orange-600',
        bgClass: 'bg-amber-500/20',
        borderClass: 'border-amber-500/50',
        textClass: 'text-amber-600 dark:text-amber-400',
        ringColor: 'ring-amber-500/50'
    },
    {
        id: 'partial',
        level: 4,
        name: 'Partiellement responsable',
        nameEn: 'Partially responsible',
        description: 'Responsabilité significative',
        icon: AlertOctagon,
        gradient: 'from-orange-500 to-red-600',
        bgClass: 'bg-orange-500/20',
        borderClass: 'border-orange-500/50',
        textClass: 'text-orange-600 dark:text-orange-400',
        ringColor: 'ring-orange-500/50'
    },
    {
        id: 'total',
        level: 5,
        name: 'Totalement responsable',
        nameEn: 'Totally responsible',
        description: 'Responsabilité complète de l\'employé',
        icon: ShieldX,
        gradient: 'from-red-500 to-rose-600',
        bgClass: 'bg-red-500/20',
        borderClass: 'border-red-500/50',
        textClass: 'text-red-600 dark:text-red-400',
        ringColor: 'ring-red-500/50'
    }
];

interface OccupationalAccidentEntry {
    id: string;
    responsibilityLevel: string;
    responsibilityName: string;
    date: string;
    hours: number;
    minutes: number;
    compensation: number;
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

interface OccupationalAccidentFormProps {
    teamMembers: TeamMember[];
    periodStart: string;
    periodEnd: string;
    onAddEntry: (entry: OccupationalAccidentEntry) => void;
    entries: OccupationalAccidentEntry[];
    onRemoveEntry: (index: number) => void;
}

export function OccupationalAccidentForm({
    teamMembers,
    periodStart,
    periodEnd,
    onAddEntry,
    entries,
    onRemoveEntry
}: OccupationalAccidentFormProps) {
    const [selectedResponsibility, setSelectedResponsibility] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [date, setDate] = useState('');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [compensation, setCompensation] = useState(0);

    const handleResponsibilitySelect = (levelId: string) => {
        setSelectedResponsibility(levelId);
    };

    const handleSubmit = () => {
        if (!selectedResponsibility) {
            toast.error("Sélectionnez un niveau de responsabilité");
            return;
        }
        if (!selectedEmployee) {
            toast.error("Sélectionnez un employé");
            return;
        }
        if (!date) {
            toast.error("Sélectionnez une date");
            return;
        }

        // Validation de la date dans la période
        const entryDate = new Date(date);
        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        if (entryDate < startDate || entryDate > endDate) {
            toast.error(`La date doit être entre ${periodStart} et ${periodEnd}`);
            return;
        }

        const employee = teamMembers.find(m => m.id === selectedEmployee);
        const responsibility = RESPONSIBILITY_LEVELS.find(r => r.id === selectedResponsibility);

        onAddEntry({
            id: crypto.randomUUID(),
            responsibilityLevel: selectedResponsibility,
            responsibilityName: responsibility?.name || '',
            date,
            hours,
            minutes,
            compensation,
            employeeId: selectedEmployee,
            employeeName: employee?.name || '',
            employeeTechLevel: employee?.tech_level || 'Standard'
        });

        // Reset form
        setSelectedResponsibility(null);
        setSelectedEmployee('');
        setDate('');
        setHours(0);
        setMinutes(0);
        setCompensation(0);

        toast.success(`Accident de travail enregistré pour ${employee?.name}`);
    };

    const selectedResponsibilityData = RESPONSIBILITY_LEVELS.find(r => r.id === selectedResponsibility);

    return (
        <div className="space-y-6">
            {/* Header avec effet gradient - Style Zap/Danger */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-red-600 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />

                {/* Animated warning pulse */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-2 right-2 w-20 h-20 rounded-full bg-yellow-400/20 blur-xl"
                />

                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Contrôle des Accidents de Travail
                            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        </h3>
                        <p className="text-white/80 text-sm">
                            Évaluez le niveau de responsabilité et l'impact financier
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 2: Niveau de responsabilité - Cards futuristes */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-400 font-bold text-sm">2</span>
                    </div>
                    <Label className="text-foreground font-semibold text-base">
                        Selon votre perception, sélectionnez le niveau de responsabilité de l'employé
                    </Label>
                </div>

                {/* Responsibility Level Cards - Grid futuriste */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {RESPONSIBILITY_LEVELS.map((level, index) => {
                        const isSelected = selectedResponsibility === level.id;
                        const Icon = level.icon;

                        return (
                            <motion.button
                                key={level.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08 }}
                                onClick={() => handleResponsibilitySelect(level.id)}
                                className={cn(
                                    "relative p-4 rounded-xl border-2 transition-all duration-300 text-left group",
                                    "focus:outline-none focus:ring-2",
                                    level.ringColor,
                                    isSelected
                                        ? `bg-gradient-to-br ${level.gradient} border-transparent shadow-lg scale-105`
                                        : "bg-card border-border hover:border-primary/30 hover:bg-muted/50"
                                )}
                            >
                                {/* Level indicator badge */}
                                <div className={cn(
                                    "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                    isSelected
                                        ? "bg-white/30 text-white"
                                        : cn(level.bgClass, level.textClass)
                                )}>
                                    {level.level}
                                </div>

                                {/* Selection checkmark */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center"
                                        >
                                            <Check className="w-4 h-4 text-green-600" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all",
                                    isSelected
                                        ? "bg-white/20 text-white"
                                        : cn(level.bgClass, level.textClass)
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                <h4 className={cn(
                                    "font-semibold text-sm transition-colors leading-tight",
                                    isSelected ? "text-white" : "text-foreground"
                                )}>
                                    {level.name}
                                </h4>
                                <p className={cn(
                                    "text-xs mt-1 transition-colors line-clamp-2",
                                    isSelected ? "text-white/70" : "text-muted-foreground"
                                )}>
                                    {level.description}
                                </p>

                                {/* Hover/Selection bar */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: isSelected ? '100%' : '0%' }}
                                    className={cn(
                                        "absolute bottom-0 left-0 h-1 rounded-b-xl bg-white/50"
                                    )}
                                />
                            </motion.button>
                        );
                    })}
                </div>

                {/* Selected responsibility summary */}
                {selectedResponsibilityData && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center gap-3 pt-3 border-t border-border mt-4"
                    >
                        <span className="text-sm text-muted-foreground">Sélectionné:</span>
                        <Badge
                            className={cn(
                                "text-sm px-3 py-1",
                                selectedResponsibilityData.bgClass,
                                selectedResponsibilityData.textClass,
                                selectedResponsibilityData.borderClass
                            )}
                        >
                            <selectedResponsibilityData.icon className="w-4 h-4 mr-2" />
                            {selectedResponsibilityData.name}
                        </Badge>
                    </motion.div>
                )}
            </div>

            {/* Section 3: Employé, Date et heure de l'accident */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-400 font-bold text-sm">3</span>
                    </div>
                    <Label className="text-foreground font-semibold text-base">
                        Indiquez le jour et l'heure de régulation de l'accident de travail
                    </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Employé */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm flex items-center gap-1">
                            <UserX className="w-3 h-3" />
                            Employé concerné
                        </Label>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
                        <Label className="text-muted-foreground text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Date de l'accident
                        </Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={periodStart}
                            max={periodEnd}
                            className="bg-background border-input"
                        />
                    </div>

                    {/* Durée de régulation */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Durée de régulation
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="0"
                                max="24"
                                placeholder="H"
                                value={hours || ''}
                                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                                className="bg-background border-input w-16 text-center"
                            />
                            <span className="text-muted-foreground font-bold">:</span>
                            <Input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="M"
                                value={minutes || ''}
                                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                                className="bg-background border-input w-16 text-center"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Coûts */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-400 font-bold text-sm">4</span>
                    </div>
                    <Label className="text-foreground font-semibold text-base">
                        Indiquez les dépenses des opérations allouées à cette action
                    </Label>
                </div>

                <div className="max-w-xs">
                    <Label className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
                        <DollarSign className="w-3 h-3" />
                        Montant des dépenses (€)
                    </Label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="ex: 23"
                        value={compensation || ''}
                        onChange={(e) => setCompensation(parseFloat(e.target.value) || 0)}
                        className="bg-background border-input"
                    />
                </div>
            </div>

            {/* Bouton d'ajout */}
            <Button
                onClick={handleSubmit}
                disabled={!selectedResponsibility || !selectedEmployee || !date}
                className="w-full md:w-auto bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-lg shadow-red-500/25"
            >
                <Check className="w-4 h-4 mr-2" />
                Ajouter cet accident de travail
            </Button>

            {/* Liste des entrées */}
            {entries.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <h4 className="text-foreground font-semibold">Accidents enregistrés</h4>
                        <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">
                            {entries.length} entrée(s)
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        {entries.map((entry, index) => {
                            const responsibilityData = RESPONSIBILITY_LEVELS.find(r => r.id === entry.responsibilityLevel);
                            const ResponsibilityIcon = responsibilityData?.icon || Shield;

                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold">
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
                                            <div className="flex items-center gap-2 mt-1">
                                                {responsibilityData && (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-xs",
                                                            responsibilityData.bgClass,
                                                            responsibilityData.textClass
                                                        )}
                                                    >
                                                        <ResponsibilityIcon className="w-3 h-3 mr-1" />
                                                        {responsibilityData.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                {entry.date} • {entry.hours}h{entry.minutes.toString().padStart(2, '0')}m • {entry.compensation}€
                                            </p>
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
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default OccupationalAccidentForm;
export { RESPONSIBILITY_LEVELS };
export type { OccupationalAccidentEntry };
