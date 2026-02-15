# PROMPT GEMINI 3 - Création Frontend SaaS HCM Enterprise

## 🎯 MISSION

Tu es un développeur Frontend senior spécialisé dans la création de plateformes SaaS B2B enterprise-grade. Ta mission est de créer une **plateforme HCM (Human Capital Management)** de niveau production, conçue pour gérer **10,000+ salariés** avec des fonctionnalités avancées d'analyse de performance, gestion des coûts RH, et reporting.

---

## 📋 SPÉCIFICATIONS TECHNIQUES OBLIGATOIRES

### Stack Technologique (Non-négociable)

```yaml
Framework: React 18.3+ avec TypeScript 5.8+ (strict mode)
Build Tool: Vite 5.4+
Styling: Tailwind CSS 3.4+ + CSS Modules pour cas complexes
UI Components: Radix UI + shadcn/ui
State Management:
  - Global: React Context API + Zustand
  - Server State: TanStack React Query v5
Forms: React Hook Form + Zod validation
Routing: React Router DOM v7+
Backend: Supabase (PostgreSQL + Auth + RLS + Storage)
Icons: Lucide React
Charts: Recharts
Date: date-fns
Notifications: Sonner (toast)
```

### Configuration TypeScript Stricte

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "useDefineForClassFields": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🏗️ ARCHITECTURE DU PROJET

### Structure des Dossiers

```
src/
├── components/           # Composants réutilisables globaux
│   ├── ui/              # Design System (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   └── ...
│   ├── layout/          # Composants de layout
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── PageContainer.tsx
│   └── shared/          # Composants métier partagés
│       ├── DataTable.tsx
│       ├── StatCard.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
│
├── modules/             # Feature Modules (Domain-Driven)
│   ├── auth/            # Authentification
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── AuthRouter.tsx
│   │
│   ├── dashboard/       # Tableau de bord principal
│   │   ├── components/
│   │   ├── hooks/
│   │   └── DashboardPage.tsx
│   │
│   ├── employees/       # Gestion des salariés
│   │   ├── components/
│   │   │   ├── EmployeeCard.tsx
│   │   │   ├── EmployeeTable.tsx
│   │   │   └── EmployeeForm.tsx
│   │   ├── hooks/
│   │   │   ├── useEmployees.ts
│   │   │   └── useEmployeeFilters.ts
│   │   ├── contexts/
│   │   │   └── EmployeeContext.tsx
│   │   ├── types/
│   │   │   └── employee.types.ts
│   │   └── EmployeesRouter.tsx
│   │
│   ├── performance/     # Analyse de performance
│   │   ├── components/
│   │   │   ├── PerformanceRecap.tsx
│   │   │   ├── EKHAnalysisTable.tsx
│   │   │   ├── SynthesisChart.tsx
│   │   │   └── PrimeDistribution.tsx
│   │   ├── hooks/
│   │   ├── contexts/
│   │   │   └── PerformanceDataContext.tsx
│   │   └── PerformanceRouter.tsx
│   │
│   ├── costs/           # Gestion des coûts
│   │   ├── components/
│   │   ├── hooks/
│   │   └── CostsRouter.tsx
│   │
│   └── reporting/       # Reporting et exports
│       ├── components/
│       ├── hooks/
│       └── ReportingRouter.tsx
│
├── hooks/               # Hooks globaux
│   ├── useAuth.ts
│   ├── useSupabase.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
│
├── contexts/            # Contexts globaux
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── AppContext.tsx
│
├── services/            # Services API
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── auth.service.ts
│   │   ├── employees.service.ts
│   │   └── performance.service.ts
│   └── api/
│       └── index.ts
│
├── lib/                 # Utilitaires
│   ├── utils.ts         # cn(), formatters, etc.
│   ├── constants.ts
│   └── validators.ts
│
├── types/               # Types globaux
│   ├── database.types.ts
│   ├── api.types.ts
│   └── common.types.ts
│
├── styles/              # Styles globaux
│   └── globals.css
│
├── App.tsx              # Point d'entrée React
├── main.tsx             # Bootstrap Vite
└── vite-env.d.ts
```

