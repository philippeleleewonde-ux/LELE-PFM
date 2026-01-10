# Architecture Decision Record - HCM Data Extractor V2

**Date**: 2025-11-25
**Status**: APPROVED
**Auteur**: Elite Frontend Auditor + Elite Backend Architect
**Version**: 2.0 (Refactoring complet)

---

## 🎯 Contexte et Objectifs

### Problème à résoudre

L'utilisateur doit actuellement saisir manuellement des données financières complexes dans **HCM Performance Plan**. Ce processus est :
- **Long** : Plusieurs heures de saisie manuelle
- **Sujet aux erreurs** : Risque de fautes de frappe, d'oublis
- **Non scalable** : Impossible de traiter plusieurs entreprises rapidement

### Objectifs du module HCM Data Extractor V2

Créer un système intelligent qui :

1. **Automatise l'extraction** de 10 zones de données financières et de risque
2. **Guide l'utilisateur** via un workflow conversationnel (questions/réponses)
3. **Calcule intelligemment** les métriques quand elles ne sont pas disponibles directement
4. **Valide avec l'utilisateur** chaque donnée extraite/calculée
5. **Injecte automatiquement** les données validées dans HCM Performance Plan

### Les 10 zones à traiter

| Zone | Donnée | Extraction | Calcul |
|------|--------|------------|--------|
| 1 | Lignes d'activités (8 catégories) | ✅ Détection directe | ✅ Agrégation comptable |
| 2 | Heures annuelles travaillées/employé | ✅ Si mentionné | ✅ Calcul RH |
| 3 | CA + Charges (5 ans) | ✅ Extraction directe | ❌ N/A |
| 4 | Unexpected Loss (UL) Data | ✅ Si mentionné | ✅ Formule Basel |
| 5 | Operational Risk (Basel II QIS 2) | ✅ Si mentionné | ✅ Classification |
| 6 | Credit Counterparty Risk | ✅ Si mentionné | ✅ Modèle PD |
| 7 | Market Risk (Settlement errors) | ✅ Si mentionné | ✅ Estimation |
| 8 | Liquidity/Transformation Risk | ✅ Si mentionné | ✅ Gap analysis |
| 9 | Organizational Risk (Workforce/Equipment/Environment) | ✅ Si mentionné | ✅ Scoring |
| 10 | Health & Insurance Risk | ✅ Si mentionné | ✅ Actuarial calc |

---

## 🏗️ Architecture Globale

### Principes directeurs

1. **Backend-First** : Processing lourd côté serveur, pas dans le navigateur
2. **Asynchrone** : File queue pour traiter les uploads sans bloquer l'UI
3. **Real-time Updates** : WebSocket pour notifier le frontend du progrès
4. **Modulaire** : Chaque zone = 1 service backend indépendant
5. **Testable** : Tests unitaires + E2E sur chaque composant
6. **Scalable** : Architecture prête pour 1000+ utilisateurs simultanés

### Stack technique

#### Frontend
- **Framework** : React 18 + TypeScript (strict mode)
- **Bundler** : Vite
- **State Management** : Zustand (léger) + React Query (server state)
- **UI Components** : shadcn/ui (Radix UI + Tailwind)
- **Forms** : React Hook Form + Zod
- **WebSocket** : Socket.io-client
- **Bundle target** : < 500 KB (vs 10 MB actuel)

#### Backend
- **API** : Next.js 14 API Routes (serveur Node.js)
- **Queue System** : BullMQ (Redis-backed)
- **File Processing** :
  - PDF : `pdf-parse` (server-side, pas pdfjs-dist)
  - Excel : `xlsx` (isolé dans worker)
  - OCR : **AWS Textract** ou **Google Vision API** (externe, pas tesseract.js)
- **Database** : Supabase Postgres
  - `extracted_data` : Résultats bruts
  - `validated_data` : Données validées par user
  - `extraction_jobs` : Queue des jobs
- **Storage** : Supabase Storage (fichiers uploadés)
- **Real-time** : Socket.io (WebSocket server)
- **AI/LLM** : OpenAI GPT-4 (classification, calculs complexes)

