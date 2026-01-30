import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Shield, Globe, CheckCircle2, ArrowLeft, Building2, Users, BarChart3 } from 'lucide-react';
import { ThemeLogo } from '@/components/ThemeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WorldFinanceLogo } from '@/components/WorldFinanceLogo';

/**
 * Awards Page - World Finance Innovation Awards 2025
 *
 * Page dédiée détaillant la reconnaissance de LELE HCM par World Finance
 * pour l'excellence en innovation fintech, finance durable et conformité ESG.
 */

const Awards = () => {
  // Critères du jury détaillés (5 piliers)
  const juryCriteria = [
    {
      icon: TrendingUp,
      title: "Innovation en Fintech ESG et Finance Verte",
      description: "Les applications fintech de Lele-HCM fusionnent les indicateurs ESG, l'analyse coûts-bénéfices et les engagements en ressources humaines, permettant aux organisations d'optimiser et de mesurer leurs pratiques durables avec une clarté sans précédent.",
      highlights: [
        "Fusion des indicateurs ESG et analyse coûts-bénéfices",
        "Engagements RH intégrés aux flux ESG",
        "Optimisation des pratiques durables en temps réel",
        "Clarté et transparence maximales"
      ]
    },
    {
      icon: Building2,
      title: "Cadres Holistiques d'Amélioration Financière et Opérationnelle",
      description: "Vos plateformes intègrent la comptabilité de gestion et la psychologie organisationnelle, offrant aux entreprises des cadres proactifs pour identifier, atténuer et signaler les risques opérationnels liés à la durabilité en temps réel.",
      highlights: [
        "Intégration comptabilité de gestion + psychologie organisationnelle",
        "Identification proactive des risques opérationnels",
        "Atténuation en temps réel des risques ESG",
        "Signalement automatisé et conforme"
      ]
    },
    {
      icon: Shield,
      title: "Conformité Réglementaire et Reporting ESG Responsable",
      description: "Le jury a salué vos solutions de reporting transparentes et conformes aux réglementations, alignées sur des normes internationales telles que le SASB et le TCFD. Lele-HCM permet ainsi aux entreprises d'exceller dans les exigences mondiales en matière de durabilité et de finance verte.",
      highlights: [
        "Conformité SASB (Sustainability Accounting Standards Board)",
        "Alignement TCFD (Task Force on Climate-related Financial Disclosures)",
        "Reporting transparent et automatisé",
        "Excellence dans les normes mondiales ESG"
      ]
    },
    {
      icon: Globe,
      title: "Référence Industrielle en Cloud et Finance Verte",
      description: "En intégrant l'ESG dans les flux comptables quotidiens et en offrant un reporting économique basé sur le cloud, Lele-HCM établit de nouvelles normes de responsabilité, d'analyse des données et d'adoption de la finance verte.",
      highlights: [
        "ESG intégré aux flux comptables quotidiens",
        "Infrastructure cloud scalable et sécurisée",
        "Nouvelles normes de responsabilité financière",
        "Leadership en adoption de la finance verte"
      ]
    },
    {
      icon: BarChart3,
      title: "Impact Mesurable et Analytique Pionnière",
      description: "Lele-HCM démontre comment la fintech peut générer non seulement de la conformité, mais aussi un impact commercial significatif, avec des résultats mesurables en Amérique du Nord et au-delà.",
      highlights: [
        "Impact commercial significatif et quantifié",
        "Résultats mesurables en Amérique du Nord",
        "Gestion proactive des risques ESG",
        "Analytique d'entreprise pionnière"
      ]
    }
  ];

  // Impact et reconnaissance
  const recognitionStats = [
    { value: "2025", label: "Lauréat World Finance", icon: Award },
    { value: "5/5", label: "Critères du Jury", icon: CheckCircle2 },
    { value: "ESG", label: "Leader Innovation", icon: TrendingUp },
    { value: "SASB/TCFD", label: "Conformité Mondiale", icon: Shield }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <ThemeLogo className="h-14" />
          </Link>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 -z-10" />

        <div className="container mx-auto px-4 py-20 text-center">
          {/* World Finance Logo with glow effect */}
          <div className="flex justify-center mb-8">
            <WorldFinanceLogo size="xl" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            World Finance Innovation Awards
          </h1>
          <p className="text-2xl sm:text-3xl font-semibold text-primary mb-4">
            Lauréat 2025
          </p>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Lele-HCM a été distingué pour son excellence dans l'innovation fintech,
            la finance durable et la conformité réglementaire ESG.
          </p>

          {/* Recognition Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
            {recognitionStats.map((stat, index) => (
              <Card key={index} className="border-border bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Won Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pourquoi Lele-HCM a Remporté ce Prix
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Le jury a reconnu notre excellence à travers 5 critères fondamentaux
            qui définissent le leadership en innovation fintech ESG.
          </p>
        </div>

        {/* Jury Criteria - Detailed Cards */}
        <div className="space-y-12">
          {juryCriteria.map((criteria, index) => (
            <Card
              key={index}
              className="border-border bg-card hover:shadow-elegant transition-smooth overflow-hidden"
            >
              <div className="grid lg:grid-cols-[auto_1fr] gap-6">
                {/* Icon Section */}
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 flex items-center justify-center lg:min-w-[200px]">
                  <criteria.icon className="h-16 w-16 text-primary" strokeWidth={1.5} />
                </div>

                {/* Content Section */}
                <div className="p-6 lg:p-8">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-4xl font-bold text-primary/30">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <CardTitle className="text-2xl flex-1">
                        {criteria.title}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {criteria.description}
                    </p>

                    {/* Highlights */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {criteria.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* What This Means Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ce que Cette Reconnaissance Signifie
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Vos réussites dans la fusion entre comptabilité de gestion, analyses organisationnelles
              et reporting ESG placent <span className="font-semibold text-primary">Lele-HCM à la pointe
              de la finance durable et de l'innovation réglementaire</span>.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="border-border bg-card">
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Pour Nos Clients</h3>
                  <p className="text-sm text-muted-foreground">
                    Confiance renforcée dans des solutions éprouvées et reconnues mondialement
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-6 text-center">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Pour l'Industrie</h3>
                  <p className="text-sm text-muted-foreground">
                    Nouvelle référence en intégration ESG et conformité réglementaire
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-6 text-center">
                  <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Pour l'Avenir</h3>
                  <p className="text-sm text-muted-foreground">
                    Leadership continu en innovation fintech et finance verte
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Découvrez Notre Plateforme Primée
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Rejoignez les organisations qui font confiance à Lele-HCM pour leur
            transformation ESG et leur excellence opérationnelle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/role-selection">
              <Button size="lg" className="gradient-primary shadow-elegant text-lg px-8">
                Commencer Gratuitement
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Retour à l'Accueil
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="mb-2">
            <span className="font-semibold text-primary">World Finance Innovation Awards 2025</span> - Lauréat
          </p>
          <p>&copy; 2025 LELE HCM Portal. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Awards;
