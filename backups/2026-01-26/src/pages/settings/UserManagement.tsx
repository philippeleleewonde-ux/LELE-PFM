import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'CONSULTANT' | 'BANQUIER' | 'CEO' | 'RH_MANAGER' | 'EMPLOYEE' | 'TEAM_LEADER';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  position: string | null;
  role: UserRole;
}

export default function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Récupérer la company_id de l'utilisateur connecté
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Récupérer tous les utilisateurs de l'entreprise avec leurs rôles
  const { data: users, isLoading } = useQuery({
    queryKey: ['company-users', currentUserProfile?.company_id],
    queryFn: async () => {
      if (!currentUserProfile?.company_id) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name, position')
        .eq('company_id', currentUserProfile.company_id);

      if (profilesError) throw profilesError;

      // Récupérer les rôles
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role as UserRole) || 'EMPLOYEE',
        };
      });

      return usersWithRoles;
    },
    enabled: !!currentUserProfile?.company_id,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast.success('Rôle mis à jour avec succès');
      setEditingUserId(null);
    },
    onError: (error: Error) => {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    },
  });

  const roleLabels: Record<UserRole, string> = {
    CONSULTANT: 'Consultant',
    BANQUIER: 'Banquier',
    CEO: 'CEO',
    RH_MANAGER: 'Manager RH',
    EMPLOYEE: 'Employé',
    TEAM_LEADER: 'Chef d\'équipe',
  };

  const roleColors: Record<UserRole, string> = {
    CONSULTANT: 'bg-purple-500',
    BANQUIER: 'bg-blue-500',
    CEO: 'bg-red-500',
    RH_MANAGER: 'bg-green-500',
    EMPLOYEE: 'bg-gray-500',
    TEAM_LEADER: 'bg-orange-500',
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Gestion des Utilisateurs
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les rôles et permissions des utilisateurs de votre entreprise
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/settings/banker-access'}
          >
            <Shield className="h-4 w-4 mr-2" />
            Accès Banquier
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs de l'entreprise</CardTitle>
            <CardDescription>
              Modifiez les rôles des utilisateurs. Les banquiers doivent recevoir des accès spécifiques via "Accès Banquier".
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">
                        {userItem.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>{userItem.position || 'N/A'}</TableCell>
                      <TableCell>
                        {editingUserId === userItem.id ? (
                          <Select
                            defaultValue={userItem.role}
                            onValueChange={(value) => {
                              updateRoleMutation.mutate({
                                userId: userItem.id,
                                newRole: value as UserRole,
                              });
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={roleColors[userItem.role]}>
                            {roleLabels[userItem.role]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUserId === userItem.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUserId(null)}
                          >
                            Annuler
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUserId(userItem.id)}
                            disabled={userItem.id === user?.id}
                          >
                            Modifier
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
