import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database,
    TrendingUp,
    DollarSign,
    Users,
    BrainCircuit,
    Building2,
    ArrowRight,
    Activity,
    ShieldCheck,
    PieChart,
    Clock,
    Calendar,
    Quote,
    Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import { LaunchDateSelector } from '@/components/shared/LaunchDateSelector';
import { PerformanceCountdownBanner } from '@/components/shared/PerformanceCountdownBanner';
import { useLaunchDate, LockedDateConfig } from '@/lib/fiscal/LaunchDateService';

// --- TYPES ---
interface ReportCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    gradient: string;
    delay: number;
    path?: string;
    status?: 'active' | 'pending' | 'locked';
}

// --- DATA ---
const QUOTES = [
    "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
    "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
    "Les opportunités ne se produisent pas. Vous les créez.",
    "Ne regardez pas l'horloge ; faites ce qu'elle fait. Continuez d'avancer.",
    "L'avenir dépend de ce que vous faites aujourd'hui.",
    "Croyez que vous le pouvez et vous êtes déjà à mi-chemin.",
    "La qualité signifie bien faire les choses quand personne ne regarde.",
    "Cela semble toujours impossible jusqu'à ce que ce soit fait.",
    "Le succès vient généralement à ceux qui sont trop occupés pour le chercher.",
    "Votre temps est limité, ne le gâchez pas en menant une existence qui n'est pas la vôtre."
];

const REPORT_CARDS: Omit<ReportCardProps, 'delay'>[] = [
    {
        title: "LELE HCM Datamapping",
        description: "Récapitulatif global de tous les employés enregistrés par ligne d'activité.",
        icon: Database,
        color: "text-cyan-600 dark:text-cyan-400",
        gradient: "from-cyan-500/10 to-blue-600/10 dark:from-cyan-500/20 dark:to-blue-600/20",
        path: "/company-profile/data-mapping",
        status: 'active'
    },
    {
        title: "LELE HCM Performance Plan",
        description: "Analyse détaillée de la performance et des indicateurs clés.",
        icon: TrendingUp,
        color: "text-emerald-600 dark:text-emerald-400",
        gradient: "from-emerald-500/10 to-green-600/10 dark:from-emerald-500/20 dark:to-green-600/20",
        path: "/company-profile/performance-plan",
        status: 'active'
    },
    {
        title: "LELE HCM Cost Savings",
        description: "Suivi des économies générées et optimisation des coûts.",
        icon: DollarSign,
        color: "text-amber-600 dark:text-amber-400",
        gradient: "from-amber-500/10 to-orange-600/10 dark:from-amber-500/20 dark:to-orange-600/20",
        path: "/modules/module3",
        status: 'active'
    },
    {
        title: "LELE HCM Employee Satisfaction",
        description: "Mesure de l'engagement et du bien-être des collaborateurs.",
        icon: Users,
        color: "text-rose-600 dark:text-rose-400",
        gradient: "from-rose-500/10 to-pink-600/10 dark:from-rose-500/20 dark:to-pink-600/20",
        path: "/modules/module2",
        status: 'active'
    },
    {
        title: "LELE HCM Psychosocial Risk",
        description: "Évaluation et prévention des risques psychosociaux.",
        icon: BrainCircuit,
        color: "text-violet-600 dark:text-violet-400",
        gradient: "from-violet-500/10 to-purple-600/10 dark:from-violet-500/20 dark:to-purple-600/20",
        path: "/modules/psychosocial-risks",
        status: 'pending'
    },
    {
        title: "LELE HCM Banker/Insurer Access",
        description: "Portail d'accès sécurisé pour les partenaires financiers.",
        icon: ShieldCheck,
        color: "text-indigo-600 dark:text-indigo-400",
        gradient: "from-indigo-500/10 to-blue-800/10 dark:from-indigo-500/20 dark:to-blue-800/20",
        path: "/banker-access",
        status: 'active'
    }
];

