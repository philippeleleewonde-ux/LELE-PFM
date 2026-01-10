import { useState } from 'react';
import { ArrowRight, Users, DollarSign, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      // Phase 3 - D'abord afficher la configuration de l'analyse (Vue d'ensemble des équipes)
      navigate('/modules/module3/analysis-configuration');
    }
  };

  const features = [
    {
      icon: Users,
      title: '1- Les données des employés de vos équipes',
      description: 'Identification complète des membres de l\'équipe avec leurs catégories professionnelles, polyvalence et taux d\'incapacité',
      color: 'from-blue-500 to-cyan-500',
      badge: 'Phase 1'
    },
    {
      icon: DollarSign,
      title: '2- Les données des coûts générés au quotidien par votre activité',
      description: 'Calcul précis des coûts d\'exécution quotidiens basés sur les données réelles de votre activité',
      color: 'from-purple-500 to-pink-500',
      badge: 'Phase 2'
    },
    {
      icon: TrendingUp,
      title: '3- Le calcul des performances de vos équipes',
      description: 'Analyse détaillée des performances et identification des opportunités d\'optimisation',
      color: 'from-orange-500 to-red-500',
      badge: 'Phase 3'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-300/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Welcome Banner */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                Secured access to 100% in ASP mode
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              BIENVENUE SUR LA PLATEFORME
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                HCM COST SAVINGS
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Cette plateforme est dédiée à l'enregistrement de vos données de
              coûts d'exécution au quotidien
            </p>
          </div>

          {/* CTA Text above cards */}
          <div className="text-center mb-8">
            <p className="text-lg font-semibold text-foreground">
              Faites votre choix et cliquez sur suivant
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedCard(index)}
              >
                <div className={`
                  h-full p-6 rounded-2xl border-2 transition-all duration-300
                  ${selectedCard === index
                    ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/20 scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : hoveredCard === index
                      ? 'border-primary/50 bg-card shadow-xl scale-102'
                      : 'border-border bg-card/50 backdrop-blur-sm'
                  }
                `}>
                  {/* Selection Indicator */}
                  {selectedCard === index && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                    </div>
                  )}

                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {feature.badge}
                    </span>
                    <div className={`
                      p-3 rounded-xl bg-gradient-to-br ${feature.color}
                      transition-transform duration-300
                      ${hoveredCard === index || selectedCard === index ? 'rotate-6 scale-110' : ''}
                    `}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-3 leading-tight">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover/Selection Effect Line */}
                  <div className={`
                    mt-6 h-1 rounded-full bg-gradient-to-r ${feature.color}
                    transition-all duration-300
                    ${hoveredCard === index || selectedCard === index ? 'w-full' : 'w-0'}
                  `} />
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            {/* Simple Suivant Button */}
            <button
              onClick={handleNext}
              disabled={selectedCard === null}
              className={`
                inline-flex items-center gap-2 px-8 py-3 rounded-lg
                font-semibold text-base
                shadow-lg transition-all duration-300
                ${selectedCard !== null
                  ? 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 hover:shadow-xl cursor-pointer'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                }
              `}
            >
              <span>Suivant</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="border-t border-border bg-muted/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Software Riskosoft M3 - Cost Savings
                </p>
                <p className="text-xs text-muted-foreground">
                  Identification of employees of a team (Team Leaders)
                </p>
              </div>
            </div>

            <button
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <span>Voir la démo</span>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-xs">
                DEMO
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
