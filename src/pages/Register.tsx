import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { ThemeLogo } from '@/components/ThemeLogo';
import type { UserRole } from '@/types/roles';

const emailSchema = z.string().email('Email invalide');
const passwordSchema = z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères');

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  
  const role = (location.state?.role as UserRole) || null;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    
    // Champs spécifiques CEO/CONSULTANT
    companyName: '',
    industry: '',
    employeesCount: '',
    position: '',
    siret: '',
    
    // Champs spécifiques CONSULTANT
    consultingFirm: '',
    
    // Champs spécifiques RH_MANAGER/EMPLOYEE/TEAM_LEADER
    invitationCode: '',
    department: '',
    yearsExperience: '',
    employeeId: '',
    
    // Champs spécifiques TEAM_LEADER
    teamName: '',
    teamSize: '',
  });

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation de base
      emailSchema.parse(formData.email);
      passwordSchema.parse(formData.password);

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Erreur',
          description: 'Les mots de passe ne correspondent pas',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le prénom et le nom sont requis',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Validation code invitation pour certains rôles
      if (['RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER'].includes(role!) && !formData.invitationCode.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le code d\'invitation est requis',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Vérifier le code d'invitation si nécessaire
      let companyId = null;
      if (['RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER'].includes(role!) && formData.invitationCode) {
        const { data: verifyData, error: verifyError } = await supabase
          .rpc('verify_invitation_code', { code: formData.invitationCode });
        
        if (verifyError || !verifyData) {
          toast({
            title: 'Code invalide',
            description: 'Le code d\'invitation n\'existe pas',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        companyId = verifyData;
      }

      // Créer l'utilisateur avec les métadonnées complètes
      const { error, user: newUser } = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: `${formData.firstName} ${formData.lastName}`,
        metadata: {
          role: role!, // Injecter le rôle dès l'inscription
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || undefined,
          company_id: companyId || undefined, // Pour RH/EMPLOYEE/TEAM_LEADER avec code invitation
        }
      });

      if (error) {
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
        setLoading(false);
        return;
      }

      // S'assurer qu'on a un utilisateur créé
      if (!newUser) {
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la création du compte',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Créer l'entreprise pour CEO/CONSULTANT (après la création de l'utilisateur)
      if (['CEO', 'CONSULTANT'].includes(role!)) {
        const { data: invitationCode } = await supabase.rpc('generate_invitation_code');
        
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.companyName,
            industry: formData.industry,
            employees_count: formData.employeesCount ? parseInt(formData.employeesCount) : null,
            invitation_code: invitationCode,
          })
          .select()
          .single();

        if (companyError) {
          console.error('Company creation error:', companyError);
          toast({
            title: 'Erreur',
            description: 'Erreur lors de la création de l\'entreprise',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        companyId = companyData.id;
      }

      // Mettre à jour le profil avec les informations supplémentaires via RPC (évite les limites RLS post-inscription)
      if (newUser) {
        const trimmed = (value: string) => {
          const result = value.trim();
          return result.length > 0 ? result : null;
        };

        const { error: profileError } = await supabase.rpc('complete_profile_registration', {
          target_user_id: newUser.id,
          p_first_name: formData.firstName,
          p_last_name: formData.lastName,
          p_full_name: `${formData.firstName} ${formData.lastName}`,
          p_phone: trimmed(formData.phone),
          p_company_id: companyId,
          p_company_name: ['CEO', 'CONSULTANT'].includes(role!) ? trimmed(formData.companyName) : null,
          p_consulting_firm: role === 'CONSULTANT' ? trimmed(formData.consultingFirm) : null,
          p_department: ['RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER', 'BANQUIER'].includes(role!) ? trimmed(formData.department) : null,
          p_position: ['CEO', 'BANQUIER', 'EMPLOYEE'].includes(role!) ? trimmed(formData.position) : null,
          p_employee_id: role === 'EMPLOYEE' ? trimmed(formData.employeeId) : null,
          p_team_name: role === 'TEAM_LEADER' ? trimmed(formData.teamName) : null,
          p_bank_name: role === 'BANQUIER' ? trimmed(formData.companyName) : null,
          p_license_number: role === 'BANQUIER' ? trimmed(formData.consultingFirm) : null,
        });

        if (profileError) {
          console.error('Profile update error:', profileError);
          toast({
            title: 'Erreur',
            description: 'Impossible de mettre à jour le profil utilisateur',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      toast({
        title: 'Compte créé !',
        description: 'Vous pouvez maintenant vous connecter',
      });
      
      navigate('/auth/login');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erreur de validation',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    const roleTitles: Record<UserRole, string> = {
      CONSULTANT: 'Consultant',
      BANQUIER: 'Banquier',
      CEO: 'CEO / Dirigeant',
      RH_MANAGER: 'Responsable RH',
      EMPLOYEE: 'Employé',
      TEAM_LEADER: 'Chef d\'équipe',
    };
    return role ? roleTitles[role] : '';
  };

  if (!role) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border bg-card shadow-glow">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <ThemeLogo className="h-20" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Inscription - {getRoleTitle()}
          </CardTitle>
          <CardDescription className="text-center text-foreground">
            Complétez vos informations pour créer votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champs communs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            {/* Champs spécifiques CONSULTANT */}
            {role === 'CONSULTANT' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="consultingFirm">Société de conseil *</Label>
                  <Input
                    id="consultingFirm"
                    value={formData.consultingFirm}
                    onChange={(e) => handleChange('consultingFirm', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise cliente</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Secteur d'activité</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleChange('industry', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Champs spécifiques BANQUIER */}
            {role === 'BANQUIER' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de la banque *</Label>
                  <Input
                    id="companyName"
                    placeholder="Nom de votre établissement bancaire"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Service *</Label>
                    <Input
                      id="department"
                      placeholder="Crédit Entreprise, Risques..."
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Poste</Label>
                    <Input
                      id="position"
                      placeholder="Chargé de clientèle, Analyste crédit..."
                      value={formData.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultingFirm">Numéro d'agrément bancaire</Label>
                  <Input
                    id="consultingFirm"
                    placeholder="Numéro ACPR ou équivalent"
                    value={formData.consultingFirm}
                    onChange={(e) => handleChange('consultingFirm', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Champs spécifiques CEO */}
            {role === 'CEO' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Secteur d'activité *</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleChange('industry', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeesCount">Nombre d'employés</Label>
                    <Select value={formData.employeesCount} onValueChange={(value) => handleChange('employeesCount', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">1-10</SelectItem>
                        <SelectItem value="50">11-50</SelectItem>
                        <SelectItem value="200">51-200</SelectItem>
                        <SelectItem value="500">200+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Poste</Label>
                  <Input
                    id="position"
                    placeholder="CEO, Directeur Général, Gérant..."
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Champs spécifiques RH_MANAGER */}
            {role === 'RH_MANAGER' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invitationCode">Code d'invitation entreprise *</Label>
                  <Input
                    id="invitationCode"
                    placeholder="HCM-XXXXX-XXXXX"
                    value={formData.invitationCode}
                    onChange={(e) => handleChange('invitationCode', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Département RH</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">Années d'expérience RH</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      value={formData.yearsExperience}
                      onChange={(e) => handleChange('yearsExperience', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Champs spécifiques EMPLOYEE */}
            {role === 'EMPLOYEE' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invitationCode">Code d'invitation entreprise *</Label>
                  <Input
                    id="invitationCode"
                    placeholder="HCM-XXXXX-XXXXX"
                    value={formData.invitationCode}
                    onChange={(e) => handleChange('invitationCode', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Département/Service</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Poste occupé</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">ID employé (optionnel)</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleChange('employeeId', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Champs spécifiques TEAM_LEADER */}
            {role === 'TEAM_LEADER' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invitationCode">Code d'invitation entreprise *</Label>
                  <Input
                    id="invitationCode"
                    placeholder="HCM-XXXXX-XXXXX"
                    value={formData.invitationCode}
                    onChange={(e) => handleChange('invitationCode', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Nom de l'équipe</Label>
                    <Input
                      id="teamName"
                      value={formData.teamName}
                      onChange={(e) => handleChange('teamName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Nombre de personnes dans l'équipe</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    value={formData.teamSize}
                    onChange={(e) => handleChange('teamSize', e.target.value)}
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary shadow-elegant"
              disabled={loading}
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link
              to="/auth/login"
              className="text-primary hover:underline"
            >
              Déjà inscrit ? Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
