// ============================================
// ZONE 3 VALIDATION TABLE - Editable risk data form
// totalUL + yearsOfCollection + 6 risk category inputs
// ============================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useZone3Context, useZone3Actions } from '@/contexts/Zone3Context'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface Zone3ValidationTableProps {
  jobId: string
  onComplete: () => void
}

const RISK_FIELDS = [
  { key: 'operationalRisk', label: 'Risque Opérationnel', icon: '⚙️', description: 'Pertes liées aux processus internes, erreurs humaines, systèmes' },
  { key: 'creditRisk', label: 'Risque de Crédit', icon: '💳', description: 'Risque de défaut de contrepartie' },
  { key: 'marketRisk', label: 'Risque de Marché', icon: '📊', description: 'Risque lié aux fluctuations de marché et erreurs de règlement' },
  { key: 'liquidityRisk', label: 'Risque de Liquidité', icon: '💧', description: 'Risque de transformation et d\'illiquidité' },
  { key: 'reputationalRisk', label: 'Risque de Réputation', icon: '🏢', description: 'Risque organisationnel et d\'image' },
  { key: 'strategicRisk', label: 'Risque Stratégique', icon: '🎯', description: 'Risque santé, assurance et stratégique' }
] as const

export function Zone3ValidationTable({ jobId, onComplete }: Zone3ValidationTableProps) {
  const { state } = useZone3Context()
  const { setValidatedData, setLoading, setError } = useZone3Actions()
  const { toast } = useToast()

  const [totalUL, setTotalUL] = useState<number>(state.extractedData?.totalUL || 0)
  const [yearsOfCollection, setYearsOfCollection] = useState<number>(state.extractedData?.yearsOfCollection || 5)
  const [riskValues, setRiskValues] = useState<Record<string, number>>({
    operationalRisk: state.extractedData?.riskCategories.operationalRisk.value || 0,
    creditRisk: state.extractedData?.riskCategories.creditRisk.value || 0,
    marketRisk: state.extractedData?.riskCategories.marketRisk.value || 0,
    liquidityRisk: state.extractedData?.riskCategories.liquidityRisk.value || 0,
    reputationalRisk: state.extractedData?.riskCategories.reputationalRisk.value || 0,
    strategicRisk: state.extractedData?.riskCategories.strategicRisk.value || 0
  })
  const [isValidating, setIsValidating] = useState(false)

  const handleRiskChange = (key: string, value: string) => {
    setRiskValues(prev => ({ ...prev, [key]: Number(value) || 0 }))
  }

  const handleValidate = async () => {
    if (totalUL <= 0) {
      toast({ title: 'Total UL requis', description: 'Veuillez renseigner le Total UL', variant: 'destructive' })
      return
    }

    if (yearsOfCollection <= 0 || yearsOfCollection > 10) {
      toast({ title: 'Années invalides', description: 'Les années de collecte doivent être entre 1 et 10', variant: 'destructive' })
      return
    }

    setIsValidating(true)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée. Veuillez vous reconnecter.')

      const validatedData = {
        totalUL,
        yearsOfCollection,
        riskCategories: {
          operationalRisk: riskValues.operationalRisk,
          creditRisk: riskValues.creditRisk,
          marketRisk: riskValues.marketRisk,
          liquidityRisk: riskValues.liquidityRisk,
          reputationalRisk: riskValues.reputationalRisk,
          strategicRisk: riskValues.strategicRisk
        }
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/datascanner/jobs/${jobId}/zones/3/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          validated_data: validatedData,
          modifications: state.extractedData ? 'user_edited' : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Échec de la validation')
      }

      setValidatedData(validatedData)
      toast({ title: 'Zone 3 complétée !', description: 'Les données de risque ont été validées' })
      onComplete()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(message)
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsValidating(false)
      setLoading(false)
    }
  }

  // Get confidence for a field to determine highlight
  const getConfidence = (key: string): number => {
    const cat = state.extractedData?.riskCategories?.[key as keyof typeof state.extractedData.riskCategories]
    return cat?.confidence || 1
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Validation - Données de Risque</h2>
        <p className="text-muted-foreground text-lg">
          Vérifiez et modifiez les données de risque avant validation
        </p>
      </div>

      {/* UL + Years */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Données UL Globales
          </CardTitle>
          <CardDescription>
            Total des pertes inattendues et période de collecte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="total-ul" className="font-medium">Total UL (en k€)</Label>
              <Input
                id="total-ul"
                type="number"
                value={totalUL || ''}
                onChange={(e) => setTotalUL(Number(e.target.value) || 0)}
                placeholder="0"
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years" className="font-medium">Années de collecte</Label>
              <Input
                id="years"
                type="number"
                value={yearsOfCollection}
                onChange={(e) => setYearsOfCollection(Number(e.target.value) || 0)}
                min={1}
                max={10}
                className="text-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6 Risk Categories */}
      <Card>
        <CardHeader>
          <CardTitle>6 Catégories de Risque</CardTitle>
          <CardDescription>
            Montants en milliers (k€). Les valeurs à faible confiance sont surlignées en orange.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {RISK_FIELDS.map((field, index) => {
              const confidence = getConfidence(field.key)
              const isLowConfidence = confidence < 0.8

              return (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={isLowConfidence ? 'border-orange-300 bg-orange-50/50' : ''}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{field.icon}</span>
                          <Label className="font-medium">{field.label}</Label>
                        </div>
                        {isLowConfidence && (
                          <Badge className="bg-orange-100 text-orange-700">
                            Confiance: {Math.round(confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{field.description}</p>
                      <Input
                        type="number"
                        value={riskValues[field.key] || ''}
                        onChange={(e) => handleRiskChange(field.key, e.target.value)}
                        placeholder="0"
                        className={isLowConfidence ? 'border-orange-300' : ''}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Validate Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleValidate}
          disabled={totalUL <= 0 || isValidating}
          className="min-w-[200px]"
        >
          {isValidating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mr-2"
              >
                <Check className="h-4 w-4" />
              </motion.div>
              Validation en cours...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Valider Zone 3
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
