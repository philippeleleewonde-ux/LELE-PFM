import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { captureAuthError } from '@/lib/sentry';
import { logAuthEvent } from '@/lib/authAnalytics';

// ✅ Type strict pour les métadonnées utilisateur
interface UserMetadata {
  role?: string;
  company_id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  company_name?: string;
  consulting_firm?: string;
  team_name?: string;
  employee_id?: string;
}

// ✅ Type pour les paramètres d'inscription avec métadonnées complètes
interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  metadata?: UserMetadata;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (params: SignUpParams) => Promise<{ error: Error | null; user?: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (params: SignUpParams) => {
    const { email, password, fullName, metadata } = params;
    const redirectUrl = `${window.location.origin}/dashboard`;

    // ✅ Construire les métadonnées utilisateur avec type strict
    const userData: UserMetadata & { full_name: string } = {
      full_name: fullName,
      ...metadata,
    };

    // 📊 ANALYTICS: Log signup started
    logAuthEvent({
      eventType: 'signup_started',
      email,
      metadata: {
        role: metadata?.role,
        fullName,
      },
    });

    // 🔍 DIAGNOSTIC LOGGING - CEO Signup Bug Investigation
    console.group('🔍 [DIAGNOSTIC] Supabase signUp() Called');
    console.log('📧 Email:', email);
    console.log('📋 Full Name:', fullName);
    console.log('🎭 Metadata:', JSON.stringify(metadata, null, 2));
    console.log('📦 Complete userData:', JSON.stringify(userData, null, 2));
    console.log('🔗 Redirect URL:', redirectUrl);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });

    // 🔍 DIAGNOSTIC LOGGING - Response from Supabase
    console.group('🔍 [DIAGNOSTIC] Supabase signUp() Response');
    if (error) {
      console.error('❌ ERROR DETECTED:');
      console.error('  Message:', error.message);
      console.error('  Name:', error.name);
      console.error('  Status:', (error as any).status);
      console.error('  Full Error Object:', JSON.stringify(error, null, 2));
      console.error('  Stack:', error.stack);

      // 🚨 SENTRY: Capture auth error with full context
      captureAuthError(error, {
        email,
        role: metadata?.role,
        action: 'signup',
      });

      // 📊 ANALYTICS: Log signup failure
      logAuthEvent({
        eventType: 'signup_failed',
        email,
        metadata: {
          role: metadata?.role,
        },
        error: {
          message: error.message,
          code: (error as any).code,
        },
      });
    } else {
      console.log('✅ Success! User created:', data?.user?.id);
      console.log('📧 User email:', data?.user?.email);
      console.log('🆔 User role from metadata:', data?.user?.user_metadata?.role);

      // 📊 ANALYTICS: Log signup success
      logAuthEvent({
        eventType: 'signup_success',
        email: data.user?.email,
        userId: data.user?.id,
        metadata: {
          role: data.user?.user_metadata?.role,
        },
      });
    }
    console.groupEnd();

    // ✅ Retourner l'utilisateur créé en plus de l'erreur
    return { error, user: data?.user || null };
  };

  const signIn = async (email: string, password: string) => {
    // 📊 ANALYTICS: Log signin started
    logAuthEvent({
      eventType: 'signin_started',
      email,
    });

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 🚨 SENTRY: Capture signin error
      captureAuthError(error, {
        email,
        action: 'signin',
      });

      // 📊 ANALYTICS: Log signin failure
      logAuthEvent({
        eventType: 'signin_failed',
        email,
        error: {
          message: error.message,
          code: (error as any).code,
        },
      });
    } else {
      // 📊 ANALYTICS: Log signin success
      logAuthEvent({
        eventType: 'signin_success',
        email: data.user?.email,
        userId: data.user?.id,
      });

      navigate('/dashboard');
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};