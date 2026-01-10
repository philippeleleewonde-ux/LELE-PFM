# Les 6 Compétences Cardinales - Guide d'Exécution

## 1. Architecture Produit et Scalabilité

### Technologies Backend Maîtrisées

#### Node.js
**Quand l'utiliser:**
- APIs REST/GraphQL haute performance
- Real-time (WebSockets, Server-Sent Events)
- Microservices légers
- Intégrations tierces (Stripe, SendGrid)

**Stack recommandée:**
```
Express.js / Fastify pour APIs
tRPC pour type-safety bout-en-bout
Prisma pour ORM
Bull/BullMQ pour queues
```

**Pattern d'implémentation:**
```typescript
// API structure type-safe
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './trpc';

export const appRouter = router({
  user: {
    create: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        // Implémentation complète
      }),
    update: protectedProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Avec auth context
      })
  }
});
```

#### Python (FastAPI, Django)
**Quand l'utiliser:**
- ML/AI features intégrées
- Data processing lourd
- APIs complexes avec typage strict
- Admin robuste (Django)

**Stack recommandée:**
```
FastAPI + SQLAlchemy pour APIs modernes
Django + DRF pour admin + API
Celery pour background tasks
Redis pour caching
```

**Pattern d'implémentation:**
```python
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI()

@app.post("/users/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Implémentation avec validation Pydantic
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    return db_user
```

#### Go
**Quand l'utiliser:**
- Performance critique (< 10ms latency)
- Microservices haute concurrence
- CLI tools et automation
- Systèmes distribués

**Non recommandé pour:**
- MVP rapides (trop verbeux)
- Équipes sans expérience Go
- Prototypage rapide

### Microservices vs Monolithe

**Règle d'or:** Commencer monolithe, séparer en microservices à 10k+ users actifs

**Architecture monolithe modulaire (0-10k users):**
```
app/
├── api/          # API routes
├── core/         # Business logic
├── db/           # Database models
├── services/     # External integrations
└── workers/      # Background jobs
```

**Migration microservices (10k+ users):**
```
Étape 1: Identifier bounded contexts
Étape 2: Extraire services un par un
Étape 3: API Gateway (Kong, AWS API Gateway)
Étape 4: Service mesh si >50k users (Istio)
```

### Serverless

**Quand utiliser:**
- Trafic sporadique/imprévisible
- Fonctions isolées (image processing, PDF gen)
- Scaling automatique sans DevOps

**Stack recommandée:**
```
Vercel Functions (Next.js)
AWS Lambda + API Gateway
Cloudflare Workers (edge)
```

**Anti-pattern:**
- Serverless pour tout (cold starts)
- Functions longues (>10s)
- État persistant dans functions

### APIs REST & GraphQL

**REST quand:**
- CRUD simple et clair
- Caching HTTP standard
- Clients multiples (mobile, web, third-party)

**GraphQL quand:**
- UI complexe avec données imbriquées
- Éviter over-fetching
- Équipe frontend autonome

**Pattern REST optimal:**
```
GET    /api/users              # List
GET    /api/users/:id          # Read
POST   /api/users              # Create
PUT    /api/users/:id          # Update
DELETE /api/users/:id          # Delete
POST   /api/users/:id/activate # Actions
```

### Cloud (AWS, GCP, Azure)

**Choix par défaut: AWS** (ecosystem le plus mature)

**Services essentiels à maîtriser:**
```
Compute:  EC2, ECS, Lambda
Database: RDS (PostgreSQL), DynamoDB
Storage:  S3, CloudFront (CDN)
Queue:    SQS, SNS
Cache:    ElastiCache (Redis)
```

**Multi-cloud:** Éviter sauf contrainte enterprise (complexité 3x)

### Docker & Kubernetes

**Docker: Toujours**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Kubernetes: Uniquement si >50k users actifs**
Sinon: Docker + cloud managed services (ECS, Cloud Run)

