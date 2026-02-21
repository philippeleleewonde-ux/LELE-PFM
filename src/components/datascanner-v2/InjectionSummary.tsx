// ============================================
// INJECTION SUMMARY - Recap of 3 zones + inject button
// ============================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Building2,
  Clock,
  Shield,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { DataInjectorService } from '@/lib/datascanner-v2/services/DataInjectorService'
import { useToast } from '@/hooks/use-toast'

interface InjectionSummaryProps {
  jobId: string
  zone1Complete: boolean
  zone2Complete: boolean
  zone3Complete: boolean
  onInjectionSuccess?: () => void
}

export function InjectionSummary({
  jobId,
  zone1Complete,
  zone2Complete,
  zone3Complete,
  onInjectionSuccess
}: InjectionSummaryProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isInjecting, setIsInjecting] = useState(false)
  const [injectionResult, setInjectionResult] = useState<{
    success: boolean
    performancePlanId?: string
    error?: string
    injectedZones: number[]
  } | null>(null)

  const allZonesComplete = zone1Complete && zone2Complete && zone3Complete

  const handleInject = async () => {
    if (!user?.id) {
      toast({ title: 'Erreur', description: 'Utilisateur non connecté', variant: 'destructive' })
      return
    }

    setIsInjecting(true)

    try {
      const result = await DataInjectorService.injectIntoPerformancePlan(jobId, user.id)
      setInjectionResult(result)

      if (result.success) {
        toast({
          title: 'Injection réussie !',
          description: `${result.injectedZones.length} zone(s) injectée(s) dans le Performance Plan`
        })
        onInjectionSuccess?.()
      } else {
        toast({
          title: 'Erreur d\'injection',
          description: result.error || 'Erreur inconnue',
          variant: 'destructive'
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setInjectionResult({ success: false, error: message, injectedZones: [] })
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsInjecting(false)
    }
  }

  const zones = [
    {
      number: 1,
      title: 'Business Lines',
      description: 'Lignes métier avec effectifs, équipes et budget',
      icon: Building2,
      complete: zone1Complete,
      page: 'Page 2'
    },
    {
      number: 2,
      title: 'Historique Financier',
      description: 'Heures annuelles, CA et charges multi-années',
      icon: Clock,
      complete: zone2Complete,
      page: 'Page 3'
    },
    {
      number: 3,
      title: 'Données de Risque',
      description: 'Total UL, années de collecte et 6 catégories de risque',
      icon: Shield,
      complete: zone3Complete,
      page: 'Page 4'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Récapitulatif DataScanner</h2>
        <p className="text-muted-foreground text-lg">
          Toutes les zones sont complétées. Prêt pour l'injection dans le Performance Plan.
        </p>
      </div>

      {/* Zone cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {zones.map((zone, index) => (
          <motion.div
            key={zone.number}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            <Card className={zone.complete ? 'border-green-200 bg-green-50/50' : 'border-muted'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    {zone.complete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <zone.icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <Badge variant={zone.complete ? 'default' : 'secondary'}>
                    {zone.page}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg">
                  Zone {zone.number} : {zone.title}
                </CardTitle>
                <CardDescription>{zone.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {zone.complete ? (
                    <Badge variant="default" className="bg-green-600">Validée</Badge>
                  ) : (
                    <Badge variant="destructive">En attente</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Injection success */}
      {injectionResult?.success && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Injection réussie !</AlertTitle>
            <AlertDescription className="text-green-700">
              Les données des zones {injectionResult.injectedZones.join(', ')} ont été injectées dans le Performance Plan.
              <br />
              <a
                href="/modules/performance-plan"
                className="font-medium text-green-800 underline hover:text-green-900 mt-2 inline-block"
              >
                Ouvrir le Performance Plan →
              </a>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Injection error */}
      {injectionResult?.error && (
        <Alert variant="destructive">
          <AlertTitle>Erreur d'injection</AlertTitle>
          <AlertDescription>{injectionResult.error}</AlertDescription>
        </Alert>
      )}

      {/* Inject button */}
      {!injectionResult?.success && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleInject}
            disabled={!allZonesComplete || isInjecting}
            className="min-w-[300px] h-14 text-lg"
          >
            {isInjecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Injection en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Injecter dans Performance Plan
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
