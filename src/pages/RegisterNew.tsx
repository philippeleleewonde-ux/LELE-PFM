import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RegistrationWizard } from '@/components/registration/RegistrationWizard';
import type { UserRole } from '@/types/roles';
import type { RegistrationData } from '@/types/registration';

const RegisterNew = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  
  const role = (location.state?.role as UserRole) || null;

  useEffect(() => {
    if (!role) {
      navigate('/auth/role-selection');
    }
  }, [role, navigate]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fonction de completion de l'inscription
  const handleRegistrationComplete = async (data: RegistrationData) => {
    // 🔍 DIAGNOSTIC LOGGING - Registration Form Data
    try {
      // Vérifier le code d'invitation si nécessaire
      let companyId = null;
      if (['RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER'].includes(role!) && data.invitationCode) {
        const { data: verifyData, error: verifyError } = await supabase
          .rpc('verify_invitation_code', { code: data.invitationCode });
        
        if (verifyError || !verifyData) {
          toast({
            title: 'Code invalide',
            description: 'Le code d\'invitation n\'existe pas',
            variant: 'destructive',
          });
          throw new Error('Invalid invitation code');
        }
        companyId = verifyData;
      }

      // Créer l'utilisateur avec les métadonnées complètes
      const { error, user: newUser } = await signUp({
        email: data.email,
        password: data.password,
        fullName: `${data.firstName} ${data.lastName}`,
        metadata: {
          role: role!,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone || undefined,
          company_id: companyId || undefined,
        }
      });

      if (error) {
        // 🔍 DIAGNOSTIC LOGGING - Error Display
        console.error('❌ Showing toast with error message:', error.message);
        console.error('🔍 Error type:', error.name);
        console.error('🔍 Full error:', error);
        if (error.message.includes('already registered')) {
          toast({
            title: 'Compte existant',
            description: 'Un compte avec cet email existe déjà',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erreur',
            description: error.message,
            variant: 'destructive',
          });
        }
        throw error;
      }

      if (!newUser) {
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la création du compte',
          variant: 'destructive',
        });
        throw new Error('User creation failed');
      }

      // Créer l'entreprise pour CEO/CONSULTANT
      if (['CEO', 'CONSULTANT'].includes(role!) && data.companyName) {
        const { data: invitationCode } = await supabase.rpc('generate_invitation_code');
        
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert([{
            name: data.companyName, // Nom de la colonne selon le schéma
            industry: data.industry || 'Autre',
            employees_count: data.employeesCount ? parseInt(data.employeesCount) : null,
            invitation_code: invitationCode || '',
          }])
          .select()
          .single();

        if (companyError) {
          console.error('Company creation error:', companyError);
          toast({
            title: 'Erreur',
            description: 'Erreur lors de la création de l\'entreprise',
            variant: 'destructive',
          });
          throw companyError;
        }
        
        companyId = companyData.id;
      }

      // Mettre à jour le profil (version simplifiée pour éviter les erreurs RPC)
      if (newUser) {
        // Pour l'instant, on utilise seulement les données de base dans profiles
        // Les métadonnées détaillées sont déjà dans auth.users.raw_user_meta_data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: `${data.firstName} ${data.lastName}`,
            // Les autres champs seront gérés plus tard quand la table sera mise à jour
          })
          .eq('id', newUser.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          // Ne pas bloquer l'inscription pour ça, les métadonnées sont dans auth.users
        }
      }

      toast({
        title: 'Compte créé !',
        description: 'Vous pouvez maintenant vous connecter',
      });
      
      navigate('/auth/login');
    } catch (error) {
      console.error('Registration error:', error);
      // Les erreurs spécifiques sont déjà gérées plus haut
    }
  };

  if (!role) return null;

  return (
    <div>
      <RegistrationWizard 
        role={role} 
        onComplete={handleRegistrationComplete}
      />
      
      {/* Lien de retour vers login */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <Link
          to="/auth/login"
          className="text-primary hover:underline text-sm"
        >
          Déjà inscrit ? Se connecter
        </Link>
      </div>
    </div>
  );
};

export default RegisterNew;
