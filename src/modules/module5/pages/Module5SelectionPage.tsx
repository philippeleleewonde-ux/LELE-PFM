import { useNavigate } from 'react-router-dom';
import { Sparkles, BarChart3, BrainCircuit } from 'lucide-react';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';

// ============================================================================
// MODULE 5 — SELECTION PAGE
// 2 cards: DEMO (generate random data) / Dashboard (real employee responses)
// ============================================================================

export default function Module5SelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden">
      <CEOSidebar />
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <SidebarToggle />
              <h2 className="hidden sm:block text-lg font-bold text-foreground">
                Risques Psychosociaux
              </h2>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="container mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-lg bg-violet-500/10">
              <BrainCircuit className="h-8 w-8 text-violet-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Risques Psychosociaux</h1>
              <p className="text-muted-foreground">Évaluation et prévention des risques psychosociaux</p>
            </div>
          </div>

          {/* 2 Cards */}
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
            {/* Card 1 — DEMO */}
            <button
              onClick={() => navigate('demo')}
              className="group text-left"
            >
              <div className="relative overflow-hidden rounded-2xl border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 h-full transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-orange-400" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      DEMO
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    DEMO Risques Psychosociaux
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Générez des données de démonstration basées sur vos effectifs réels
                    pour tester le reporting et visualiser les tableaux de bord RPS.
                  </p>
                  <div className="pt-2">
                    <span className="text-orange-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Accéder au mode démo →
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Card 2 — Dashboard (Production) */}
            <button
              onClick={() => navigate('dashboard')}
              className="group text-left"
            >
              <div className="relative overflow-hidden rounded-2xl border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 h-full transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <BarChart3 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Production
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Dashboard Risques Psychosociaux
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Module d'évaluation des risques psychosociaux — questionnaires, résultats et analyses
                    basés sur les réponses réelles de vos collaborateurs.
                  </p>
                  <div className="pt-2">
                    <span className="text-emerald-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Accéder au dashboard →
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