---

## 🎨 DESIGN SYSTEM

### Palette de Couleurs (Tailwind Config)

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Couleurs principales
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Bleu principal
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Accents métier HCM
        performance: {
          positive: '#10b981',  // Vert - Objectifs atteints
          warning: '#f59e0b',   // Orange - Attention
          negative: '#ef4444',  // Rouge - Sous-performance
          neutral: '#6b7280',   // Gris - Neutre
        },
        // Couleurs modules
        module: {
          employees: '#8b5cf6',    // Violet
          performance: '#06b6d4',  // Cyan
          costs: '#f97316',        // Orange
          reporting: '#84cc16',    // Lime
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

### Composants UI de Base (shadcn/ui)

```bash
# Installation des composants shadcn/ui requis
npx shadcn@latest add button card input label select
npx shadcn@latest add table tabs dialog sheet dropdown-menu
npx shadcn@latest add toast sonner alert badge avatar
npx shadcn@latest add form checkbox radio-group switch
npx shadcn@latest add progress skeleton separator
npx shadcn@latest add tooltip popover command
npx shadcn@latest add calendar date-picker
npx shadcn@latest add scroll-area collapsible accordion
```

---

## 📊 FONCTIONNALITÉS MÉTIER À IMPLÉMENTER

### Module 1: Authentification & Multi-Tenant

```typescript
// Fonctionnalités requises:
- Login/Logout avec Supabase Auth
- Gestion des rôles (Admin, Manager, RH, Viewer)
- Multi-tenant avec Row Level Security (RLS)
- Session persistante avec refresh token
- Protection des routes par rôle
```

### Module 2: Gestion des Salariés

```typescript
// Types de données
interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  categorie_professionnelle: 'Cadre' | 'Non-Cadre' | 'Agent de Maîtrise';
  departement: string;
  ligne_activite: string;
  date_embauche: Date;
  salaire_base: number;
  manager_id?: string;
  statut: 'Actif' | 'Inactif' | 'En congé';
  created_at: Date;
  updated_at: Date;
}

// Fonctionnalités:
- Liste paginée avec filtres avancés (recherche, catégorie, département)
- CRUD complet avec validation Zod
- Import/Export CSV/Excel
- Vue détaillée par salarié
- Historique des modifications
```

### Module 3: Analyse de Performance (CRITIQUE)

```typescript
// Structure des données de performance
interface PerformanceData {
  employee_id: string;
  periode: string; // Format: "2024-M01"
  indicateur_id: string;
  valeur_objectif: number;
  valeur_realisee: number;
  ecart: number;
  ecart_percentage: number;
  statut: 'Atteint' | 'En cours' | 'Non atteint';
}

interface IndicateurSocioEconomique {
  id: string;
  code: string;
  libelle: string;
  unite: string;
  formule_calcul: string;
  seuil_alerte: number;
  categorie: 'Absentéisme' | 'Turnover' | 'Productivité' | 'Qualité';
}

// Sous-modules à implémenter:

// 3.1 Récapitulatif des Performances
- Vue globale avec KPIs agrégés
- Filtres par période, département, ligne d'activité
- Export PDF/Excel

// 3.2 Écarts de Know-How (EKH)
- Tableau virtualisé pour 10K+ lignes
- Calcul automatique des écarts (OBJ vs RÉAL)
- Drill-down par niveau (Global → Ligne d'activité → Salarié)
- Coloration conditionnelle (vert/orange/rouge)

// 3.3 Synthèse par Ligne d'Activité
- Graphiques Recharts (Bar, Line, Pie)
- Comparaison inter-lignes
- Tendances temporelles

// 3.4 Distribution des Primes
- Calcul automatique basé sur performance
- Simulation de scénarios
- Validation workflow
```

### Module 4: Gestion des Coûts RH

```typescript
interface CostEntry {
  id: string;
  employee_id: string;
  periode: string;
  type_cout: 'Salaire' | 'Charges' | 'Formation' | 'Avantages';
  montant: number;
  devise: 'EUR';
  statut_validation: 'Brouillon' | 'Soumis' | 'Validé';
}

// Fonctionnalités:
- Saisie des coûts par salarié/période
- Récapitulatif par département/ligne d'activité
- Calcul des économies potentielles
- Dashboard des coûts avec graphiques
- Alertes dépassement budget
```

### Module 5: Reporting & Exports

```typescript
// Fonctionnalités:
- Génération de rapports PDF (jspdf + jspdf-autotable)
- Export Excel multi-feuilles (xlsx)
- Planification de rapports automatiques
- Envoi par email (Supabase Edge Functions)
- Historique des rapports générés
```

---

## 🔧 PATTERNS DE CODE OBLIGATOIRES

### Pattern 1: Custom Hook avec React Query

```typescript
// hooks/useEmployees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import type { Employee } from '@/types/database.types';

export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('nom', { ascending: true });

      if (filters?.search) {
        query = query.or(`nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%`);
      }
      if (filters?.categorie) {
        query = query.eq('categorie_professionnelle', filters.categorie);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Employee[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
```

### Pattern 2: Context Provider Typé

```typescript
// contexts/PerformanceDataContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PerformanceDataContextValue {
  selectedPeriode: string;
  setSelectedPeriode: (periode: string) => void;
  selectedLigneActivite: string | null;
  setSelectedLigneActivite: (ligne: string | null) => void;
  filters: PerformanceFilters;
  updateFilters: (filters: Partial<PerformanceFilters>) => void;
  resetFilters: () => void;
}

const PerformanceDataContext = createContext<PerformanceDataContextValue | null>(null);

export function PerformanceDataProvider({ children }: { children: ReactNode }) {
  const [selectedPeriode, setSelectedPeriode] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-M${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedLigneActivite, setSelectedLigneActivite] = useState<string | null>(null);
  const [filters, setFilters] = useState<PerformanceFilters>(defaultFilters);

  const updateFilters = useCallback((newFilters: Partial<PerformanceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return (
    <PerformanceDataContext.Provider
      value={{
        selectedPeriode,
        setSelectedPeriode,
        selectedLigneActivite,
        setSelectedLigneActivite,
        filters,
        updateFilters,
        resetFilters,
      }}
    >
      {children}
    </PerformanceDataContext.Provider>
  );
}

export function usePerformanceData() {
  const context = useContext(PerformanceDataContext);
  if (!context) {
    throw new Error('usePerformanceData must be used within PerformanceDataProvider');
  }
  return context;
}
```

### Pattern 3: Composant Table Performant avec Scroll Synchronisé

```typescript
// components/shared/VirtualizedTable.tsx
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width: number;
  render?: (item: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  maxHeight?: number;
  rowHeight?: number;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function VirtualizedTable<T extends { id: string }>({
  data,
  columns,
  maxHeight = 400,
  rowHeight = 48,
  className,
  onRowClick,
}: VirtualizedTableProps<T>) {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const gridTemplate = columns.map(col => `${col.width}px`).join(' ');

  return (
    <div
      className={cn('rounded-lg border border-border', className)}
      style={{ maxHeight, overflow: 'auto' }}
    >
      {/* Header - Sticky pour rester visible lors du scroll vertical */}
      <div
        className="text-sm font-semibold bg-muted border-b-2 sticky top-0 z-10"
        style={{ display: 'grid', gridTemplateColumns: gridTemplate, width: totalWidth }}
      >
        {columns.map(col => (
          <div
            key={String(col.key)}
            className={cn(
              'py-3 px-3 whitespace-nowrap overflow-hidden text-ellipsis bg-muted',
              col.align === 'right' && 'text-right',
              col.align === 'center' && 'text-center',
            )}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Body - Même conteneur de scroll que le header */}
      <div>
        {data.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'border-b border-border/50 hover:bg-accent/50 transition-colors',
              index % 2 === 0 ? 'bg-background' : 'bg-muted/30',
              onRowClick && 'cursor-pointer',
            )}
            style={{
              display: 'grid',
              gridTemplateColumns: gridTemplate,
              width: totalWidth,
              height: rowHeight,
            }}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map(col => (
              <div
                key={String(col.key)}
                className={cn(
                  'py-2 px-3 flex items-center overflow-hidden',
                  col.align === 'right' && 'justify-end',
                  col.align === 'center' && 'justify-center',
                )}
              >
                {col.render
                  ? col.render(item, index)
                  : <span className="truncate">{String(item[col.key as keyof T] ?? '')}</span>
                }
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Pattern 4: Formulaire avec React Hook Form + Zod

```typescript
// components/employees/EmployeeForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const employeeSchema = z.object({
  matricule: z.string().min(1, 'Matricule requis').max(20),
  nom: z.string().min(2, 'Nom trop court').max(100),
  prenom: z.string().min(2, 'Prénom trop court').max(100),
  email: z.string().email('Email invalide'),
  categorie_professionnelle: z.enum(['Cadre', 'Non-Cadre', 'Agent de Maîtrise']),
  departement: z.string().min(1, 'Département requis'),
  salaire_base: z.number().min(0, 'Salaire invalide'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  isLoading?: boolean;
}

export function EmployeeForm({ defaultValues, onSubmit, isLoading }: EmployeeFormProps) {
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      matricule: '',
      nom: '',
      prenom: '',
      email: '',
      categorie_professionnelle: 'Non-Cadre',
      departement: '',
      salaire_base: 0,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="matricule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matricule</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="EMP001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categorie_professionnelle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cadre">Cadre</SelectItem>
                    <SelectItem value="Non-Cadre">Non-Cadre</SelectItem>
                    <SelectItem value="Agent de Maîtrise">Agent de Maîtrise</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>
    </Form>
  );
}
```

### Pattern 5: Lazy Loading avec Suspense

```typescript
// modules/performance/PerformanceRouter.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PerformanceDataProvider } from './contexts/PerformanceDataContext';

