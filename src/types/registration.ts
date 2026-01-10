// Types pour le système d'inscription multi-étapes
import type { UserRole } from './roles';
import type { Control, FieldErrors } from 'react-hook-form';

export interface RegistrationData {
  // Étape 1: Identité
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  
  // Étape 2: Rôle (déjà sélectionné en amont)
  role: UserRole;
  
  // Étape 3: Informations professionnelles (conditionnelles selon le rôle)
  companyName?: string;
  industry?: string;
  employeesCount?: string;
  position?: string;
  consultingFirm?: string;
  department?: string;
  yearsExperience?: string;
  employeeId?: string;
  teamName?: string;
  teamSize?: string;
  
  // Étape 4: Code d'invitation (pour certains rôles)
  invitationCode?: string;
}

export interface StepProps {
  control: Control<RegistrationData>;
  errors: FieldErrors<RegistrationData>;
  onNext: () => void;
  onBack: () => void;
  isLastStep?: boolean;
  isFirstStep?: boolean;
}

export interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  conditional?: boolean;
  validationFields: string[];
}

export type StepId = 'identity' | 'professional' | 'invitation' | 'confirmation';