// --- COMPONENTS ---

const HeaderWidgets = () => {
    const [time, setTime] = useState(new Date());
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const quoteTimer = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        }, 10000); // Change quote every 10 seconds
        return () => clearInterval(quoteTimer);
    }, []);

    const formattedDate = time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Date Widget */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
            >
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                    <Calendar className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Date du jour</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{formattedDate}</p>
                </div>
            </motion.div>

            {/* Time Widget */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
            >
                <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-600 dark:text-cyan-400">
                    <Clock className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Heure locale</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{formattedTime}</p>
                </div>
            </motion.div>

            {/* Quote Widget */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden"
            >
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                    <Quote className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden h-12 flex items-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={quoteIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="text-xs italic text-slate-700 dark:text-slate-300 line-clamp-2"
                        >
                            "{QUOTES[quoteIndex]}"
                        </motion.p>
                    </AnimatePresence>
                </div>
                {/* Progress bar for quote rotation */}
                <motion.div
                    key={quoteIndex}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-0.5 bg-purple-500/30"
                />
            </motion.div>
        </div>
    );
};

const ReportCard = ({ title, description, icon: Icon, color, gradient, delay, path, status }: ReportCardProps) => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="group relative"
        >
            <div className={cn(
                "relative h-full overflow-hidden rounded-3xl border transition-all duration-300",
                "bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-cyan-200", // Light mode
                "dark:bg-white/5 dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-cyan-500/10", // Dark mode
                status === 'locked' && "opacity-50 grayscale cursor-not-allowed"
            )}>
                {/* Gradient Background Effect */}
                <div className={cn(
                    "absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-all duration-500 group-hover:opacity-70 opacity-20",
                    gradient.replace('/20', '/40') // Intensify gradient on hover
                )} />

                <div className="relative z-10 flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                            "p-3 rounded-2xl border backdrop-blur-md",
                            "bg-slate-50 border-slate-100", // Light
                            "dark:bg-white/5 dark:border-white/10", // Dark
                            color
                        )}>
                            <Icon className="w-8 h-8" />
                        </div>
                        {status === 'active' && (
                            <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400">
                                <Activity className="w-3 h-3" /> Actif
                            </div>
                        )}
                        {status === 'pending' && (
                            <div className="text-xs font-medium px-2 py-1 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400">
                                Bientôt
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-2 transition-colors text-slate-900 group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-300">
                        {title}
                    </h3>
                    <p className="text-sm leading-relaxed mb-6 flex-grow text-slate-600 dark:text-slate-400">
                        {description}
                    </p>

                    {/* Action */}
                    <div className="mt-auto">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-between transition-colors",
                                "text-slate-600 hover:text-cyan-600 hover:bg-cyan-50", // Light
                                "dark:text-slate-300 dark:hover:text-cyan-300 dark:hover:bg-white/10" // Dark
                            )}
                            onClick={() => path && status !== 'locked' && navigate(path)}
                            disabled={status === 'locked'}
                        >
                            Accéder au rapport
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const CompanyProfile = () => {
    const { user } = useAuth();
    // IMPORTANT: Utiliser useCompany() pour avoir le même companyId que CostDataEntry
    const { companyId: contextCompanyId } = useCompany();
    const [showLaunchConfig, setShowLaunchConfig] = useState(false);

    // Utiliser le companyId du contexte (cohérent avec tous les autres modules)
    const companyId = contextCompanyId || '';
    const { config, saveLaunchDate, deleteLaunchDate, hasLaunchDate, saveLockedPeriods } = useLaunchDate(companyId);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0F1C]">
            {/* Sidebar */}
            <CEOSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative text-slate-900 dark:text-slate-200">
                {/* Top Bar */}
                <div className="sticky top-0 z-50 backdrop-blur-xl border-b bg-white/80 border-slate-200 dark:bg-[#0A0F1C]/80 dark:border-white/10">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                            <SidebarToggle />
                            <h2 className="hidden sm:block text-lg font-bold text-slate-800 dark:text-slate-200">
                                Profil Entreprise
                            </h2>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-8 relative overflow-hidden min-h-[calc(100vh-80px)]">
                    {/* Background Ambient Effects */}
                    <div className="fixed inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-cyan-500/5 dark:bg-cyan-500/10" />
                        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-blue-600/5 dark:bg-blue-600/10" />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                        {/* Performance Countdown Banner */}
                        <PerformanceCountdownBanner
                            companyId={companyId}
                            onConfigureClick={() => setShowLaunchConfig(true)}
                            variant="compact"
                            externalConfig={config}
                        />

                        {/* Header Widgets */}
                        <HeaderWidgets />

                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                        >
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-cyan-600 to-blue-600 dark:from-white dark:via-cyan-200 dark:to-blue-400">
                                    Profil Entreprise
                                </h1>
                                <p className="text-lg max-w-2xl text-slate-600 dark:text-slate-400">
                                    Accédez à l'ensemble des rapports stratégiques et indicateurs de performance de votre organisation.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Dernière mise à jour</p>
                                    <p className="font-mono text-cyan-600 dark:text-cyan-400">Temps réel</p>
                                </div>
                                <div className="p-3 rounded-2xl border backdrop-blur-md bg-white border-slate-200 dark:bg-white/5 dark:border-white/10">
                                    <Building2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Grid Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {REPORT_CARDS.map((card, index) => (
                                <ReportCard
                                    key={index}
                                    {...card}
                                    delay={index * 0.1}
                                />
                            ))}
                        </div>

                        {/* Footer / Stats Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12"
                        >
                            {[
                                { label: "Rapports Générés", value: "24", icon: PieChart, color: "text-cyan-600 dark:text-cyan-400" },
                                { label: "Score Global", value: "87/100", icon: Activity, color: "text-emerald-600 dark:text-emerald-400" },
                                { label: "Utilisateurs Actifs", value: "12", icon: Users, color: "text-amber-600 dark:text-amber-400" },
                                { label: "Modules Activés", value: "5/6", icon: Database, color: "text-violet-600 dark:text-violet-400" }
                            ].map((stat, i) => (
                                <div key={i} className="rounded-2xl border p-4 backdrop-blur-md flex items-center gap-4 bg-white border-slate-200 dark:bg-white/5 dark:border-white/10">
                                    <div className={cn("p-2 rounded-lg bg-slate-50 dark:bg-white/5", stat.color)}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Launch Date Configuration Modal */}
                        <AnimatePresence>
                            {showLaunchConfig && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm"
                                    onClick={(e) => {
                                        if (e.target === e.currentTarget) setShowLaunchConfig(false);
                                    }}
                                >
                                    <div className="min-h-full flex items-start justify-center p-4 py-8">
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.95, opacity: 0 }}
                                            className="w-full max-w-4xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <LaunchDateSelector
                                            initialDate={config?.platformLaunchDate}
                                            initialDuration={config?.planDurationYears || 3}
                                            initialLockedPeriods={config?.lockedDates || {}}
                                            onSave={async (date, duration) => {
                                                const result = await saveLaunchDate(date, duration);
                                                if (result.success) {
                                                    setShowLaunchConfig(false);
                                                }
                                                return result;
                                            }}
                                            onDelete={async () => {
                                                const result = await deleteLaunchDate();
                                                if (result.success) {
                                                    setShowLaunchConfig(false);
                                                }
                                                return result;
                                            }}
                                            onCancel={() => setShowLaunchConfig(false)}
                                            onLockChange={async (lockedPeriods: LockedDateConfig) => {
                                                // Sauvegarde automatique des périodes verrouillées
                                                await saveLockedPeriods(lockedPeriods);
                                            }}
                                            showProjections={true}
                                        />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CompanyProfile;