// Lazy loading des pages
const PerformanceRecapPage = lazy(() => import('./pages/PerformanceRecapPage'));
const EKHAnalysisPage = lazy(() => import('./pages/EKHAnalysisPage'));
const SynthesisPage = lazy(() => import('./pages/SynthesisPage'));
const PrimeDistributionPage = lazy(() => import('./pages/PrimeDistributionPage'));

// Fallback pendant le chargement
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Chargement...</span>
    </div>
  </div>
);

export default function PerformanceRouter() {
  return (
    <PerformanceDataProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PerformanceRecapPage />} />
          <Route path="/ekh-analysis" element={<EKHAnalysisPage />} />
          <Route path="/synthesis" element={<SynthesisPage />} />
          <Route path="/prime-distribution" element={<PrimeDistributionPage />} />
        </Routes>
      </Suspense>
    </PerformanceDataProvider>
  );
}
```

---

## 🗄️ SCHÉMA BASE DE DONNÉES SUPABASE

```sql
-- Tables principales

-- Organisations (Multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utilisateurs avec rôles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'rh', 'viewer')) DEFAULT 'viewer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salariés
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  matricule TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  categorie_professionnelle TEXT CHECK (categorie_professionnelle IN ('Cadre', 'Non-Cadre', 'Agent de Maîtrise')),
  departement TEXT,
  ligne_activite TEXT,
  date_embauche DATE,
  salaire_base DECIMAL(12,2),
  manager_id UUID REFERENCES employees(id),
  statut TEXT CHECK (statut IN ('Actif', 'Inactif', 'En congé')) DEFAULT 'Actif',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, matricule)
);

