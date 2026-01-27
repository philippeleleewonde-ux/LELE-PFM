import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Check, Wrench, Trash2, RotateCcw,
    PackageX, Undo2, HelpCircle, Calendar, Clock, DollarSign,
    Sparkles, Shield, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types de défauts qualité avec leurs icônes et couleurs
const DEFECT_TYPES = [
    {
        id: 'retouch',
        name: 'Retouches',
        nameEn: 'Retouch',
        description: 'Corrections mineures sur le produit',
        icon: Wrench,
        gradient: 'from-amber-500 to-orange-600',
        bgClass: 'bg-amber-500/20',
        borderClass: 'border-amber-500/50',
        textClass: 'text-amber-600 dark:text-amber-400'
    },
    {
        id: 'rubbish',
        name: 'Rebuts',
        nameEn: 'Rubbishes',
        description: 'Produits mis au rebut',
        icon: Trash2,
        gradient: 'from-red-500 to-rose-600',
        bgClass: 'bg-red-500/20',
        borderClass: 'border-red-500/50',
        textClass: 'text-red-600 dark:text-red-400'
    },
    {
        id: 'repair',
        name: 'Réparations',
        nameEn: 'Repairs',
        description: 'Interventions techniques lourdes',
        icon: RotateCcw,
        gradient: 'from-blue-500 to-indigo-600',
        bgClass: 'bg-blue-500/20',
        borderClass: 'border-blue-500/50',
        textClass: 'text-blue-600 dark:text-blue-400'
    },
    {
        id: 'dropout',
        name: 'Abandons',
        nameEn: 'Dropouts',
        description: 'Productions abandonnées en cours',
        icon: PackageX,
        gradient: 'from-violet-500 to-purple-600',
        bgClass: 'bg-violet-500/20',
        borderClass: 'border-violet-500/50',
        textClass: 'text-violet-600 dark:text-violet-400'
    },
    {
        id: 'return',
        name: 'Retours',
        nameEn: 'Returns',
        description: 'Produits retournés par les clients',
        icon: Undo2,
        gradient: 'from-pink-500 to-rose-600',
        bgClass: 'bg-pink-500/20',
        borderClass: 'border-pink-500/50',
        textClass: 'text-pink-600 dark:text-pink-400'
    },
    {
        id: 'other',
        name: 'Autre',
        nameEn: 'Other',
        description: 'Autres types de défauts',
        icon: HelpCircle,
        gradient: 'from-gray-500 to-slate-600',
        bgClass: 'bg-gray-500/20',
        borderClass: 'border-gray-500/50',
        textClass: 'text-gray-600 dark:text-gray-400'
    }
];

