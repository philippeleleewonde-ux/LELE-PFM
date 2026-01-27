import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Briefcase, Bot, Cpu, Zap,
    ChevronRight, ChevronLeft, Check,
    Activity, HeartPulse, Layers, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
export type TeamMemberFormData = {
    name: string;
    category: string;
    techLevel: string;
    handicap: string;
    incapacityRate: number;
    versatilityF1: string;
    versatilityF2: string;
    versatilityF3: string;
    teamNumber: number; // MISSION: Numéro d'équipe (1 à teamCount)
};

interface TeamMemberWizardProps {
    onComplete: (data: TeamMemberFormData) => void;
    onCancel: () => void;
    teamCount?: number; // MISSION: Nombre total d'équipes de la ligne d'activité
}

// Category structure matching your screenshot
const CATEGORY_OPTIONS = [
    {
        category: 'Executives',
        label: 'Executive category',
        options: [
            { id: 'Executive-Standard', label: 'Executive', techLevel: 'Standard' },
            { id: 'Executive-IA', label: 'Executive + IA', techLevel: 'IA' },
            { id: 'Executive-Cobot', label: 'Executive + Cobot', techLevel: 'Cobot' },
            { id: 'Executive-Autonomous', label: 'Autonomous AI Executive Agent', techLevel: 'Autonomous' },
        ]
    },
    {
        category: 'Supervisors',
        label: 'Supervisor category',
        options: [
            { id: 'Supervisor-Standard', label: 'Supervisor', techLevel: 'Standard' },
            { id: 'Supervisor-IA', label: 'Supervisor + IA', techLevel: 'IA' },
            { id: 'Supervisor-Cobot', label: 'Supervisor + Cobot', techLevel: 'Cobot' },
            { id: 'Supervisor-Autonomous', label: 'Autonomous AI Supervisor Agent', techLevel: 'Autonomous' },
        ]
    },
    {
        category: 'Clerk',
        label: 'Clerk category',
        options: [
            { id: 'Clerk-Standard', label: 'Clerk', techLevel: 'Standard' },
            { id: 'Clerk-IA', label: 'Clerk + IA', techLevel: 'IA' },
            { id: 'Clerk-Cobot', label: 'Clerk + Cobot', techLevel: 'Cobot' },
            { id: 'Clerk-Autonomous', label: 'Autonomous AI Clerk Agent', techLevel: 'Autonomous' },
        ]
    },
    {
        category: 'Worker',
        label: 'Worker category',
        options: [
            { id: 'Worker-Standard', label: 'Worker', techLevel: 'Standard' },
            { id: 'Worker-IA', label: 'Worker + IA', techLevel: 'IA' },
            { id: 'Worker-Cobot', label: 'Worker + Cobot', techLevel: 'Cobot' },
            { id: 'Worker-Autonomous', label: 'Autonomous AI Worker Agent', techLevel: 'Autonomous' },
        ]
    },
];

const VERSATILITY_LEVELS = [
    "Does not make / does not know",
    "Apprentice (learning)",
    "Confirmed (autonomous)",
    "Experimented (trainer)"
];

const HANDICAP_LEVELS = [
    "The employee is not handicaped",
    "Light handicap: rate from 1 to 15 %",
    "Moderate handicap: rate from 20 to 45 %",
    "Important handicap: rate from 50 to 75 %",
    "Severe or major handicap: rate from 80 to 95 %"
];

