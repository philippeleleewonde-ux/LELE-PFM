import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SupabaseService } from '@/modules/module1/services/SupabaseService';
import { UserStorage } from '@/modules/module1/utils/userStorage';
import { Page17GlobalReporting } from '@/modules/module1/components/reporting/Page17GlobalReporting';
import { FormData } from '@/modules/module1/types';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { FiscalCalendarWidget } from '@/components/shared/FiscalCalendarWidget';
import { LaunchDateProvider } from '@/components/shared/SmartDateWidgets';
import { useAuth } from '@/hooks/useAuth';

const PerformancePlanReport = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<FormData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Récupérer le companyId pour le LaunchDateProvider
    const companyId = user?.user_metadata?.company_id || user?.id || '';

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Try Supabase first
                const result = await SupabaseService.loadCFOData();

                if (result.success && result.data) {
                    setData(result.data);
                } else {
                    // 2. Fallback to Local Storage
                    const localData = UserStorage.getItem('cfo_final_data');

                    if (localData) {
                        try {
                            const parsedData = JSON.parse(localData);
                            setData(parsedData);
                            // Optional: Show a toast that we are using local backup?
                        } catch (e) {
                            console.error("Failed to parse local backup", e);
                            setData(null);
                        }
                    } else {
                        // No data found anywhere
                        setData(null);
                    }
                }
            } catch (err) {
                console.error("Failed to load report data", err);

                // Try fallback even on error
                const localData = UserStorage.getItem('cfo_final_data');
                if (localData) {
                    try {
                        const parsedData = JSON.parse(localData);
                        setData(parsedData);
                    } catch (e) {
                        setError("Une erreur est survenue lors du chargement du rapport.");
                    }
                } else {
                    setError("Une erreur est survenue lors du chargement du rapport.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <LaunchDateProvider companyId={companyId}>
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
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/company-profile')}
                                    className="mr-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <h2 className="hidden sm:block text-lg font-bold text-slate-800 dark:text-slate-200">
                                    Rapport Performance Plan
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Widget calendrier minimal dans la top bar */}
                            <FiscalCalendarWidget minimal />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-8 relative min-h-[calc(100vh-80px)]">
                    {/* Background Ambient Effects */}
                    <div className="fixed inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-cyan-500/5 dark:bg-cyan-500/10" />
                        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-blue-600/5 dark:bg-blue-600/10" />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
                                <HCMLoader text="Chargement du rapport..." />
                            </div>
                        ) : !data ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto"
                            >
                                <div className="p-6 bg-amber-500/10 rounded-full mb-6">
                                    <AlertCircle className="w-16 h-16 text-amber-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                    Rapport non disponible
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                                    Pas de rapport disponible pour le moment. Veuillez compléter la base de données du module <span className="font-semibold text-cyan-600 dark:text-cyan-400">LELE HCM PERFORMANCE PLAN</span>.
                                </p>
                                <Button
                                    onClick={() => navigate('/modules/module1')}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                >
                                    Accéder au Module 1
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Page17GlobalReporting
                                    calculated={data.calculatedFields}
                                    selectedCurrency={data.selectedCurrency}
                                    businessLines={data.businessLines}
                                    socioeconomicData={data.socioeconomicImprovement}
                                    qualitativeData={data.qualitativeAssessment}
                                />
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
        </LaunchDateProvider>
    );
};

export default PerformancePlanReport;
