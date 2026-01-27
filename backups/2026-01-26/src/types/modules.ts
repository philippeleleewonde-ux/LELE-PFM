import { UserRole } from './roles';

export type ModuleNumber = 1 | 2 | 3 | 4;
export type ModulePermission = 'read' | 'write' | 'admin';

export interface ModuleAccess {
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
}

export interface ModuleConfig {
  id: ModuleNumber;
  name: string;
  description: string;
  icon: string;
  color: string;
  accentColor: string;
  route: string;
}

export const MODULE_CONFIGS: Record<ModuleNumber, ModuleConfig> = {
  1: {
    id: 1,
    name: 'Planification des Performances',
    description: 'Suivi des indicateurs et planification 3 ans',
    icon: 'TrendingUp',
    color: '#3B82F6',
    accentColor: '#EFF6FF',
    route: '/modules/module1'
  },
  2: {
    id: 2,
    name: 'Satisfaction Salariés',
    description: 'Questionnaires et analyses de satisfaction',
    icon: 'Users',
    color: '#10B981',
    accentColor: '#ECFDF5',
    route: '/modules/module2'
  },
  3: {
    id: 3,
    name: 'Économies de Coûts',
    description: 'Suivi des performances et économies',
    icon: 'DollarSign',
    color: '#F59E0B',
    accentColor: '#FFFBEB',
    route: '/modules/module3'
  },
  4: {
    id: 4,
    name: 'Performance Cards',
    description: 'Cartes de performance individuelles et équipe',
    icon: 'Award',
    color: '#8B5CF6',
    accentColor: '#F5F3FF',
    route: '/modules/module4'
  }
};

// Matrice des permissions par rôle et module
export const MODULE_PERMISSIONS: Record<UserRole, Record<ModuleNumber, ModuleAccess>> = {
  CONSULTANT: {
    1: { canRead: true, canWrite: true, canAdmin: true },
    2: { canRead: true, canWrite: true, canAdmin: true },
    3: { canRead: true, canWrite: true, canAdmin: true },
    4: { canRead: true, canWrite: true, canAdmin: true }
  },
  BANQUIER: {
    1: { canRead: false, canWrite: false, canAdmin: false }, // Accès via grants uniquement
    2: { canRead: false, canWrite: false, canAdmin: false },
    3: { canRead: false, canWrite: false, canAdmin: false }, // Accès via grants uniquement
    4: { canRead: false, canWrite: false, canAdmin: false }
  },
  CEO: {
    1: { canRead: true, canWrite: true, canAdmin: true },
    2: { canRead: true, canWrite: true, canAdmin: true },
    3: { canRead: true, canWrite: true, canAdmin: true },
    4: { canRead: true, canWrite: true, canAdmin: true }
  },
  RH_MANAGER: {
    1: { canRead: false, canWrite: false, canAdmin: false },
    2: { canRead: true, canWrite: true, canAdmin: true },
    3: { canRead: false, canWrite: false, canAdmin: false },
    4: { canRead: false, canWrite: false, canAdmin: false }
  },
  EMPLOYEE: {
    1: { canRead: false, canWrite: false, canAdmin: false },
    2: { canRead: true, canWrite: true, canAdmin: false }, // Questionnaires seulement
    3: { canRead: false, canWrite: false, canAdmin: false },
    4: { canRead: true, canWrite: false, canAdmin: false } // Consultation perso
  },
  TEAM_LEADER: {
    1: { canRead: false, canWrite: false, canAdmin: false },
    2: { canRead: false, canWrite: false, canAdmin: false },
    3: { canRead: true, canWrite: true, canAdmin: false }, // Saisie équipe
    4: { canRead: true, canWrite: false, canAdmin: false } // Consultation équipe
  }
};