export function TeamMemberWizard({ onComplete, onCancel, teamCount = 1 }: TeamMemberWizardProps) {
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [formData, setFormData] = useState<TeamMemberFormData>({
        name: '',
        category: '',
        techLevel: 'Standard',
        handicap: '',
        incapacityRate: 0,
        versatilityF1: '',
        versatilityF2: '',
        versatilityF3: '',
        teamNumber: 1, // MISSION: Par défaut équipe 1
    });

    // MISSION: Générer les options d'équipes (1, 2, 3... jusqu'à teamCount)
    const teamOptions = Array.from({ length: teamCount }, (_, i) => i + 1);

    const updateField = (field: keyof TeamMemberFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionSelect = (optionId: string, category: string, techLevel: string) => {
        setSelectedOption(optionId);
        updateField('category', category);
        updateField('techLevel', techLevel);
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const isStep1Valid = formData.name.length > 0 && formData.category.length > 0;
    const isStep2Valid = formData.handicap.length > 0 && formData.versatilityF1.length > 0;

    return (
        <div className="w-full max-w-7xl mx-auto p-6">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between mb-2 text-sm font-medium text-muted-foreground">
                    <span className={cn(step >= 1 && "text-primary")}>Identité & Poste</span>
                    <span className={cn(step >= 2 && "text-primary")}>Détails & Compétences</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(step / 2) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Qui souhaitez-vous ajouter ?</h2>
                            <p className="text-muted-foreground">Commencez par identifier le membre de l'équipe.</p>
                        </div>

                        {/* Name Input + Team Selection */}
                        <div className="space-y-4 max-w-md mx-auto">
                            <div className="space-y-2">
                                <Label>Nom de l'employé</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    placeholder="Ex: Jean Dupont"
                                    className="h-12 text-lg"
                                    autoFocus
                                />
                            </div>

                            {/* MISSION: Sélection d'équipe (visible seulement si plus d'1 équipe) */}
                            {teamCount > 1 && (
                                <div className="space-y-2 pt-2">
                                    <Label className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        Équipe d'affectation
                                    </Label>
                                    <Select
                                        value={String(formData.teamNumber)}
                                        onValueChange={(v) => updateField('teamNumber', parseInt(v, 10))}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Sélectionner l'équipe..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamOptions.map((num) => (
                                                <SelectItem key={num} value={String(num)}>
                                                    Équipe {num}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Cette ligne d'activité contient {teamCount} équipes
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Category & Tech Level Selection - 4 columns layout */}
                        <div className="space-y-4 pt-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-primary">Sélectionnez la catégorie et le niveau technologique</h3>
                                <p className="text-sm text-muted-foreground">Choisissez parmi les 4 catégories professionnelles</p>
                            </div>

                            {/* 4 Column Grid - Responsive */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {CATEGORY_OPTIONS.map((categoryGroup) => (
                                    <div
                                        key={categoryGroup.category}
                                        className={cn(
                                            "rounded-xl p-4 border-4",
                                            "bg-gradient-to-b from-orange-50 to-orange-100",
                                            "dark:from-orange-950/20 dark:to-orange-900/20",
                                            "border-orange-500"
                                        )}
                                    >
                                        {/* Category Header */}
                                        <h4 className={cn(
                                            "text-center font-bold mb-3 pb-2 border-b-2 border-orange-400",
                                            "text-gray-800 dark:text-gray-200"
                                        )}>
                                            {categoryGroup.label}
                                        </h4>

                                        {/* Options in column */}
                                        <div className="space-y-2">
                                            {categoryGroup.options.map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleOptionSelect(
                                                        option.id,
                                                        categoryGroup.category,
                                                        option.techLevel
                                                    )}
                                                    className={cn(
                                                        "w-full px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                                        "border-2",
                                                        selectedOption === option.id
                                                            ? "bg-cyan-400 dark:bg-cyan-600 text-gray-900 dark:text-white border-cyan-600 dark:border-cyan-400 shadow-lg scale-105"
                                                            : "bg-cyan-100 dark:bg-cyan-900/30 text-gray-800 dark:text-gray-200 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-200 dark:hover:bg-cyan-800/40 hover:scale-102"
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Détails & Compétences</h2>
                            <p className="text-muted-foreground">Précisez le profil de santé et de polyvalence.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Health Section */}
                            <div className="space-y-6 p-6 rounded-xl bg-muted/30 border">
                                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                                    <HeartPulse className="w-5 h-5" />
                                    <h3>Santé & Handicap</h3>
                                </div>

                                <div className="space-y-2">
                                    <Label>Type de Handicap</Label>
                                    <Select
                                        value={formData.handicap}
                                        onValueChange={(v) => updateField('handicap', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {HANDICAP_LEVELS.map(l => (
                                                <SelectItem key={l} value={l}>{l}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Taux d'incapacité (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.incapacityRate}
                                        onChange={(e) => updateField('incapacityRate', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Versatility Section */}
                            <div className="space-y-6 p-6 rounded-xl bg-muted/30 border">
                                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                                    <Layers className="w-5 h-5" />
                                    <h3>Polyvalence (F1, F2, F3)</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-muted-foreground">Fonction Principale (F1)</Label>
                                        <Select
                                            value={formData.versatilityF1}
                                            onValueChange={(v) => updateField('versatilityF1', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Niveau F1..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {VERSATILITY_LEVELS.map(l => (
                                                    <SelectItem key={l} value={l}>{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-muted-foreground">Fonction Secondaire (F2)</Label>
                                        <Select
                                            value={formData.versatilityF2}
                                            onValueChange={(v) => updateField('versatilityF2', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Niveau F2..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {VERSATILITY_LEVELS.map(l => (
                                                    <SelectItem key={l} value={l}>{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-muted-foreground">Fonction Auxiliaire (F3)</Label>
                                        <Select
                                            value={formData.versatilityF3}
                                            onValueChange={(v) => updateField('versatilityF3', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Niveau F3..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {VERSATILITY_LEVELS.map(l => (
                                                    <SelectItem key={l} value={l}>{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-8 border-t">
                <Button
                    variant="outline"
                    onClick={step === 1 ? onCancel : prevStep}
                >
                    {step === 1 ? 'Annuler' : 'Précédent'}
                </Button>

                <Button
                    onClick={step === 2 ? () => onComplete(formData) : nextStep}
                    disabled={
                        (step === 1 && !isStep1Valid) ||
                        (step === 2 && !isStep2Valid)
                    }
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                    {step === 2 ? (
                        <>
                            Terminer
                            <Check className="ml-2 w-4 h-4" />
                        </>
                    ) : (
                        <>
                            Suivant
                            <ChevronRight className="ml-2 w-4 h-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