#### Infrastructure
- **Redis** : Queue + cache
- **Monitoring** : Sentry (errors) + Vercel Analytics
- **Logs** : Structured logging (Pino)
- **Tests** : Vitest (unit) + Playwright (E2E)

---

## 📊 Architecture des Données

### Database Schema (Supabase Postgres)

```sql
-- Table principale : Jobs d'extraction
CREATE TABLE extraction_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_count INTEGER DEFAULT 0,
  progress JSONB DEFAULT '{}', -- { "zone1": 100, "zone2": 50, ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Table : Fichiers uploadés
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'excel', 'csv')),
  file_size BIGINT,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : Données extraites (brutes, avant validation)
CREATE TABLE extracted_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,
  zone_number INTEGER NOT NULL CHECK (zone_number BETWEEN 1 AND 10),
  zone_name TEXT NOT NULL,
  extraction_mode TEXT NOT NULL CHECK (extraction_mode IN ('extract', 'calculate')),
  raw_data JSONB NOT NULL, -- Format spécifique à chaque zone
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
  source_file_id UUID REFERENCES uploaded_files(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : Données validées par l'utilisateur
CREATE TABLE validated_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,
  zone_number INTEGER NOT NULL CHECK (zone_number BETWEEN 1 AND 10),
  zone_name TEXT NOT NULL,
  validated_data JSONB NOT NULL,
  user_modifications JSONB, -- Changements faits par user vs extraction
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  validated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Table : Injection vers Performance Plan (tracking)
CREATE TABLE performance_plan_injections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,
  injection_status TEXT NOT NULL CHECK (injection_status IN ('pending', 'success', 'failed')),
  injected_zones JSONB, -- Liste des zones injectées
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_extraction_jobs_user ON extraction_jobs(user_id);
CREATE INDEX idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX idx_uploaded_files_job ON uploaded_files(job_id);
CREATE INDEX idx_extracted_data_job_zone ON extracted_data(job_id, zone_number);
CREATE INDEX idx_validated_data_job ON validated_data(job_id);
```

---

## 🔄 Architecture Backend API

### API Routes Structure

```
src/app/api/
├── datascanner/
│   ├── upload/
│   │   └── route.ts              # POST /api/datascanner/upload
│   ├── jobs/
│   │   ├── [jobId]/
│   │   │   ├── route.ts          # GET /api/datascanner/jobs/:jobId
│   │   │   ├── start/
│   │   │   │   └── route.ts      # POST /api/datascanner/jobs/:jobId/start
│   │   │   └── zones/
│   │   │       ├── [zoneId]/
│   │   │       │   ├── route.ts  # GET /api/datascanner/jobs/:jobId/zones/:zoneId
│   │   │       │   ├── choose/
│   │   │       │   │   └── route.ts # POST .../choose (extract vs calculate)
│   │   │       │   └── validate/
│   │   │       │       └── route.ts # POST .../validate
│   │   └── route.ts              # GET /api/datascanner/jobs (list user jobs)
│   └── inject/
│       └── route.ts              # POST /api/datascanner/inject (to Performance Plan)
└── performance-plan/
    └── inject/
        └── route.ts              # POST /api/performance-plan/inject (API interne)
```

### Services Backend

