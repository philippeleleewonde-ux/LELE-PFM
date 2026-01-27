import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { StepProps } from '@/types/registration';

export const IdentityStep = ({ control, errors, onNext, isFirstStep }: StepProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Champs Nom/Prénom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="firstName"
                placeholder="Votre prénom"
                className={errors.firstName ? 'border-destructive' : ''}
              />
            )}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Nom de famille *</Label>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="lastName"
                placeholder="Votre nom"
                className={errors.lastName ? 'border-destructive' : ''}
              />
            )}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email *</Label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="email"
              type="email"
              placeholder="votre.email@exemple.com"
              className={errors.email ? 'border-destructive' : ''}
            />
          )}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Téléphone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone (optionnel)</Label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
            />
          )}
        />
      </div>

      {/* Mots de passe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <div className="relative">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Au moins 6 caractères"
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
          <div className="relative">
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      {/* Conseils sécurité */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Conseils pour un mot de passe sécurisé :</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Au moins 8 caractères</li>
          <li>• Une majuscule et une minuscule</li>
          <li>• Au moins un chiffre</li>
          <li>• Évitez les mots courants</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {/* Espace pour cohérence visuelle */}
        <div></div>
        
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
