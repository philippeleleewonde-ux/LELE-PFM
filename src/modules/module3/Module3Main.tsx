import { useState } from 'react';
import { ArrowRight, Users, DollarSign, TrendingUp, Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PhaseProgressIndicator } from './components/navigation';

const MODULE3_PHASES = [
  { id: 1, label: 'Phase 1', description: 'Données Employés' },
  { id: 2, label: 'Phase 2', description: 'Coûts Exécution' },
  { id: 3, label: 'Phase 3', description: 'Performances' },
];

export default function Module3Main() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const handleNext = () => {
    if (selectedCard === 0) {
      navigate('/modules/module3/team-identification');
    } else if (selectedCard === 1) {
      navigate('/modules/module3/cost-data-entry');
    } else if (selectedCard === 2) {
      navigate('/modules/module3/analysis-configuration');
    }
  };

  const features = [
    {
      icon: Users,
      title: '1 - Les données des employés de vos équipes',
      description:
        "Identification complète des membres de l'équipe avec leurs catégories professionnelles, polyvalence et taux d'incapacité",
      badge: 'Phase 1',
    },
    {
      icon: DollarSign,
      title: '2 - Les données des coûts générés au quotidien par votre activité',
      description:
        "Calcul précis des coûts d'exécution quotidiens basés sur les données réelles de votre activité",
      badge: 'Phase 2',
    },
    {
      icon: TrendingUp,
      title: '3 - Le calcul des performances de vos équipes',
      description:
        "Analyse détaillée des performances et identification des opportunités d'optimisation",
      badge: 'Phase 3',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Subtle single animated blob */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-blue-400/5 dark:bg-blue-500/5 rounded-full filter blur-3xl animate-blob" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Welcome Banner */}
          <div className="text-center mb-14">
            {/* Security Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-8">
              <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Secured access &middot; 100% ASP mode
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-5">
              Bienvenue sur la plateforme
              <br />
              <span className="text-blue-600 dark:text-blue-400">
                HCM Cost Savings
              </span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Cette plateforme est dédiée à l&apos;enregistrement de vos données de
              coûts d&apos;exécution au quotidien
            </p>
          </div>

          {/* Phase Progress Indicator */}
          <PhaseProgressIndicator
            phases={MODULE3_PHASES}
            currentPhase={selectedCard ?? 0}
            onPhaseClick={(index) => setSelectedCard(index)}
          />

          {/* CTA Text above cards */}
          <div className="text-center mb-8">
            <p className="text-base font-medium text-slate-700 dark:text-slate-300">
              Faites votre choix et cliquez sur suivant
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-14">
            {features.map((feature, index) => {
              const isSelected = selectedCard === index;
              const isHovered = hoveredCard === index;

              return (
                <div
                  key={index}
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setSelectedCard(index)}
                >
                  <div
                    className={[
                      'relative h-full rounded-xl overflow-hidden transition-all duration-200',
                      isSelected
                        ? 'border-2 border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-500/10 shadow-lg'
                        : isHovered
                          ? 'border border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-800/80 shadow-lg'
                          : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm',
                    ].join(' ')}
                  >
                    {/* Accent line top */}
                    <div
                      className={[
                        'h-0.5 transition-all duration-200',
                        isSelected
                          ? 'bg-blue-600 dark:bg-blue-400'
                          : isHovered
                            ? 'bg-blue-400 dark:bg-blue-500'
                            : 'bg-transparent',
                      ].join(' ')}
                    />

                    <div className="p-6">
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}

                      {/* Badge + Icon row */}
                      <div className="flex items-center justify-between mb-5">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-medium uppercase tracking-wide">
                          {feature.badge}
                        </span>
                        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                          <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>

                      <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-3 leading-snug pr-6">
                        {feature.title}
                      </h3>

                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <button
              onClick={handleNext}
              disabled={selectedCard === null}
              className={[
                'inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200',
                selectedCard !== null
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed',
              ].join(' ')}
            >
              <span>Suivant</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Software Riskosoft M3 &mdash; Cost Savings
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Identification of employees of a team (Team Leaders)
                </p>
              </div>
            </div>

            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
              <span>Voir la démo</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Demo
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Minimal blob animation */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.05); }
        }

        .animate-blob {
          animation: blob 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