```
src/lib/datascanner/
├── services/
│   ├── FileProcessorService.ts       # Upload, parse PDF/Excel
│   ├── ZoneExtractionService.ts      # Orchestrateur des 10 zones
│   ├── zone1/
│   │   ├── BusinessLinesExtractor.ts
│   │   └── BusinessLinesCalculator.ts
│   ├── zone2/
│   │   ├── WorkingHoursExtractor.ts
│   │   └── WorkingHoursCalculator.ts
│   ├── zone3/
│   │   └── RevenueExpensesExtractor.ts
│   ├── zone4/
│   │   ├── ULDataExtractor.ts
│   │   └── ULDataCalculator.ts        # Formules Basel II/III
│   ├── zone5/
│   │   ├── OpRiskExtractor.ts
│   │   └── OpRiskCalculator.ts        # Classification QIS 2
│   ├── zone6/
│   │   ├── CreditRiskExtractor.ts
│   │   └── CreditRiskCalculator.ts    # Modèle PD
│   ├── zone7/
│   │   ├── MarketRiskExtractor.ts
│   │   └── MarketRiskCalculator.ts
│   ├── zone8/
│   │   ├── LiquidityRiskExtractor.ts
│   │   └── LiquidityRiskCalculator.ts # Gap analysis
│   ├── zone9/
│   │   ├── OrgRiskExtractor.ts
│   │   └── OrgRiskCalculator.ts
│   └── zone10/
│       ├── HealthInsuranceExtractor.ts
│       └── HealthInsuranceCalculator.ts
├── workers/
│   ├── extractionWorker.ts          # BullMQ worker
│   └── calculationWorker.ts         # BullMQ worker (calculs lourds)
├── queues/
│   └── extractionQueue.ts           # BullMQ queue setup
└── websocket/
    └── socketServer.ts              # Socket.io server
```

---

## 🎨 Architecture Frontend

### Structure des composants

```
src/modules/datascanner-v2/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   └── ProgressTracker.tsx       # Affiche progrès des 10 zones
│   ├── upload/
│   │   ├── UploadZone.tsx
│   │   └── FileList.tsx
│   ├── zones/
│   │   ├── ZoneQuestionnaire.tsx     # "Extraire ou Calculer ?"
│   │   ├── ZoneExtractionView.tsx    # Affichage extraction en cours
│   │   ├── ZoneValidation.tsx        # Validation + modification manuelle
│   │   └── ZoneSummary.tsx           # Résumé d'une zone validée
│   ├── results/
│   │   ├── GlobalSummary.tsx         # Résumé des 10 zones
│   │   └── InjectionPanel.tsx        # Bouton injection vers Performance Plan
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── Toast.tsx
├── hooks/
│   ├── useExtractionJob.ts           # Gestion du job global
│   ├── useZoneExtraction.ts          # Hook par zone
│   ├── useWebSocket.ts               # Connexion WebSocket
│   └── usePerformancePlanInjection.ts
├── stores/
│   └── extractionStore.ts            # Zustand store
├── types/
│   ├── zones.ts                      # Types TypeScript pour chaque zone
│   └── api.ts
└── DataExtractorMain.tsx             # Point d'entrée principal
```

### Workflow Frontend (State Machine)

```typescript
type Step =
  | 'landing'
  | 'upload'
  | 'zone_question_1'
  | 'zone_extraction_1'
  | 'zone_validation_1'
  | 'zone_question_2'
  | ... (répéter pour zones 2-10)
  | 'global_summary'
  | 'injection'
  | 'completed'

type ZoneStep = 'question' | 'extraction' | 'validation' | 'completed'

interface ZoneState {
  zoneNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  step: ZoneStep
  mode: 'extract' | 'calculate' | null
  canExtract: boolean     // Détecté par backend
  canCalculate: boolean   // Détecté par backend
  extractedData: any
  validatedData: any
  userModified: boolean
}
```

---

## 🔐 Sécurité & Conformité

### Mesures de sécurité

1. **Upload de fichiers**
   - Validation MIME type côté serveur
   - Limitation taille : 50 MB max par fichier
   - Scan antivirus (ClamAV) avant processing
   - Storage sécurisé (Supabase avec RLS)

2. **API Routes**
   - Authentification requise (Supabase Auth)
   - Rate limiting : 10 uploads/heure par user
   - CORS stricte
   - Validation Zod sur tous les inputs

3. **Données sensibles**
   - Encryption at rest (Supabase native)
   - Encryption in transit (HTTPS only)
   - Logs anonymisés (pas de données PII)
   - Suppression auto après 30 jours (RGPD)

### Audit trail

Toutes les actions critiques sont loggées :
- Upload de fichiers
- Choix "extraire vs calculer"
- Modifications manuelles par user
- Injections vers Performance Plan

---

## 📈 Performance & Scalabilité

### Objectifs de performance