### Modélisation Database (PostgreSQL + Redis)

**PostgreSQL: Source de vérité**
```sql
-- Multi-tenant SaaS schema
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
```

**Redis: Cache + Sessions**
```
sessions:{user_id}      → Session data (TTL 7d)
cache:users:{id}        → User object (TTL 1h)
rate_limit:{ip}:{path}  → Rate limiting counters
queue:email             → Job queues (Bull)
```

**Principes DB qui vieillit bien:**
1. UUID > Auto-increment (distributed systems)
2. Timestamps (created_at, updated_at) partout
3. Soft deletes (deleted_at) pour données critiques
4. Indexes sur foreign keys et colonnes WHERE
5. JSONB pour data flexible (pas abuse)
6. Migrations versionnées (Prisma, Alembic)

---

## 2. Systèmes de Growth Intégrés

### Boucles de Rétention Natives

**Pattern 1: Notification Triggers**
```typescript
// Déclencher notifs basées sur comportement
async function onUserAction(userId: string, action: string) {
  switch(action) {
    case 'project_created':
      // Notif: "Invite team members"
      await scheduleNotification(userId, 'invite_team', '+1h');
      break;
    case 'idle_7_days':
      // Notif: "See what's new"
      await sendReEngagementEmail(userId);
      break;
  }
}
```

**Pattern 2: Gamification**
```typescript
// Système de progression
interface UserProgress {
  level: number;
  xp: number;
  badges: string[];
  streak: number;
}

async function awardXP(userId: string, action: string) {
  const xp = XP_BY_ACTION[action]; // { create_project: 10, ... }
  const progress = await updateUserXP(userId, xp);
  
  if (progress.leveledUp) {
    await unlockFeature(userId, progress.newLevel);
  }
}
```

**Pattern 3: Viral Loops**
```typescript
// Referral intégré au produit
async function inviteTeamMember(inviterId: string, email: string) {
  const invite = await db.invite.create({
    data: { inviterId, email, token: generateToken() }
  });
  
  await sendEmail({
    to: email,
    template: 'team_invite',
    data: {
      inviterName: await getUser(inviterId).name,
      signupLink: `${APP_URL}/join/${invite.token}`
    }
  });
  
  // Reward inviter when invite accepted
  await rewardInviter(inviterId, 'invite_sent');
}
```

### Tracking Complet

**Mixpanel / Segment / Amplitude**
```typescript
// Wrapper tracking universel
class Analytics {
  track(event: string, properties?: object) {
    mixpanel.track(event, properties);
    segment.track(event, properties);
    
    // Store in DB for custom analytics
    db.events.create({ event, properties, userId: this.userId });
  }
  
  identify(userId: string, traits: object) {
    mixpanel.identify(userId);
    mixpanel.people.set(traits);
    segment.identify(userId, traits);
  }
}

// Usage
analytics.track('project_created', {
  projectType: 'website',
  plan: 'pro'
});
```

**Événements critiques à tracker:**
```
Acquisition:
- signup_started
- signup_completed
- source (utm_source, utm_campaign)

Activation:
- onboarding_started
- onboarding_completed
- first_value_moment (ex: first_project_created)

Engagement:
- feature_used
- session_duration
- daily_active / weekly_active

Retention:
- return_visit (D1, D7, D30)
- churn_risk_score

Revenue:
- upgrade_initiated
- payment_completed
- plan_changed
```

### Automatisation Onboarding

**Séquence email post-signup:**
```typescript
// Day 0: Welcome + quick start
// Day 1: Feature highlight
// Day 3: Use case examples
// Day 7: Success stories
// Day 14: Upgrade prompt (if still free)

async function startOnboardingSequence(userId: string) {
  await scheduleEmailSequence(userId, [
    { delay: '0h',   template: 'welcome' },
    { delay: '24h',  template: 'feature_1' },
    { delay: '72h',  template: 'use_cases' },
    { delay: '168h', template: 'social_proof' },
    { delay: '336h', template: 'upgrade_nudge' }
  ]);
}
```

