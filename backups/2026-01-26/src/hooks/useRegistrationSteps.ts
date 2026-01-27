import { useMemo } from 'react';
import type { UserRole } from '@/types/roles';
import type { RegistrationStep, StepId } from '@/types/registration';

// Configuration des étapes selon les rôles
export const useRegistrationSteps = (role: UserRole) => {
  const steps: RegistrationStep[] = useMemo(() => [
    {
      id: 'identity',
      title: 'Informations personnelles',
      description: 'Vos coordonnées et mot de passe',
      component: () => null, // Sera remplacé par les vrais composants
      validationFields: ['email', 'password', 'confirmPassword', 'firstName', 'lastName'],
    },
    {
      id: 'professional',
      title: getProfessionalStepTitle(role),
      description: getProfessionalStepDescription(role),
      component: () => null,
      validationFields: getProfessionalValidationFields(role),
    },
    {
      id: 'invitation',
      title: 'Code d\'invitation',
      description: 'Entrez le code fourni par votre entreprise',
      component: () => null,
      conditional: true,
      validationFields: ['invitationCode'],
    },
    {
      id: 'confirmation',
      title: 'Confirmation',
      description: 'Vérifiez vos informations avant validation',
      component: () => null,
      validationFields: [],
    },
  ], [role]);

  // Filtrer les étapes selon le rôle
  const visibleSteps = useMemo(() => {
    return steps.filter(step => {
      if (!step.conditional) return true;
      
      // Étape invitation uniquement pour certains rôles
      if (step.id === 'invitation') {
        return ['RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER'].includes(role);
      }
      
      return true;
    });
  }, [steps, role]);

  return {
    steps: visibleSteps,
    totalSteps: visibleSteps.length,
  };
};

// Fonctions utilitaires pour la configuration des étapes
function getProfessionalStepTitle(role: UserRole): string {
  const titles = {
    CEO: 'Informations entreprise',
    CONSULTANT: 'Informations conseil',
    BANQUIER: 'Informations bancaires',
    RH_MANAGER: 'Informations RH',
    EMPLOYEE: 'Informations employé',
    TEAM_LEADER: 'Informations équipe',
  };
  return titles[role];
}

function getProfessionalStepDescription(role: UserRole): string {
  const descriptions = {
    CEO: 'Détails de votre entreprise et secteur d\'activité',
    CONSULTANT: 'Votre société de conseil et domaines d\'expertise',
    BANQUIER: 'Votre établissement bancaire et service',
    RH_MANAGER: 'Votre département et expérience RH',
    EMPLOYEE: 'Votre poste et département',
    TEAM_LEADER: 'Votre équipe et responsabilités',
  };
  return descriptions[role];
}

function getProfessionalValidationFields(role: UserRole): string[] {
  const fieldsByRole = {
    CEO: ['companyName', 'industry'],
    CONSULTANT: ['consultingFirm'],
    BANQUIER: ['companyName', 'department'], // companyName = bank_name pour BANQUIER
    RH_MANAGER: [],
    EMPLOYEE: [],
    TEAM_LEADER: [],
  };
  return fieldsByRole[role];
}

// Hook pour la navigation entre les étapes
export const useStepNavigation = (totalSteps: number) => {
  return useMemo(() => ({
    canGoNext: (currentStep: number) => currentStep < totalSteps - 1,
    canGoBack: (currentStep: number) => currentStep > 0,
    isFirstStep: (currentStep: number) => currentStep === 0,
    isLastStep: (currentStep: number) => currentStep === totalSteps - 1,
    getProgress: (currentStep: number) => ((currentStep + 1) / totalSteps) * 100,
  }), [totalSteps]);
};
