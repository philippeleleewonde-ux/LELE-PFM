import { useState, useEffect, useRef } from 'react';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  User, Mail, Phone, Building2, Briefcase, Shield, Settings,
  Camera, Save, X, Eye, EyeOff, KeyRound, Clock, Calendar,
  Sun, Moon, Monitor, Sparkles, Contrast,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  company_id: string;
  company_name: string | null;
  consulting_firm: string | null;
  team_name: string | null;
  employee_id: string | null;
  bank_name: string | null;
  license_number: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_PROFILE: ProfileData = {
  id: '',
  email: '',
  full_name: null,
  first_name: null,
  last_name: null,
  avatar_url: null,
  phone: null,
  department: null,
  position: null,
  company_id: '',
  company_name: null,
  consulting_firm: null,
  team_name: null,
  employee_id: null,
  bank_name: null,
  license_number: null,
  created_at: '',
  updated_at: '',
};

// ── Helpers ────────────────────────────────────────────

function getInitials(profile: ProfileData): string {
  const first = profile.first_name?.charAt(0) || '';
  const last = profile.last_name?.charAt(0) || '';
  if (first || last) return (first + last).toUpperCase();
  if (profile.full_name) {
    const parts = profile.full_name.split(' ');
    return parts.map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
  }
  return profile.email?.charAt(0).toUpperCase() || 'U';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Main Component ─────────────────────────────────────

const Profile = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isCollapsed, isMobile } = useSidebar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [originalProfile, setOriginalProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // ── Fetch Profile ──

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, first_name, last_name, avatar_url, phone, department, position, company_id, company_name, consulting_firm, team_name, employee_id, bank_name, license_number, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le profil',
          variant: 'destructive',
        });
      } else if (data) {
        const profileData = data as ProfileData;
        setProfile(profileData);
        setOriginalProfile(profileData);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, toast]);

  // ── Update field helper ──

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value || null }));
  };

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  const resetChanges = () => {
    setProfile(originalProfile);
  };

  // ── Save Profile ──

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!profile.first_name?.trim() && !profile.last_name?.trim() && !profile.full_name?.trim()) {
      toast({
        title: 'Validation',
        description: 'Veuillez renseigner au moins votre nom',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    // Auto-compute full_name from first_name + last_name
    const computedFullName = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(' ') || profile.full_name;

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: computedFullName,
        phone: profile.phone,
        department: profile.department,
        position: profile.position,
        team_name: profile.team_name,
        consulting_firm: profile.consulting_firm,
        bank_name: profile.bank_name,
        license_number: profile.license_number,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder : ${error.message}`,
        variant: 'destructive',
      });
    } else {
      const updated = { ...profile, full_name: computedFullName };
      setProfile(updated);
      setOriginalProfile(updated);
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées',
      });
    }

    setSaving(false);
  };

  // ── Avatar Upload ──

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner une image', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Erreur', description: 'L\'image ne doit pas dépasser 2 Mo', variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: 'Erreur d\'upload',
        description: uploadError.message,
        variant: 'destructive',
      });
      setUploadingAvatar(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    if (updateError) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour l\'avatar', variant: 'destructive' });
    } else {
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setOriginalProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      toast({ title: 'Avatar mis à jour', description: 'Votre photo de profil a été changée' });
    }

    setUploadingAvatar(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Change Password ──

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été changé avec succès' });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    }

    setChangingPassword(false);
  };

  // ── Render ──

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <CEOSidebar />
        <main className="flex-1 overflow-y-auto relative">
          <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <SidebarToggle />
                <h2 className="hidden sm:block text-lg font-bold text-foreground">Mon Profil</h2>
              </div>
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </main>
      </div>
    );
  }

  const isBanquier = role === 'BANQUIER';
  const isConsultant = role === 'CONSULTANT';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* CEO Sidebar — Menu gauche premium (identique au dashboard) */}
      <CEOSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Bar — Sticky */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <SidebarToggle />
              <h2 className="hidden sm:block text-lg font-bold text-foreground">Mon Profil</h2>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Profile Content */}
        <div className="relative z-10 p-4 sm:p-6 md:p-8">
      <div className="relative max-w-4xl mx-auto">
        {/* Floating decorative orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-cyan-500/5 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-cyan-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border border-cyan-200/50 dark:border-cyan-500/30 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              Espace Personnel
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{
              background: theme === 'bw-dark'
                ? 'linear-gradient(135deg, #FFFFFF 0%, #CCCCCC 100%)'
                : theme === 'bw-light'
                  ? 'linear-gradient(135deg, #000000 0%, #333333 100%)'
                  : theme === 'dark'
                    ? 'linear-gradient(135deg, #5DD3F3 0%, #87E6FA 100%)'
                    : 'linear-gradient(135deg, #0A2F4F 0%, #5DD3F3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Mon Profil
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos informations personnelles et professionnelles
          </p>
        </div>

        {/* Avatar + Identity Card */}
        <Card className="mb-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-cyan-200/30 dark:border-cyan-500/20 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/5 rounded-2xl animate-fade-in-up animate-delay-100">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-cyan-200/50 dark:border-cyan-500/30 ring-4 ring-cyan-100/30 dark:ring-cyan-500/10">
                  <AvatarImage src={profile.avatar_url || undefined} alt="Photo de profil" />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-500/20 dark:to-blue-500/20 text-secondary dark:text-cyan-400 text-2xl font-bold">
                    {getInitials(profile)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  </div>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-foreground">
                  {profile.full_name || profile.email}
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {profile.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                  {!roleLoading && role && (
                    <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 text-primary text-xs font-medium uppercase tracking-wide border border-cyan-200/50 dark:border-cyan-500/30">
                      {role}
                    </span>
                  )}
                  {profile.company_name && (
                    <span className="px-2.5 py-1 rounded-md bg-muted border border-border text-foreground text-xs font-medium">
                      {profile.company_name}
                    </span>
                  )}
                  {profile.department && (
                    <span className="px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground text-xs">
                      {profile.department}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1 justify-center sm:justify-start">
                  <Calendar className="w-3 h-3" />
                  Membre depuis {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200/30 dark:border-cyan-500/20 backdrop-blur-sm animate-fade-in-up animate-delay-200">
            <TabsTrigger value="personal" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white/90 data-[state=active]:dark:bg-gray-800/90 data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Personnel</span>
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white/90 data-[state=active]:dark:bg-gray-800/90 data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Professionnel</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white/90 data-[state=active]:dark:bg-gray-800/90 data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white/90 data-[state=active]:dark:bg-gray-800/90 data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Préférences</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Personnel ── */}
          <TabsContent value="personal">
            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-cyan-200/30 dark:border-cyan-500/20 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/5 rounded-2xl card-hover-lift animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-lg">Informations Personnelles</CardTitle>
                <CardDescription>Vos coordonnées et informations de base</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary/60 dark:text-primary/50" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted/50 dark:bg-muted/30 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent" />

                {/* First Name + Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={profile.first_name || ''}
                      onChange={(e) => updateField('first_name', e.target.value)}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={profile.last_name || ''}
                      onChange={(e) => updateField('last_name', e.target.value)}
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary/60 dark:text-primary/50" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                {/* Save/Cancel */}
                {hasChanges && (
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetChanges}
                      disabled={saving}
                      className="border-border hover:bg-accent hover:text-accent-foreground transition-all"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Professionnel ── */}
          <TabsContent value="professional">
            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-cyan-200/30 dark:border-cyan-500/20 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/5 rounded-2xl card-hover-lift animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-lg">Informations Professionnelles</CardTitle>
                <CardDescription>Votre rôle et votre organisation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role (read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary/60 dark:text-primary/50" />
                    Rôle
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={roleLoading ? 'Chargement...' : (role || 'Non défini')}
                      disabled
                      className="bg-muted/50 dark:bg-muted/30 text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Le rôle est géré par votre administrateur</p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent" />

                {/* Company (read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary/60 dark:text-primary/50" />
                    Entreprise
                  </Label>
                  <Input
                    value={profile.company_name || 'Non renseignée'}
                    disabled
                    className="bg-muted/50 dark:bg-muted/30 text-muted-foreground"
                  />
                </div>

                {/* Department + Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <Input
                      id="department"
                      value={profile.department || ''}
                      onChange={(e) => updateField('department', e.target.value)}
                      placeholder="Ressources Humaines"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Poste</Label>
                    <Input
                      id="position"
                      value={profile.position || ''}
                      onChange={(e) => updateField('position', e.target.value)}
                      placeholder="Directeur RH"
                    />
                  </div>
                </div>

                {/* Team */}
                <div className="space-y-2">
                  <Label htmlFor="team">Équipe</Label>
                  <Input
                    id="team"
                    value={profile.team_name || ''}
                    onChange={(e) => updateField('team_name', e.target.value)}
                    placeholder="Équipe Performance"
                  />
                </div>

                {/* Employee ID (read-only) */}
                {profile.employee_id && (
                  <div className="space-y-2">
                    <Label>Identifiant employé</Label>
                    <Input
                      value={profile.employee_id}
                      disabled
                      className="bg-muted/50 dark:bg-muted/30 text-muted-foreground"
                    />
                  </div>
                )}

                {/* Consultant-specific */}
                {isConsultant && (
                  <>
                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent" />
                    <div className="space-y-2">
                      <Label htmlFor="consultingFirm">Cabinet de conseil</Label>
                      <Input
                        id="consultingFirm"
                        value={profile.consulting_firm || ''}
                        onChange={(e) => updateField('consulting_firm', e.target.value)}
                        placeholder="Nom du cabinet"
                      />
                    </div>
                  </>
                )}

                {/* Banker-specific */}
                {isBanquier && (
                  <>
                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent" />
                    <h3 className="text-sm font-semibold text-foreground pt-2">
                      Informations Bancaires
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Banque</Label>
                        <Input
                          id="bankName"
                          value={profile.bank_name || ''}
                          onChange={(e) => updateField('bank_name', e.target.value)}
                          placeholder="Nom de la banque"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">N° de licence</Label>
                        <Input
                          id="licenseNumber"
                          value={profile.license_number || ''}
                          onChange={(e) => updateField('license_number', e.target.value)}
                          placeholder="LIC-XXXXX"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Save/Cancel */}
                {hasChanges && (
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetChanges}
                      disabled={saving}
                      className="border-border hover:bg-accent hover:text-accent-foreground transition-all"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Sécurité ── */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Change Password */}
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-cyan-200/30 dark:border-cyan-500/20 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/5 rounded-2xl card-hover-lift animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-primary/60 dark:text-primary/50" />
                    Mot de passe
                  </CardTitle>
                  <CardDescription>Modifiez votre mot de passe de connexion</CardDescription>
                </CardHeader>
                <CardContent>
                  {!showPasswordForm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowPasswordForm(true)}
                      className="border-border hover:bg-accent hover:text-accent-foreground transition-all"
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      Changer le mot de passe
                    </Button>
                  ) : (
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 8 caractères"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {newPassword.length > 0 && newPassword.length < 8 && (
                          <p className="text-xs text-red-500">Minimum 8 caractères requis</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Retapez le mot de passe"
                        />
                        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                          <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleChangePassword}
                          disabled={changingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                        >
                          {changingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="border-border hover:bg-accent hover:text-accent-foreground transition-all"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session Info */}
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-cyan-200/30 dark:border-cyan-500/20 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/5 rounded-2xl card-hover-lift animate-fade-in-up animate-delay-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary/60 dark:text-primary/50" />
                    Informations de session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Dernière mise à jour du profil</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatDateTime(profile.updated_at)}
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent" />
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Compte créé le</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(profile.created_at)}
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent" />
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Identifiant utilisateur</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {profile.id.slice(0, 8)}...{profile.id.slice(-4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab: Préférences ── */}
          <TabsContent value="preferences">
            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-cyan-200/30 dark:border-cyan-500/20 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/5 rounded-2xl card-hover-lift animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-lg">Préférences d'affichage</CardTitle>
                <CardDescription>Personnalisez votre expérience sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Thème d'affichage</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Clair */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                        theme === 'light'
                          ? 'border-primary bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 shadow-lg shadow-primary/10'
                          : 'border-border bg-card hover:border-primary/30',
                      )}
                    >
                      <Sun className={cn('w-6 h-6', theme === 'light' ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-xs font-medium', theme === 'light' ? 'text-primary' : 'text-muted-foreground')}>
                        Clair
                      </span>
                    </button>

                    {/* Sombre */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                        theme === 'dark'
                          ? 'border-primary bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 shadow-lg shadow-primary/10'
                          : 'border-border bg-card hover:border-primary/30',
                      )}
                    >
                      <Moon className={cn('w-6 h-6', theme === 'dark' ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-xs font-medium', theme === 'dark' ? 'text-primary' : 'text-muted-foreground')}>
                        Sombre
                      </span>
                    </button>

                    {/* Blanc & Noir */}
                    <button
                      type="button"
                      onClick={() => setTheme('bw-light')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                        theme === 'bw-light'
                          ? 'border-primary bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg shadow-black/10'
                          : 'border-border bg-card hover:border-primary/30',
                      )}
                    >
                      <Contrast className={cn('w-6 h-6', theme === 'bw-light' ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-xs font-medium', theme === 'bw-light' ? 'text-primary' : 'text-muted-foreground')}>
                        Blanc & Noir
                      </span>
                    </button>

                    {/* Noir & Blanc */}
                    <button
                      type="button"
                      onClick={() => setTheme('bw-dark')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                        theme === 'bw-dark'
                          ? 'border-primary bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg shadow-white/10'
                          : 'border-border bg-card hover:border-primary/30',
                      )}
                    >
                      <Contrast className={cn('w-6 h-6 rotate-180', theme === 'bw-dark' ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-xs font-medium', theme === 'bw-dark' ? 'text-primary' : 'text-muted-foreground')}>
                        Noir & Blanc
                      </span>
                    </button>

                    {/* Auto (disabled) */}
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border bg-muted/50">
                      <Monitor className="w-6 h-6 text-muted-foreground/50" />
                      <span className="text-xs font-medium text-muted-foreground/50">
                        Auto
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">Bientôt</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent" />

                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Langue</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-primary bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950">
                      <span className="text-sm">🇫🇷</span>
                      <span className="text-sm font-medium text-primary">Français</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/50">
                      <span className="text-sm">🇬🇧</span>
                      <span className="text-sm text-muted-foreground/50">English</span>
                      <span className="text-[10px] text-muted-foreground/50 ml-1">Bientôt</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent" />

                {/* Notifications */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    La gestion des notifications sera disponible dans une prochaine mise à jour.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
        </div>
      </main>

    </div>
  );
};

export default Profile;