**In-app onboarding:**
```typescript
// Progressive disclosure
const onboardingSteps = [
  { id: 'profile', required: true },
  { id: 'first_project', required: true },
  { id: 'invite_team', required: false },
  { id: 'integrate_tool', required: false }
];

// Checklist visible in app
function OnboardingChecklist() {
  const completed = useOnboardingProgress();
  return (
    <div>
      {onboardingSteps.map(step => (
        <ChecklistItem 
          key={step.id}
          completed={completed.includes(step.id)}
          onClick={() => startStep(step.id)}
        />
      ))}
    </div>
  );
}
```

### Referrals & Upsells via API

**Referral program:**
```typescript
// Générer lien unique
async function getReferralLink(userId: string) {
  const code = await db.user.findUnique({ where: { id: userId } })
    .select({ referralCode: true });
  
  return `${APP_URL}/signup?ref=${code}`;
}

// Reward system
async function onReferralConversion(referrerId: string, newUserId: string) {
  // Reward referrer
  await grantCredit(referrerId, REFERRAL_REWARD);
  
  // Reward new user
  await grantCredit(newUserId, SIGNUP_BONUS);
  
  // Track
  await analytics.track('referral_converted', {
    referrerId,
    newUserId
  });
}
```

**Upsell automatique:**
```typescript
// Trigger basé sur usage
async function checkUpsellTriggers(userId: string) {
  const usage = await getUserUsage(userId);
  const plan = await getUserPlan(userId);
  
  if (plan === 'free' && usage.projects > 3) {
    await sendUpsellEmail(userId, 'project_limit');
  }
  
  if (plan === 'pro' && usage.teamMembers > 10) {
    await sendUpsellEmail(userId, 'team_limit');
  }
}
```

---

## 3. Design UX Orienté Conversion

### Psychologie Comportementale

**Friction Cognitive - Éliminer**
```tsx
// ❌ Bad: Trop de champs
<form>
  <Input label="First Name" />
  <Input label="Last Name" />
  <Input label="Email" />
  <Input label="Password" />
  <Input label="Confirm Password" />
  <Input label="Company" />
  <Input label="Phone" />
</form>

// ✅ Good: Minimum viable signup
<form>
  <Input label="Email" />
  <Input label="Password" />
  <Button>Get Started</Button>
</form>
// Collecter le reste progressivement
```

**Dopamine Loops**
```tsx
// Récompense immédiate après action
function ProjectCreated() {
  return (
    <SuccessModal>
      <Confetti />
      <h2>🎉 Project Created!</h2>
      <p>You earned 50 XP</p>
      <Button>Invite your team</Button>
    </SuccessModal>
  );
}
```

**Anticipation & FOMO**
```tsx
// Countdown timer pour deals
function PricingCard() {
  return (
    <Card>
      <Badge>Limited Offer</Badge>
      <h3>Pro Plan - 50% OFF</h3>
      <Countdown endDate="2025-12-31" />
      <Button>Claim Discount</Button>
    </Card>
  );
}
```

### UI Minimaliste & Émotionnelle

**Stack: Tailwind + shadcn/ui**
```tsx
// Composant émotionnel
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <Image src="/empty-state.svg" alt="No projects" />
      <h3 className="text-2xl font-bold mt-6">
        Your creative journey starts here
      </h3>
      <p className="text-muted-foreground mt-2">
        Create your first project and bring your ideas to life
      </p>
      <Button size="lg" className="mt-6">
        Create Project
      </Button>
    </div>
  );
}
```

### Tests A/B Rapides

**Implementation simple:**
```typescript
// Feature flag-based A/B testing
async function getVariant(userId: string, experimentId: string) {
  const hash = hashUserId(userId + experimentId);
  return hash % 2 === 0 ? 'A' : 'B';
}

// Usage
function PricingPage() {
  const variant = useVariant('pricing_page_redesign');
  
  return variant === 'A' 
    ? <OldPricingLayout />
    : <NewPricingLayout />;
}
```

