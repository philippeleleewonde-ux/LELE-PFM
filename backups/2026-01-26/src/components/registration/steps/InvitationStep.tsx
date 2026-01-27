import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepProps } from '@/types/registration';

export const InvitationStep = ({ control, errors, onNext, onBack }: StepProps) => {
  return (
    <div className="space-y-6">
      {/* Information sur le code d'invitation */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ce code d'invitation vous a été fourni par votre entreprise ou votre responsable RH. 
          Il permet de vous associer automatiquement à votre organisation.
        </AlertDescription>
      </Alert>

      {/* Champ code d'invitation */}
      <div className="space-y-2">
        <Label htmlFor="invitationCode">Code d'invitation entreprise *</Label>
        <Controller
          name="invitationCode"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="invitationCode"
              placeholder="HCM-XXXXX-XXXXX"
              className={`font-mono text-center text-lg tracking-widest ${
                errors.invitationCode ? 'border-destructive' : ''
              }`}
              onChange={(e) => {
                // Forcer le format en majuscules
                const formatted = e.target.value.toUpperCase();
                field.onChange(formatted);
              }}
            />
          )}
        />
        {errors.invitationCode && (
          <p className="text-sm text-destructive">{errors.invitationCode.message}</p>
        )}
      </div>

      {/* Aide pour le format */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Format du code :</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Format : HCM-XXXXX-XXXXX</p>
          <p>• Exemple : HCM-AB123-CD456</p>
          <p>• 13 caractères au total</p>
        </div>
      </div>

      {/* Que faire si pas de code */}
      <div className="border-l-4 border-primary/20 bg-primary/5 p-4 rounded-r-lg">
        <h4 className="text-sm font-medium text-primary mb-2">Vous n'avez pas de code ?</h4>
        <div className="text-sm text-primary/80 space-y-1">
          <p>• Contactez votre responsable RH</p>
          <p>• Demandez à votre manager</p>
          <p>• Consultez votre email de bienvenue</p>
          <p>• Vérifiez les documents d'intégration</p>
        </div>
      </div>

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
          Vérifier le code
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
