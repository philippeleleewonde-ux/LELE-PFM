import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

interface Profile {
  full_name: string;
  email: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ full_name: '', email: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Profil mis à jour avec succès',
      });
    }

    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profil Utilisateur</h1>
          <p className="text-muted-foreground text-lg">
            Gérez vos informations personnelles
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Informations du Profil</CardTitle>
                <CardDescription>Mettez à jour vos informations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>

              <Button
                type="submit"
                className="gradient-primary shadow-elegant"
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;