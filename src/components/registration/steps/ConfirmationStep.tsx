import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, Building, User, Mail, Phone, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StepProps } from '@/types/registration';
import type { RegistrationData } from '@/types/registration';

interface ConfirmationStepProps extends StepProps {
  formData: RegistrationData;
  loading?: boolean;
}

export const ConfirmationStep = ({ onBack, formData, loading = false }: ConfirmationStepProps) => {
  const getRoleTitle = (role: string) => {
    const roleTitles: Record<string, string> = {
      CONSULTANT: 'Consultant',
      BANQUIER: 'Banquier',
      CEO: 'Chef d\'Entreprise / CEO',
      RH_MANAGER: 'Responsable RH',
      EMPLOYEE: 'Employé',
      TEAM_LEADER: 'Chef d\'équipe',
    };
    return roleTitles[role] || role;
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return 'Non renseigné';
    return phone;
  };

  const renderRoleSpecificInfo = () => {
    switch (formData.role) {
      case 'CEO':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Informations entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom :</span>
                <span className="font-medium">{formData.companyName || 'Non renseigné'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Secteur :</span>
                <span className="font-medium">{formData.industry || 'Non renseigné'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employés :</span>
                <span className="font-medium">{formData.employeesCount || 'Non renseigné'}</span>
              </div>
              {formData.position && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poste :</span>
                  <span className="font-medium">{formData.position}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'CONSULTANT':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Informations conseil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Société :</span>
                <span className="font-medium">{formData.consultingFirm || 'Non renseigné'}</span>
              </div>
              {formData.companyName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client :</span>
                  <span className="font-medium">{formData.companyName}</span>
                </div>
              )}
              {formData.industry && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Secteur :</span>
                  <span className="font-medium">{formData.industry}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'BANQUIER':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Informations bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Banque :</span>
                <span className="font-medium">{formData.companyName || 'Non renseigné'}</span>
              </div>
              {formData.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service :</span>
                  <span className="font-medium">{formData.department}</span>
                </div>
              )}
              {formData.position && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poste :</span>
                  <span className="font-medium">{formData.position}</span>
                </div>
              )}
              {formData.consultingFirm && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">N° Agrément :</span>
                  <span className="font-medium font-mono">{formData.consultingFirm}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'RH_MANAGER':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <User className="w-4 h-4 mr-2" />
                Informations RH
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {formData.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Département :</span>
                  <span className="font-medium">{formData.department}</span>
                </div>
              )}
              {formData.yearsExperience && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expérience :</span>
                  <span className="font-medium">{formData.yearsExperience} ans</span>
                </div>
              )}
              {formData.invitationCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code :</span>
                  <span className="font-medium font-mono">{formData.invitationCode}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'EMPLOYEE':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <User className="w-4 h-4 mr-2" />
                Informations employé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {formData.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Département :</span>
                  <span className="font-medium">{formData.department}</span>
                </div>
              )}
              {formData.position && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poste :</span>
                  <span className="font-medium">{formData.position}</span>
                </div>
              )}
              {formData.employeeId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Employé :</span>
                  <span className="font-medium font-mono">{formData.employeeId}</span>
                </div>
              )}
              {formData.invitationCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code :</span>
                  <span className="font-medium font-mono">{formData.invitationCode}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'TEAM_LEADER':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <User className="w-4 h-4 mr-2" />
                Informations équipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {formData.teamName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Équipe :</span>
                  <span className="font-medium">{formData.teamName}</span>
                </div>
              )}
              {formData.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Département :</span>
                  <span className="font-medium">{formData.department}</span>
                </div>
              )}
              {formData.teamSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taille équipe :</span>
                  <span className="font-medium">{formData.teamSize}</span>
                </div>
              )}
              {formData.invitationCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code :</span>
                  <span className="font-medium font-mono">{formData.invitationCode}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Titre et icône de confirmation */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold">Vérifiez vos informations</h3>
        <p className="text-sm text-muted-foreground">
          Assurez-vous que toutes les informations sont correctes avant de créer votre compte.
        </p>
      </div>

      {/* Informations personnelles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <User className="w-4 h-4 mr-2" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom complet :</span>
            <span className="font-medium">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              Email :
            </span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              Téléphone :
            </span>
            <span className="font-medium">{formatPhone(formData.phone)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              Rôle :
            </span>
            <span className="font-medium">{getRoleTitle(formData.role)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Informations spécifiques au rôle */}
      {renderRoleSpecificInfo()}

      {/* Note de sécurité */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Sécurité :</strong> Vos données sont chiffrées et stockées de manière sécurisée. 
          Vous recevrez un email de confirmation une fois votre compte créé.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={loading}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>
        
        <Button 
          type="submit"
          disabled={loading}
          className="gradient-primary shadow-elegant min-w-[120px]"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Création...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Créer mon compte
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