interface QualityDefectEntry {
    id: string;
    defectTypes: string[];
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

interface QualityDefectsFormProps {
    teamMembers: TeamMember[];
    periodStart: string;
    periodEnd: string;
    onAddEntry: (entry: QualityDefectEntry) => void;
    entries: QualityDefectEntry[];
    onRemoveEntry: (index: number) => void;
}

export function QualityDefectsForm({
    teamMembers,
    periodStart,
    periodEnd,
    onAddEntry,
    entries,
    onRemoveEntry
}: QualityDefectsFormProps) {
    const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [date, setDate] = useState('');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [compensation, setCompensation] = useState(0);

    const handleDefectToggle = (defectId: string) => {
        setSelectedDefects(prev =>
            prev.includes(defectId)
                ? prev.filter(id => id !== defectId)
                : [...prev, defectId]
        );
    };

    const handleSubmit = () => {
        if (selectedDefects.length === 0) {
            toast.error("Sélectionnez au moins un type de défaut");
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

        onAddEntry({
            id: crypto.randomUUID(),
            defectTypes: selectedDefects,
            date,
            hours,
            minutes,
            compensation,
            employeeId: selectedEmployee,
            employeeName: employee?.name || '',
            employeeTechLevel: employee?.tech_level || 'Standard'
        });

        // Reset form
        setSelectedDefects([]);
        setSelectedEmployee('');
        setDate('');
        setHours(0);
        setMinutes(0);
        setCompensation(0);

        toast.success(`Défaut qualité enregistré pour ${employee?.name}`);
    };

    return (
        <div className="space-y-6">
            {/* Header avec effet gradient */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Contrôle des Défauts Qualité
                            <Sparkles className="w-5 h-5 text-white/70 animate-pulse" />
                        </h3>
                        <p className="text-white/80 text-sm">
                            Identifiez les régulations constatées et leur impact financier
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 2: Types de défauts - Design futuriste */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">2</span>
                    </div>
                    <Label className="text-foreground font-semibold text-base">
                        Marquez les régulations constatées
                    </Label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {DEFECT_TYPES.map((defect, index) => {
                        const isSelected = selectedDefects.includes(defect.id);
                        const Icon = defect.icon;

                        return (
                            <motion.button
                                key={defect.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleDefectToggle(defect.id)}
                                className={cn(
                                    "relative p-4 rounded-xl border-2 transition-all duration-300 text-left group",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                                    isSelected
                                        ? `bg-gradient-to-br ${defect.gradient} border-transparent shadow-lg`
                                        : "bg-card border-border hover:border-primary/30 hover:bg-muted/50"
                                )}
                            >
                                {/* Checkmark indicator */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                                        >
                                            <Check className="w-4 h-4 text-white" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-all",
                                    isSelected
                                        ? "bg-white/20 text-white"
                                        : cn(defect.bgClass, defect.textClass)
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                <h4 className={cn(
                                    "font-semibold text-sm transition-colors",
                                    isSelected ? "text-white" : "text-foreground"
                                )}>
                                    {defect.name}
                                </h4>
                                <p className={cn(
                                    "text-xs mt-1 transition-colors line-clamp-1",
                                    isSelected ? "text-white/70" : "text-muted-foreground"
                                )}>
                                    {defect.description}
                                </p>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Selected defects summary */}
                {selectedDefects.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-wrap gap-2 pt-3 border-t border-border mt-4"
                    >
                        <span className="text-sm text-muted-foreground">Sélectionnés:</span>
                        {selectedDefects.map(id => {
                            const defect = DEFECT_TYPES.find(d => d.id === id);
                            return defect ? (
                                <Badge
                                    key={id}
                                    className={cn("text-xs", defect.bgClass, defect.textClass, defect.borderClass)}
                                >
                                    {defect.name}
                                </Badge>
                            ) : null;
                        })}
                    </motion.div>
                )}
            </div>

            {/* Section 3: Date et durée */}
            <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">3</span>
                    </div>
                    <Label className="text-foreground font-semibold text-base">
                        Date et durée de régulation
                    </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Employé */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Employé concerné</Label>
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
                            Date de l'événement
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

                    {/* Durée */}
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
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">4</span>
                    </div>
                    <Label className="text-foreground font-semibold text-base">
                        Coûts des opérations de la semaine
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
                disabled={selectedDefects.length === 0 || !selectedEmployee || !date}
                className="w-full md:w-auto bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25"
            >
                <Check className="w-4 h-4 mr-2" />
                Ajouter cette entrée de défaut qualité
            </Button>

            {/* Liste des entrées */}
            {entries.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <h4 className="text-foreground font-semibold">Défauts enregistrés</h4>
                        <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30">
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
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold">
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
                                            {entry.defectTypes.map(typeId => {
                                                const defect = DEFECT_TYPES.find(d => d.id === typeId);
                                                return defect ? (
                                                    <Badge
                                                        key={typeId}
                                                        variant="outline"
                                                        className={cn("text-xs", defect.bgClass, defect.textClass)}
                                                    >
                                                        {defect.name}
                                                    </Badge>
                                                ) : null;
                                            })}
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
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default QualityDefectsForm;
export { DEFECT_TYPES };
export type { QualityDefectEntry };
