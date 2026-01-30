import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Building2, Users, UserCircle, UsersRound } from 'lucide-react';
import { ThemeLogo } from '@/components/ThemeLogo';
import { RoleTooltip } from '@/components/RoleTooltip';
import { roleDetailsMap } from '@/data/roleDetails';
import type { UserRole } from '@/types/roles';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: typeof Briefcase;
}

const roles: RoleOption[] = [
  {
    id: 'CONSULTANT',
    title: 'Consultant',
    description: 'Accompagner les entreprises dans l\'optimisation des performances',
    icon: Briefcase,
  },
  {
    id: 'BANQUIER',
    title: 'Banquier',
    description: 'Évaluer les performances financières de vos clients entreprises',
    icon: Building2,
  },
  {
    id: 'CEO',
    title: 'CEO / Dirigeant',
    description: 'Diriger et piloter la performance de votre entreprise',
    icon: Building2,
  },
  {
    id: 'RH_MANAGER',
    title: 'Responsable RH',
    description: 'Gérer la satisfaction et les performances RH',
    icon: Users,
  },
  {
    id: 'EMPLOYEE',
    title: 'Employé',
    description: 'Consulter vos performances et participer aux enquêtes',
    icon: UserCircle,
  },
  {
    id: 'TEAM_LEADER',
    title: 'Chef d\'équipe',
    description: 'Encadrer votre équipe et suivre les performances',
    icon: UsersRound,
  },
];

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole) {
      navigate('/auth/register', { state: { role: selectedRole } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <div className="w-full max-w-5xl">
        <div className="flex justify-center mb-8">
          <ThemeLogo className="h-20" />
        </div>

        {/* Card avec fond opaque pour lisibilité sur les particules */}
        <Card className="border-border bg-card/95 backdrop-blur-sm shadow-glow">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              Quel est votre profil ?
            </CardTitle>
            <CardDescription className="text-foreground text-lg">
              Sélectionnez le profil qui correspond le mieux à votre situation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                const roleDetails = roleDetailsMap[role.id];

                return (
                  <RoleTooltip key={role.id} roleDetails={roleDetails}>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                          isSelected ? 'bg-primary' : 'bg-muted'
                        }`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`} />
                        </div>
                        <CardTitle className="text-xl text-primary">
                          {role.title}
                        </CardTitle>
                        <CardDescription className="text-foreground">
                          {role.description}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Survolez pour en savoir plus
                        </p>
                      </CardHeader>
                    </Card>
                  </RoleTooltip>
                );
              })}
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={handleContinue}
                disabled={!selectedRole}
                className="w-full md:w-auto gradient-primary shadow-elegant"
                size="lg"
              >
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleSelection;
