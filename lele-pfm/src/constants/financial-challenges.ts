/**
 * Financial Challenges — Plan annuel de 48 défis (Savoir → Faire → Maîtriser)
 * 4 trimestres × 3 modules × 4 semaines
 * Alimente le levier LIT du score financier dynamique.
 */

export interface FinancialChallenge {
  id: string;
  week: number;
  quarter: 1 | 2 | 3 | 4;
  module: number;
  moduleTitle: string;
  difficulty: 'decouverte' | 'intermediaire' | 'avance' | 'expert';
  savoir: string;
  faire: string;
  maitriserDesc: string;
  conditionKey: string;
  points: { savoir: number; faire: number; maitriser: number };
}

// ─── T1: LES FONDATIONS (S1-S12) ───

const MODULE_1: FinancialChallenge[] = [
  {
    id: 'S1', week: 1, quarter: 1, module: 1,
    moduleTitle: 'Conscience Financiere',
    difficulty: 'decouverte',
    savoir: "Celui qui ne sait pas ou va son argent ne saura jamais le garder. Suivre ses depenses est le premier acte de liberte financiere.",
    faire: "Enregistrer votre premiere depense de la semaine",
    maitriserDesc: "Au moins 1 transaction enregistree cette semaine",
    conditionKey: 'S1',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S2', week: 2, quarter: 1, module: 1,
    moduleTitle: 'Conscience Financiere',
    difficulty: 'decouverte',
    savoir: "En moyenne, on sous-estime ses depenses de 30%. Le cerveau oublie les petits achats — l'app non.",
    faire: "Enregistrer des depenses dans au moins 3 categories differentes",
    maitriserDesc: "3 categories differentes utilisees cette semaine",
    conditionKey: 'S2',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S3', week: 3, quarter: 1, module: 1,
    moduleTitle: 'Conscience Financiere',
    difficulty: 'decouverte',
    savoir: "Connaitre son budget hebdomadaire, c'est comme connaitre la jauge d'essence de sa voiture. Sans ca, on roule a l'aveugle.",
    faire: "Avoir enregistre des depenses pour voir la barre de progression",
    maitriserDesc: "Depenses enregistrees cette semaine (budget actif)",
    conditionKey: 'S3',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S4', week: 4, quarter: 1, module: 1,
    moduleTitle: 'Conscience Financiere',
    difficulty: 'decouverte',
    savoir: "La photo de fin de semaine : combien j'ai gagne, depense, economise. C'est le bilan qui cree la conscience.",
    faire: "Avoir un bilan hebdomadaire genere (WeeklySummary)",
    maitriserDesc: "Un enregistrement de performance sauvegarde cette semaine",
    conditionKey: 'S4',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
];

const MODULE_2: FinancialChallenge[] = [
  {
    id: 'S5', week: 5, quarter: 1, module: 2,
    moduleTitle: 'Budget & Discipline',
    difficulty: 'decouverte',
    savoir: "Le budget n'est pas une prison. C'est une route — depasser les lignes est dangereux, rester dans les voies est confortable.",
    faire: "Terminer la semaine avec un taux d'execution sous 100%",
    maitriserDesc: "Depenses < budget hebdomadaire",
    conditionKey: 'S5',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S6', week: 6, quarter: 1, module: 2,
    moduleTitle: 'Budget & Discipline',
    difficulty: 'decouverte',
    savoir: "Un achat impulsif coute en moyenne 3x plus cher que ce que vous pensez, car c'est de l'argent qui ne travaille plus pour vous.",
    faire: "Utiliser le bouclier anti-impulsif au moins 1 fois",
    maitriserDesc: "Bouclier anti-impulsif utilise cette semaine",
    conditionKey: 'manual',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S7', week: 7, quarter: 1, module: 2,
    moduleTitle: 'Budget & Discipline',
    difficulty: 'decouverte',
    savoir: "La regle des 85% : les meilleurs gestionnaires ne depensent que 85% de leur budget. Les 15% restants sont leur marge de manoeuvre.",
    faire: "Terminer la semaine sous 85% du budget",
    maitriserDesc: "Taux d'execution <= 85%",
    conditionKey: 'S7',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S8', week: 8, quarter: 1, module: 2,
    moduleTitle: 'Budget & Discipline',
    difficulty: 'decouverte',
    savoir: "La discipline n'est pas la privation. C'est choisir ce qui compte vraiment plutot que ce qui tente sur le moment.",
    faire: "Enregistrer au moins 1 transaction par jour (5 jours minimum)",
    maitriserDesc: "5 jours avec transactions cette semaine",
    conditionKey: 'S8',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
];

const MODULE_3: FinancialChallenge[] = [
  {
    id: 'S9', week: 9, quarter: 1, module: 3,
    moduleTitle: 'Premiers Pas d\'Epargne',
    difficulty: 'decouverte',
    savoir: "Epargner, ce n'est pas garder ce qui reste. C'est mettre de cote AVANT de depenser. Pay Yourself First.",
    faire: "Terminer la semaine avec des economies positives",
    maitriserDesc: "Economies > 0 cette semaine",
    conditionKey: 'S9',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S10', week: 10, quarter: 1, module: 3,
    moduleTitle: 'Premiers Pas d\'Epargne',
    difficulty: 'decouverte',
    savoir: "Un fonds d'urgence couvre 3 mois de depenses. Sans lui, le moindre imprevu peut vous mettre a genoux financierement.",
    faire: "Creer un objectif d'epargne avec l'icone urgence",
    maitriserDesc: "Un objectif 'urgence' existe",
    conditionKey: 'S10',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S11', week: 11, quarter: 1, module: 3,
    moduleTitle: 'Premiers Pas d\'Epargne',
    difficulty: 'decouverte',
    savoir: "La constance bat l'intensite. Epargner 5 000 FCFA chaque semaine vaut mieux que 50 000 une fois par trimestre.",
    faire: "Faire une contribution a un objectif d'epargne",
    maitriserDesc: "Au moins 1 contribution cette semaine",
    conditionKey: 'S11',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
  {
    id: 'S12', week: 12, quarter: 1, module: 3,
    moduleTitle: 'Premiers Pas d\'Epargne',
    difficulty: 'decouverte',
    savoir: "Bilan T1 : regardez votre tirelire. Chaque franc ici est une preuve que vous pouvez changer votre avenir.",
    faire: "Avoir un solde positif dans la tirelire",
    maitriserDesc: "Economies cumulees (tirelire) > 0",
    conditionKey: 'S12',
    points: { savoir: 30, faire: 50, maitriser: 20 },
  },
];

// ─── T2: L'OPTIMISATION (S13-S24) ───

const MODULE_4: FinancialChallenge[] = [
  {
    id: 'S13', week: 13, quarter: 2, module: 4,
    moduleTitle: 'Revenus & Diversification',
    difficulty: 'intermediaire',
    savoir: "Vous ne pouvez pas economiser ce que vous ne gagnez pas. Suivre vos rentrees d'argent est aussi important que suivre vos depenses.",
    faire: "Enregistrer une rentree d'argent (salaire ou autre)",
    maitriserDesc: "Au moins 1 revenu enregistre cette semaine",
    conditionKey: 'S13',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S14', week: 14, quarter: 2, module: 4,
    moduleTitle: 'Revenus & Diversification',
    difficulty: 'intermediaire',
    savoir: "Dependre d'une seule source de revenu, c'est marcher sur un fil. La diversification est un filet de securite.",
    faire: "Enregistrer une rentree hors salaire (primes, freelance...)",
    maitriserDesc: "Un revenu non-salaire enregistre cette semaine",
    conditionKey: 'S14',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S15', week: 15, quarter: 2, module: 4,
    moduleTitle: 'Revenus & Diversification',
    difficulty: 'intermediaire',
    savoir: "Le ratio revenus/depenses est votre indicateur vital. Au-dessus de 1, vous construisez. En dessous, vous detruisez.",
    faire: "Avoir un solde net positif (revenus > depenses) cette semaine",
    maitriserDesc: "Revenus hebdo > depenses hebdo",
    conditionKey: 'S15',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S16', week: 16, quarter: 2, module: 4,
    moduleTitle: 'Revenus & Diversification',
    difficulty: 'intermediaire',
    savoir: "Chaque source de revenu supplementaire reduit votre vulnerabilite de 25%. Deux sources valent mieux qu'une.",
    faire: "Avoir des rentrees dans au moins 2 sources differentes ce mois",
    maitriserDesc: "2 sources de revenus differentes ce mois",
    conditionKey: 'S16',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
];

const MODULE_5: FinancialChallenge[] = [
  {
    id: 'S17', week: 17, quarter: 2, module: 5,
    moduleTitle: 'Maitrise des Categories',
    difficulty: 'intermediaire',
    savoir: "Le poste alimentaire est souvent le premier poste de depense. Le surveiller, c'est surveiller 30 a 40% de votre budget.",
    faire: "Consulter le detail d'une categorie de depenses",
    maitriserDesc: "Detail categorie consulte",
    conditionKey: 'manual',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S18', week: 18, quarter: 2, module: 5,
    moduleTitle: 'Maitrise des Categories',
    difficulty: 'intermediaire',
    savoir: "Les depenses fixes (logement, telecom) sont les plus dangereuses : on les oublie parce qu'elles sont automatiques.",
    faire: "Enregistrer au moins 2 depenses de type Fixe cette semaine",
    maitriserDesc: "2 transactions Fixe enregistrees",
    conditionKey: 'S18',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S19', week: 19, quarter: 2, module: 5,
    moduleTitle: 'Maitrise des Categories',
    difficulty: 'intermediaire',
    savoir: "La categorie ou vous depensez le plus est celle ou vous avez le plus de marge d'amelioration.",
    faire: "Reduire les depenses de votre categorie n°1 par rapport a la semaine precedente",
    maitriserDesc: "Top categorie en baisse vs semaine precedente",
    conditionKey: 'S19',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S20', week: 20, quarter: 2, module: 5,
    moduleTitle: 'Maitrise des Categories',
    difficulty: 'intermediaire',
    savoir: "Le zero depassement dans une categorie est une victoire. 4 categories sans depassement = semaine excellente.",
    faire: "Avoir au moins 4 categories sous budget cette semaine",
    maitriserDesc: "4+ categories sous budget",
    conditionKey: 'S20',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
];

const MODULE_6: FinancialChallenge[] = [
  {
    id: 'S21', week: 21, quarter: 2, module: 6,
    moduleTitle: 'Objectifs & Projets',
    difficulty: 'intermediaire',
    savoir: "Un objectif sans montant ni echeance n'est qu'un reve. Chiffrez-le et datez-le pour le rendre reel.",
    faire: "Creer un objectif avec un montant ET une echeance",
    maitriserDesc: "Un objectif avec deadline existe",
    conditionKey: 'S21',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S22', week: 22, quarter: 2, module: 6,
    moduleTitle: 'Objectifs & Projets',
    difficulty: 'intermediaire',
    savoir: "Les petites contributions regulieres battent les gros versements occasionnels. La regularite cree l'habitude.",
    faire: "Faire 2 contributions a vos objectifs cette semaine",
    maitriserDesc: "2+ contributions cette semaine",
    conditionKey: 'S22',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S23', week: 23, quarter: 2, module: 6,
    moduleTitle: 'Objectifs & Projets',
    difficulty: 'intermediaire',
    savoir: "Avoir plusieurs objectifs en parallele force la priorisation — la competence financiere la plus precieuse.",
    faire: "Avoir au moins 2 objectifs actifs simultanement",
    maitriserDesc: "2+ objectifs actifs",
    conditionKey: 'S23',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
  {
    id: 'S24', week: 24, quarter: 2, module: 6,
    moduleTitle: 'Objectifs & Projets',
    difficulty: 'intermediaire',
    savoir: "Bilan T2 : comparez votre score financier d'aujourd'hui a celui du debut. La progression est la vraie victoire.",
    faire: "Avoir un score financier en hausse par rapport au T1",
    maitriserDesc: "Score actuel > score sauvegarde precedemment",
    conditionKey: 'S24',
    points: { savoir: 25, faire: 50, maitriser: 25 },
  },
];

// ─── T3: LA CROISSANCE (S25-S36) ───

const MODULE_7: FinancialChallenge[] = [
  {
    id: 'S25', week: 25, quarter: 3, module: 7,
    moduleTitle: 'Epargne Avancee',
    difficulty: 'avance',
    savoir: "L'EPR (Epargne Potentielle Realisable) est VOTRE cible personnalisee. Elle n'est pas arbitraire — elle est calculee sur VOS revenus et depenses.",
    faire: "Avoir un target EPR actif et des depenses enregistrees",
    maitriserDesc: "Target EPR > 0 et depenses > 0",
    conditionKey: 'S25',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S26', week: 26, quarter: 3, module: 7,
    moduleTitle: 'Epargne Avancee',
    difficulty: 'avance',
    savoir: "La distribution 67/33 : deux tiers de vos economies pour l'epargne dure, un tiers pour le plaisir. L'equilibre empeche la frustration.",
    faire: "Atteindre un grade minimum B cette semaine (note >= 7/10)",
    maitriserDesc: "Grade B ou superieur",
    conditionKey: 'S26',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S27', week: 27, quarter: 3, module: 7,
    moduleTitle: 'Epargne Avancee',
    difficulty: 'avance',
    savoir: "Le surplus au-dela du target EPR est du capital libre. C'est l'accelerateur de vos projets.",
    faire: "Depasser le target EPR (economies > target)",
    maitriserDesc: "Economies > target EPR hebdomadaire",
    conditionKey: 'S27',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S28', week: 28, quarter: 3, module: 7,
    moduleTitle: 'Epargne Avancee',
    difficulty: 'avance',
    savoir: "4 semaines consecutives d'economies positives = formation d'habitude. Votre cerveau commence a le faire automatiquement.",
    faire: "Avoir 4 semaines consecutives avec economies > 0",
    maitriserDesc: "4 dernieres semaines toutes positives",
    conditionKey: 'S28',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
];

const MODULE_8: FinancialChallenge[] = [
  {
    id: 'S29', week: 29, quarter: 3, module: 8,
    moduleTitle: 'Performance & Analyse',
    difficulty: 'avance',
    savoir: "Le calendrier de performance est votre miroir financier. Les semaines vertes sont vos victoires, les rouges vos lecons.",
    faire: "Consulter le calendrier dans l'onglet Performance",
    maitriserDesc: "Historique de performance consulte (4+ semaines enregistrees)",
    conditionKey: 'S29',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S30', week: 30, quarter: 3, module: 8,
    moduleTitle: 'Performance & Analyse',
    difficulty: 'avance',
    savoir: "La tendance importe plus que le resultat isole. 3 semaines de hausse valent plus qu'1 semaine parfaite.",
    faire: "Avoir un trend haussier sur le score financier",
    maitriserDesc: "Tendance du score = hausse",
    conditionKey: 'S30',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S31', week: 31, quarter: 3, module: 8,
    moduleTitle: 'Performance & Analyse',
    difficulty: 'avance',
    savoir: "Objectif vs Realise : la section qui montre si votre plan tient la route. Un ecart > 20% demande un ajustement.",
    faire: "Avoir un prorata d'execution entre 80% et 120%",
    maitriserDesc: "Progression globale entre 80-120%",
    conditionKey: 'S31',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S32', week: 32, quarter: 3, module: 8,
    moduleTitle: 'Performance & Analyse',
    difficulty: 'avance',
    savoir: "Le grade A n'est pas un luxe. C'est accessible si vous depensez moins de 70% de votre budget hebdomadaire.",
    faire: "Obtenir un grade A ou A+ cette semaine",
    maitriserDesc: "Grade A ou A+",
    conditionKey: 'S32',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
];

const MODULE_9: FinancialChallenge[] = [
  {
    id: 'S33', week: 33, quarter: 3, module: 9,
    moduleTitle: 'Strategie & Anticipation',
    difficulty: 'avance',
    savoir: "La fin de mois est le piege classique : les depenses s'accumulent, le budget fond. Anticipez en depensant moins en debut de mois.",
    faire: "Terminer la semaine sous 80% du budget",
    maitriserDesc: "Taux d'execution < 80%",
    conditionKey: 'S33',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S34', week: 34, quarter: 3, module: 9,
    moduleTitle: 'Strategie & Anticipation',
    difficulty: 'avance',
    savoir: "Chaque objectif atteint prouve que vous avez la capacite d'atteindre le suivant. La confiance financiere se construit par la preuve.",
    faire: "Avoir au moins 1 objectif d'epargne complete",
    maitriserDesc: "1+ objectif complete",
    conditionKey: 'S34',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S35', week: 35, quarter: 3, module: 9,
    moduleTitle: 'Strategie & Anticipation',
    difficulty: 'avance',
    savoir: "Le score financier au-dessus de 70 place dans les 20% des meilleurs gestionnaires. Au-dessus de 80, dans les 10%.",
    faire: "Atteindre un score financier global >= 70",
    maitriserDesc: "Score financier >= 70",
    conditionKey: 'S35',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
  {
    id: 'S36', week: 36, quarter: 3, module: 9,
    moduleTitle: 'Strategie & Anticipation',
    difficulty: 'avance',
    savoir: "Bilan T3 : 9 mois de discipline. Votre tirelire et vos objectifs racontent votre transformation.",
    faire: "Avoir un cumul d'economies positif significatif",
    maitriserDesc: "Tirelire nette > 0 avec 20+ semaines d'historique",
    conditionKey: 'S36',
    points: { savoir: 20, faire: 50, maitriser: 30 },
  },
];

// ─── T4: LA MAITRISE (S37-S48) ───

const MODULE_10: FinancialChallenge[] = [
  {
    id: 'S37', week: 37, quarter: 4, module: 10,
    moduleTitle: 'Resilience Financiere',
    difficulty: 'expert',
    savoir: "Tout le monde a des mauvaises semaines. Le maitre financier limite les degats et rebondit la semaine suivante.",
    faire: "Si depassement la semaine precedente : revenir sous budget cette semaine",
    maitriserDesc: "Rebond apres depassement, ou semaine sous budget",
    conditionKey: 'S37',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S38', week: 38, quarter: 4, module: 10,
    moduleTitle: 'Resilience Financiere',
    difficulty: 'expert',
    savoir: "Le fonds d'urgence n'est pas un objectif — c'est une obligation. Il doit representer 3x vos depenses mensuelles.",
    faire: "Objectif urgence a >= 50% de progression",
    maitriserDesc: "Objectif urgence >= 50% complete",
    conditionKey: 'S38',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S39', week: 39, quarter: 4, module: 10,
    moduleTitle: 'Resilience Financiere',
    difficulty: 'expert',
    savoir: "La regularite des revenus se mesure sur 8 semaines. Si vous atteignez 80% de vos previsions, votre modele est solide.",
    faire: "Avoir des revenus enregistres regulierement",
    maitriserDesc: "Revenus enregistres dans au moins 4 des 8 dernieres semaines",
    conditionKey: 'S39',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S40', week: 40, quarter: 4, module: 10,
    moduleTitle: 'Resilience Financiere',
    difficulty: 'expert',
    savoir: "Le stress financier diminue de 60% quand on a un plan ET qu'on le suit. Le plan seul ne suffit pas.",
    faire: "Score REG >= 80 ET score PRE >= 70 (via score financier sauvegarde)",
    maitriserDesc: "Regularite forte + precision budgetaire solide",
    conditionKey: 'S40',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
];

const MODULE_11: FinancialChallenge[] = [
  {
    id: 'S41', week: 41, quarter: 4, module: 11,
    moduleTitle: 'Vision Long Terme',
    difficulty: 'expert',
    savoir: "L'An 2 du plan double l'objectif EPR. Si vous maitrisez l'An 1, l'An 2 est une acceleration naturelle, pas un choc.",
    faire: "Avoir 10+ semaines avec grade B ou superieur dans l'historique",
    maitriserDesc: "10+ semaines grade B/A/A+",
    conditionKey: 'S41',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S42', week: 42, quarter: 4, module: 11,
    moduleTitle: 'Vision Long Terme',
    difficulty: 'expert',
    savoir: "3 objectifs d'epargne actifs = diversification du futur. Urgence + Plaisir + Projet = equilibre parfait.",
    faire: "Avoir 3 objectifs actifs de categories differentes",
    maitriserDesc: "3 objectifs actifs, 3 icones differentes",
    conditionKey: 'S42',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S43', week: 43, quarter: 4, module: 11,
    moduleTitle: 'Vision Long Terme',
    difficulty: 'expert',
    savoir: "Vos 5 leviers de score financier sont comme les 5 doigts de la main. Le plus faible determine la force de votre prise.",
    faire: "Avoir les 5 leviers du score au-dessus de 50",
    maitriserDesc: "Tous les leviers >= 50",
    conditionKey: 'S43',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S44', week: 44, quarter: 4, module: 11,
    moduleTitle: 'Vision Long Terme',
    difficulty: 'expert',
    savoir: "Le patrimoine ne se construit pas en un jour, mais il se construit chaque jour. Votre regularite des 11 derniers mois le prouve.",
    faire: "Score de regularite d'epargne (REG) >= 85",
    maitriserDesc: "Levier REG >= 85",
    conditionKey: 'S44',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
];

const MODULE_12: FinancialChallenge[] = [
  {
    id: 'S45', week: 45, quarter: 4, module: 12,
    moduleTitle: 'Excellence Financiere',
    difficulty: 'expert',
    savoir: "Les 3 dernieres semaines de l'annee sont les plus difficiles (fetes, pressions sociales). Tenir le cap ici, c'est l'ultime preuve de maitrise.",
    faire: "Maintenir le budget sous 90% malgre la periode",
    maitriserDesc: "Taux d'execution <= 90%",
    conditionKey: 'S45',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S46', week: 46, quarter: 4, module: 12,
    moduleTitle: 'Excellence Financiere',
    difficulty: 'expert',
    savoir: "Chaque contribution a vos objectifs est un vote pour la personne que vous voulez devenir.",
    faire: "Contribuer a au moins 2 objectifs differents cette semaine",
    maitriserDesc: "Contributions a 2+ objectifs differents",
    conditionKey: 'S46',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S47', week: 47, quarter: 4, module: 12,
    moduleTitle: 'Excellence Financiere',
    difficulty: 'expert',
    savoir: "Score financier >= 75 sur 48 semaines. Vous faites partie des 15% qui terminent ce qu'ils commencent.",
    faire: "Score financier global >= 75",
    maitriserDesc: "Score >= 75",
    conditionKey: 'S47',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
  {
    id: 'S48', week: 48, quarter: 4, module: 12,
    moduleTitle: 'Excellence Financiere',
    difficulty: 'expert',
    savoir: "Bilan annuel : comptez vos objectifs atteints, vos economies cumulees, votre progression de score. Vous n'etes plus la meme personne qu'a la S1.",
    faire: "Avoir complete au moins 40 defis sur 48",
    maitriserDesc: "40+ defis completes",
    conditionKey: 'S48',
    points: { savoir: 15, faire: 45, maitriser: 40 },
  },
];

// ─── Export ───

export const FINANCIAL_CHALLENGES: FinancialChallenge[] = [
  ...MODULE_1,
  ...MODULE_2,
  ...MODULE_3,
  ...MODULE_4,
  ...MODULE_5,
  ...MODULE_6,
  ...MODULE_7,
  ...MODULE_8,
  ...MODULE_9,
  ...MODULE_10,
  ...MODULE_11,
  ...MODULE_12,
];

export const CHALLENGES_BY_ID: Record<string, FinancialChallenge> = {};
for (const c of FINANCIAL_CHALLENGES) {
  CHALLENGES_BY_ID[c.id] = c;
}

export const MODULE_TITLES: Record<number, string> = {
  1: 'Conscience Financiere',
  2: 'Budget & Discipline',
  3: 'Premiers Pas d\'Epargne',
  4: 'Revenus & Diversification',
  5: 'Maitrise des Categories',
  6: 'Objectifs & Projets',
  7: 'Epargne Avancee',
  8: 'Performance & Analyse',
  9: 'Strategie & Anticipation',
  10: 'Resilience Financiere',
  11: 'Vision Long Terme',
  12: 'Excellence Financiere',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  decouverte: 'Decouverte',
  intermediaire: 'Intermediaire',
  avance: 'Avance',
  expert: 'Expert',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  decouverte: '#4ADE80',
  intermediaire: '#60A5FA',
  avance: '#A78BFA',
  expert: '#FBBF24',
};
