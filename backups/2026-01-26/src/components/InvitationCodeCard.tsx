import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const InvitationCodeCard = () => {
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvitationCode = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

          if (profile?.company_id) {
            // Use the secure function to get invitation code
            const { data: code, error } = await supabase
              .rpc('get_company_invitation_code', { 
                company_uuid: profile.company_id 
              });

            if (error) {
              console.error('Error fetching invitation code:', error);
              toast({
                title: 'Erreur',
                description: 'Impossible de récupérer le code d\'invitation',
                variant: 'destructive',
              });
              return;
            }

            if (code) {
              setInvitationCode(code);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchInvitationCode();
  }, [toast]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationCode);
    setCopied(true);
    toast({
      title: 'Code copié !',
      description: 'Le code d\'invitation a été copié dans le presse-papier',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!invitationCode) return null;

  return (
    <Card className="border-primary/20 bg-card shadow-glow">
      <CardHeader>
        <CardTitle className="text-primary">Code d'invitation</CardTitle>
        <CardDescription className="text-foreground">
          Partagez ce code avec vos collaborateurs pour qu'ils rejoignent votre entreprise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-muted p-4 rounded-md">
            <code className="text-lg font-mono text-primary">{invitationCode}</code>
          </div>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