| Métrique | Target | Mesure |
|----------|--------|--------|
| Bundle Frontend | < 500 KB | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| API Response Time | < 200ms (p95) | New Relic |
| File Processing (Excel 5MB) | < 10s | Custom metric |
| File Processing (PDF 50MB OCR) | < 60s | Custom metric |
| Concurrent users | 1000+ | Load testing (k6) |
| WebSocket connections | 5000+ | Socket.io metrics |

### Stratégies d'optimisation

1. **Frontend**
   - Code splitting par zone (lazy loading)
   - Memoization (React.memo, useMemo)
   - Virtual scrolling (react-window) pour listes
   - Service Worker pour cache assets

2. **Backend**
   - Redis cache pour résultats fréquents
   - BullMQ pour processing asynchrone
   - Connection pooling Postgres (pgBouncer)
   - CDN pour assets statiques

---

## 🧪 Stratégie de Tests

### Tests unitaires (Vitest)

- Tous les services backend : 80%+ coverage
- Tous les calculateurs de zones : 100% coverage (critique)
- Hooks React : 70%+ coverage
- Composants UI critiques : 60%+ coverage

### Tests d'intégration

- API Routes : 100% des endpoints
- File processing : Tous types de fichiers (PDF, Excel, CSV)
- WebSocket : Connexion, déconnexion, reconnexion

### Tests E2E (Playwright)

Scénarios critiques :
1. Upload fichier → Extraction zone 1 → Validation → Injection
2. Workflow complet 10 zones (extract mode)
3. Workflow complet 10 zones (calculate mode)
4. Modification manuelle + validation
5. Erreur de fichier corrompu → Retry
6. Déconnexion WebSocket → Reconnexion

---

## 📦 Déploiement

### Environnements

- **Dev** : Local (Docker Compose)
- **Staging** : Vercel Preview
- **Production** : Vercel + Supabase Pro

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  test:
    - Lint (ESLint + Prettier)
    - Type check (TypeScript)
    - Unit tests (Vitest)
    - Build
  e2e:
    - Playwright tests
  deploy:
    if: branch == 'main'
    - Deploy to Vercel
    - Run DB migrations (Supabase)
    - Invalidate CDN cache
```

---

## 🎯 Livrables par Phase

### Phase 1 (Semaines 1-2) : Architecture & Infra
- ✅ ADR (ce document)
- ✅ Database schema
- ✅ API Routes structure
- ✅ Redis + BullMQ setup
- ✅ Tests infrastructure

### Phase 2 (Semaines 3-4) : Backend
- ✅ File upload + storage
- ✅ 10 services d'extraction
- ✅ 10 calculateurs (formules métier)
- ✅ WebSocket real-time
- ✅ Tests unitaires backend

### Phase 3 (Semaines 5-6) : Frontend
- ✅ Workflow conversationnel
- ✅ 10 composants de zone
- ✅ Validation UI
- ✅ WebSocket client
- ✅ Tests composants

### Phase 4 (Semaines 7-8) : Integration & Prod
- ✅ API Performance Plan injection
- ✅ Tests E2E complets
- ✅ Monitoring + logs
- ✅ Documentation utilisateur
- ✅ Déploiement production

---

## 🚨 Risques et Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Formules de calcul incorrectes | Moyen | Critique | Validation par expert métier + tests exhaustifs |
| Performance insuffisante (gros PDF) | Moyen | Élevé | OCR externe (AWS Textract), timeout 5min |
| WebSocket instable | Faible | Moyen | Fallback polling, auto-reconnect |
| Bundle trop gros | Faible | Moyen | Lazy loading strict, budget perf |
| Données sensibles exposées | Faible | Critique | Encryption, audit, RLS Supabase |

---

## 📚 Références

- [Basel II/III Framework](https://www.bis.org/bcbs/basel3.htm)
- [QIS 2 Operational Risk](https://www.bis.org/bcbs/qis/qisoperrisk.pdf)
- [Next.js API Routes Best Practices](https://nextjs.org/docs/api-routes/introduction)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Approuvé par** : Elite Frontend Auditor + Elite Backend Architect
**Date d'approbation** : 2025-11-25
**Prochaine révision** : Fin Phase 1 (2025-12-09)
