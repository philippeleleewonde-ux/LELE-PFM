import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BankerAccessManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingBanker, setIsAddingBanker] = useState(false);
  const [bankerEmail, setBankerEmail] = useState('');
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState<string>('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: grants, isLoading } = useQuery({
    queryKey: ['banker-grants', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banker_access_grants')
        .select('*')
        .eq('company_id', profile!.company_id);

      if (error) throw error;

      // Récupérer les profils des banquiers
      if (!data || data.length === 0) return [];

      const bankerIds = data.map(g => g.banker_user_id);
      const { data: bankerProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', bankerIds);

      // Enrichir les grants avec les infos des profils
      return data.map(grant => ({
        ...grant,
        banker_profile: bankerProfiles?.find(p => p.id === grant.banker_user_id)
      }));
    },
    enabled: !!profile?.company_id,
  });

  const grantAccessMutation = useMutation({
    mutationFn: async () => {
      // Trouver l'utilisateur banquier par email
      const { data: bankerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', bankerEmail)
        .single();

      if (profileError || !bankerProfile) {
        throw new Error('Banquier introuvable avec cet email');
      }

      // Créer les accès pour chaque module sélectionné
      const expiresAt = duration ? new Date(Date.now() + parseInt(duration) * 30 * 24 * 60 * 60 * 1000).toISOString() : null;

      const grants = selectedModules.map(moduleNumber => ({
        company_id: profile!.company_id,
        banker_user_id: bankerProfile.id,
        granted_by_user_id: user!.id,
        module_number: moduleNumber,
        notes,
        expires_at: expiresAt,
      }));

      const { error } = await supabase
        .from('banker_access_grants')
        .insert(grants);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Accès banquier accordé avec succès');
      queryClient.invalidateQueries({ queryKey: ['banker-grants'] });
      setIsAddingBanker(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'octroi de l\'accès');
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (grantId: string) => {
      const { error } = await supabase
        .from('banker_access_grants')
        .delete()
        .eq('id', grantId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Accès révoqué');
      queryClient.invalidateQueries({ queryKey: ['banker-grants'] });
    },
    onError: () => {
      toast.error('Erreur lors de la révocation');
    },
  });

  const resetForm = () => {
    setBankerEmail('');
    setSelectedModules([]);
    setNotes('');
    setDuration('');
  };

  const handleModuleToggle = (moduleNumber: number) => {
    setSelectedModules(prev =>
      prev.includes(moduleNumber)
        ? prev.filter(m => m !== moduleNumber)
        : [...prev, moduleNumber]
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Accès Banquier</h1>
          <p className="text-muted-foreground">
            Gérez les accès aux rapports pour vos partenaires bancaires
          </p>
        </div>
        <Button onClick={() => setIsAddingBanker(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Donner un accès
        </Button>
      </div>

      {/* Liste des accès */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Chargement...
            </CardContent>
          </Card>
        ) : !grants || grants.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucun accès banquier accordé pour le moment
            </CardContent>
          </Card>
        ) : (
          grants.map((grant) => (
            <Card key={grant.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{grant.banker_profile?.full_name || 'Banquier'}</CardTitle>
                    <CardDescription>{grant.banker_profile?.email}</CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => revokeAccessMutation.mutate(grant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>Module {grant.module_number}</Badge>
                    {grant.is_active ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </div>
                  {grant.expires_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Expire le {format(new Date(grant.expires_at), 'PPP', { locale: fr })}
                    </div>
                  )}
                  {grant.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{grant.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal d'ajout */}
      <Dialog open={isAddingBanker} onOpenChange={setIsAddingBanker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accorder un accès banquier</DialogTitle>
            <DialogDescription>
              Donnez accès à vos rapports à un partenaire bancaire
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email du banquier</Label>
              <Input
                id="email"
                type="email"
                value={bankerEmail}
                onChange={(e) => setBankerEmail(e.target.value)}
                placeholder="banquier@banque.fr"
              />
            </div>

            <div>
              <Label>Modules accessibles</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={selectedModules.includes(1) ? 'default' : 'outline'}
                  onClick={() => handleModuleToggle(1)}
                >
                  Module 1
                </Button>
                <Button
                  type="button"
                  variant={selectedModules.includes(3) ? 'default' : 'outline'}
                  onClick={() => handleModuleToggle(3)}
                >
                  Module 3
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Durée de l'accès (optionnel)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Illimité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Illimité</SelectItem>
                  <SelectItem value="3">3 mois</SelectItem>
                  <SelectItem value="6">6 mois</SelectItem>
                  <SelectItem value="12">12 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Raison de l'accès, contexte..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingBanker(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => grantAccessMutation.mutate()}
              disabled={!bankerEmail || selectedModules.length === 0}
            >
              Accorder l'accès
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