---

## 4. Machine d'Acquisition Autonome

### SEO + Content Engine

**Structure programmatique:**
```typescript
// Générer pages SEO automatiquement
async function generateSEOPages() {
  const templates = await db.template.findMany();
  
  for (const template of templates) {
    const page = {
      slug: `/templates/${template.slug}`,
      title: `${template.name} Template | ProductName`,
      description: template.description,
      content: renderTemplate(template)
    };
    
    await generateStaticPage(page);
  }
}
```

### Email Automation

**Séquences comportementales:**
```typescript
// Trigger-based emails
const emailSequences = {
  abandoned_cart: [
    { delay: '1h', template: 'cart_reminder' },
    { delay: '24h', template: 'cart_discount' },
    { delay: '72h', template: 'cart_last_chance' }
  ],
  trial_ending: [
    { delay: '-7d', template: 'trial_week_left' },
    { delay: '-1d', template: 'trial_ending_soon' },
    { delay: '+1d', template: 'trial_expired' }
  ]
};
```

---

## 5. Mécanismes de Monétisation Solides

### Stripe Integration Complète

**Webhooks robustes:**
```typescript
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, sig, secret);
  
  switch (event.type) {
    case 'checkout.session.completed':
      await activateSubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleCancellation(event.data.object);
      break;
  }
  
  return new Response('ok');
}
```

### Dashboards Financiers

**Métriques temps réel:**
```sql
-- MRR (Monthly Recurring Revenue)
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) / 100 as mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY month;

-- Churn Rate
SELECT 
  COUNT(*) FILTER (WHERE canceled_at IS NOT NULL) * 100.0 / 
  COUNT(*) as churn_rate
FROM subscriptions
WHERE created_at >= NOW() - INTERVAL '30 days';
```

---

## 6. Vision Produit et Psychologie Utilisateur

### Job-to-be-Done Framework

**Questions à poser:**
```
1. Quelle est la situation qui pousse à chercher une solution?
2. Quel progrès l'utilisateur veut-il accomplir?
3. Quelles sont les forces qui poussent au changement?
4. Quelles sont les anxiétés qui freinent l'adoption?
```

**Implémentation:**
```typescript
// Onboarding basé sur JTBD
function OnboardingFlow() {
  const [jtbd, setJTBD] = useState<string>();
  
  return (
    <Steps>
      <Step1>
        <h2>What brings you here today?</h2>
        <Options>
          <Option onClick={() => setJTBD('automate_workflows')}>
            Automate repetitive tasks
          </Option>
          <Option onClick={() => setJTBD('collaborate_team')}>
            Collaborate with my team
          </Option>
          <Option onClick={() => setJTBD('track_projects')}>
            Track project progress
          </Option>
        </Options>
      </Step1>
      
      <Step2>
        {/* Personnaliser l'expérience selon JTBD */}
        <WelcomeMessage jtbd={jtbd} />
        <QuickStartGuide jtbd={jtbd} />
      </Step2>
    </Steps>
  );
}
```

### Data-Driven Empathy

**Écouter les données, pas les opinions:**
```typescript
// Analyser comportement réel
async function analyzeUserBehavior(userId: string) {
  const events = await db.events.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  // Patterns d'usage
  const patterns = {
    mostUsedFeatures: groupBy(events, 'event').sort(),
    sessionDuration: calculateAvgDuration(events),
    dropOffPoints: findDropOffs(events),
    valueRealized: hasReachedAhaMoment(events)
  };
  
  return patterns;
}
```

**Principes:**
1. Ce que les users FONT > ce qu'ils DISENT
2. Segmenter par comportement, pas démographie
3. Interviewer pour comprendre le "pourquoi"
4. Mesurer tout, optimiser ce qui compte
