import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ThemeLogo } from '@/components/ThemeLogo';
import { useRegistrationSteps, useStepNavigation } from '@/hooks/useRegistrationSteps';
import { useAutoSave, getSavedData, clearSavedData } from '@/hooks/useAutoSave';
import { createRegistrationSchema } from '@/schemas/registration';
import type { RegistrationData } from '@/types/registration';
import type { UserRole } from '@/types/roles';

// Import des vrais composants d'étapes
import { IdentityStep } from './steps/IdentityStep';
import { ProfessionalStep } from './steps/ProfessionalStep';
import { InvitationStep } from './steps/InvitationStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

interface RegistrationWizardProps {
  role: UserRole;
  onComplete: (data: RegistrationData) => Promise<void>;
}

export const RegistrationWizard = ({ role, onComplete }: RegistrationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Configuration des étapes selon le rôle
  const { steps, totalSteps } = useRegistrationSteps(role);
  const navigation = useStepNavigation(totalSteps);

  // Schéma de validation dynamique
  const schema = useMemo(() => createRegistrationSchema(role), [role]);

  // Configuration React Hook Form avec validation temps réel
  const form = useForm<RegistrationData>({
    resolver: zodResolver(schema),
    mode: 'onChange', // ✅ Validation temps réel
    defaultValues: {
      role,
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      ...getSavedData('registration-draft'), // ✅ Récupération des données sauvegardées
    },
  });

  const { control, handleSubmit, watch, formState: { errors } } = form;
  
  // ✅ Sauvegarde automatique dans localStorage
  useAutoSave(watch(), 'registration-draft');

  // Mapping des composants d'étapes
  const StepComponents = {
    identity: IdentityStep,
    professional: ProfessionalStep,
    invitation: InvitationStep,
    confirmation: ConfirmationStep,
  };

  // Navigation entre les étapes
  const handleNext = () => {
    if (navigation.canGoNext(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack(currentStep)) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Soumission finale
  const onSubmit = async (data: RegistrationData) => {
    setLoading(true);
    try {
      await onComplete(data);
      // ✅ Nettoyer les données sauvegardées après succès
      clearSavedData('registration-draft');
    } catch (error) {
      console.error('Erreur inscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  const CurrentStepComponent = StepComponents[currentStepData.id as keyof typeof StepComponents];
  if (!CurrentStepComponent) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-border bg-card shadow-glow">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <ThemeLogo className="h-16" />
          </div>
          
          {/* ✅ Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Étape {currentStep + 1} sur {totalSteps}</span>
              <span>{Math.round(navigation.getProgress(currentStep))}%</span>
            </div>
            <Progress value={navigation.getProgress(currentStep)} className="w-full" />
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-primary">
              {currentStepData.title}
            </CardTitle>
            <CardDescription className="text-foreground">
              {currentStepData.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ✅ Transition simple sans animation */}
            <div key={currentStep} className="transition-opacity duration-200">
              <CurrentStepComponent
                control={control}
                errors={errors}
                onNext={handleNext}
                onBack={handleBack}
                isFirstStep={navigation.isFirstStep(currentStep)}
                isLastStep={navigation.isLastStep(currentStep)}
                loading={loading}
                formData={watch()}
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