-- Indicateurs socio-économiques
CREATE TABLE indicateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  description TEXT,
  unite TEXT,
  formule_calcul TEXT,
  seuil_alerte DECIMAL(10,2),
  categorie TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Données de performance
CREATE TABLE performance_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  indicateur_id UUID REFERENCES indicateurs(id) ON DELETE CASCADE,
  periode TEXT NOT NULL, -- Format: "2024-M01"
  valeur_objectif DECIMAL(15,4),
  valeur_realisee DECIMAL(15,4),
  ecart DECIMAL(15,4) GENERATED ALWAYS AS (valeur_realisee - valeur_objectif) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, indicateur_id, periode)
);

-- Coûts RH
CREATE TABLE cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  periode TEXT NOT NULL,
  type_cout TEXT CHECK (type_cout IN ('Salaire', 'Charges', 'Formation', 'Avantages')),
  montant DECIMAL(12,2) NOT NULL,
  devise TEXT DEFAULT 'EUR',
  statut_validation TEXT CHECK (statut_validation IN ('Brouillon', 'Soumis', 'Validé')) DEFAULT 'Brouillon',
  validated_by UUID REFERENCES user_profiles(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs ne voient que les données de leur organisation
CREATE POLICY "Users can view their organization's employees"
  ON employees FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their organization's performance data"
  ON performance_data FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Index pour performances
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_matricule ON employees(organization_id, matricule);
CREATE INDEX idx_performance_employee ON performance_data(employee_id);
CREATE INDEX idx_performance_periode ON performance_data(periode);
CREATE INDEX idx_costs_employee ON cost_entries(employee_id);
```

---

## ✅ CHECKLIST DE VALIDATION

### Performance
- [ ] Lighthouse Score > 90 sur toutes les métriques
- [ ] Time to Interactive < 3 secondes
- [ ] Bundle JS < 500KB gzipped
- [ ] Images optimisées (WebP, lazy loading)
- [ ] Code splitting par route

### Accessibilité
- [ ] WCAG 2.1 AA compliant
- [ ] Navigation clavier complète
- [ ] Contrastes suffisants
- [ ] Labels ARIA sur tous les éléments interactifs
- [ ] Focus visible

### Sécurité
- [ ] TypeScript strict mode sans `any`
- [ ] Validation Zod sur tous les inputs
- [ ] HTTPS obligatoire
- [ ] Headers de sécurité configurés
- [ ] RLS Supabase actif

### UX/UI
- [ ] Design responsive (mobile-first)
- [ ] Dark mode fonctionnel
- [ ] États de chargement sur toutes les actions async
- [ ] Messages d'erreur humains et actionnables
- [ ] Empty states informatifs

### Code Quality
- [ ] ESLint + Prettier configurés
- [ ] Pas de console.log en production
- [ ] Composants documentés (JSDoc)
- [ ] Types exportés pour réutilisation
- [ ] Tests unitaires sur logique critique (>70% coverage)

---

## 🚀 COMMANDES DE DÉMARRAGE

```bash
# Création du projet
npm create vite@latest hcm-platform -- --template react-ts
cd hcm-platform

# Installation des dépendances
npm install @tanstack/react-query @supabase/supabase-js
npm install react-router-dom zustand date-fns
npm install react-hook-form @hookform/resolvers zod
npm install recharts lucide-react sonner
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node

# Configuration Tailwind
npx tailwindcss init -p

# Installation shadcn/ui
npx shadcn@latest init

# Lancement
npm run dev
```

---

## 📝 NOTES FINALES

1. **Priorise la qualité sur la quantité** : Mieux vaut 5 composants parfaits que 20 bâclés
2. **Tests obligatoires** : Chaque feature doit avoir des tests avant merge
3. **Performance dès le départ** : N'attends pas d'avoir des problèmes pour optimiser
4. **Documentation inline** : Commente le "pourquoi", pas le "quoi"
5. **Itère rapidement** : Ship → Observe → Améliore

---

**Tu as toutes les cartes en main. Maintenant, construis un produit d'exception.** 🚀
