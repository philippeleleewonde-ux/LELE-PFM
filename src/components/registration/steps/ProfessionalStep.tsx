import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { StepProps } from '@/types/registration';
import type { UserRole } from '@/types/roles';

interface ProfessionalStepProps extends StepProps {
  formData: { role: UserRole };
}

export const ProfessionalStep = ({ control, errors, onNext, onBack, formData }: ProfessionalStepProps) => {
  const { role } = formData;

  const renderRoleSpecificFields = () => {
    switch (role) {
      case 'CEO':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise *</Label>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="companyName"
                    placeholder="Ma Super Entreprise SARL"
                    className={errors.companyName ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Secteur d'activité *</Label>
                <Controller
                  name="industry"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="industry"
                      placeholder="Technologie, Commerce, Services..."
                      className={errors.industry ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.industry && (
                  <p className="text-sm text-destructive">{errors.industry.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeesCount">Nombre d'employés</Label>
                <Controller
                  name="employeesCount"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employés</SelectItem>
                        <SelectItem value="11-50">11-50 employés</SelectItem>
                        <SelectItem value="51-200">51-200 employés</SelectItem>
                        <SelectItem value="200+">Plus de 200 employés</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Votre poste</Label>
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="position"
                    placeholder="CEO, Directeur Général, Fondateur..."
                  />
                )}
              />
            </div>
          </>
        );

      case 'CONSULTANT':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="consultingFirm">Société de conseil *</Label>
              <Controller
                name="consultingFirm"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="consultingFirm"
                    placeholder="Nom de votre société de conseil"
                    className={errors.consultingFirm ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.consultingFirm && (
                <p className="text-sm text-destructive">{errors.consultingFirm.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Entreprise cliente</Label>
                <Controller
                  name="companyName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="companyName"
                      placeholder="Entreprise où vous intervenez"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Secteur d'intervention</Label>
                <Controller
                  name="industry"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="industry"
                      placeholder="Votre domaine d'expertise"
                    />
                  )}
                />
              </div>
            </div>
          </>
        );

      case 'BANQUIER':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de la banque *</Label>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="companyName"
                    placeholder="Crédit Agricole, BNP Paribas..."
                    className={errors.companyName ? 'border-destructive' : ''}
                  />
                )}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Service *</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="department"
                      placeholder="Crédit Entreprise, Risques, Particuliers..."
                      className={errors.department ? 'border-destructive' : ''}
                    />
                  )}
                />
                {errors.department && (
                  <p className="text-sm text-destructive">{errors.department.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Poste</Label>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="position"
                      placeholder="Chargé de clientèle, Analyste crédit..."
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultingFirm">Numéro d'agrément bancaire</Label>
              <Controller
                name="consultingFirm"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="consultingFirm"
                    placeholder="Numéro ACPR ou équivalent"
                  />
                )}
              />
            </div>
          </>
        );

      case 'RH_MANAGER':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Département RH</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="department"
                      placeholder="Ressources Humaines, Recrutement..."
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Années d'expérience RH</Label>
                <Controller
                  name="yearsExperience"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-2">0-2 ans</SelectItem>
                        <SelectItem value="3-5">3-5 ans</SelectItem>
                        <SelectItem value="6-10">6-10 ans</SelectItem>
                        <SelectItem value="10+">Plus de 10 ans</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </>
        );

      case 'EMPLOYEE':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Département/Service</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="department"
                      placeholder="Commercial, IT, Finance..."
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Poste occupé</Label>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="position"
                      placeholder="Développeur, Comptable, Commercial..."
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">ID employé (optionnel)</Label>
              <Controller
                name="employeeId"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="employeeId"
                    placeholder="Votre numéro d'employé"
                  />
                )}
              />
            </div>
          </>
        );

      case 'TEAM_LEADER':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Nom de l'équipe</Label>
                <Controller
                  name="teamName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="teamName"
                      placeholder="Équipe Dev, Équipe Ventes..."
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="department"
                      placeholder="IT, Commercial, Production..."
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize">Taille de l'équipe</Label>
              <Controller
                name="teamSize"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-5">2-5 personnes</SelectItem>
                      <SelectItem value="6-10">6-10 personnes</SelectItem>
                      <SelectItem value="11-20">11-20 personnes</SelectItem>
                      <SelectItem value="20+">Plus de 20 personnes</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </>
        );

      default:
        return <div>Rôle non reconnu</div>;
    }
  };

  return (
    <div className="space-y-6">
      {renderRoleSpecificFields()}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>
        
        <Button 
          type="button" 
          onClick={onNext}
          className="gradient-primary shadow-elegant"
        >
          Continuer
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
