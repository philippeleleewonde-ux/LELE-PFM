// ============================================
// ZONE 2 QUESTIONNAIRE - Choix Extract/Manual + Upload
// ============================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, PenLine, ArrowRight, Upload, Sparkles, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useZone2Actions } from '@/contexts/Zone2Context'
import { ExtractionMode } from '@/types/datascanner-v2'
import { useToast } from '@/hooks/use-toast'
import { Zone1FileUpload } from '../zone1/Zone1FileUpload'
import { supabase } from '@/integrations/supabase/client'

interface Zone2QuestionnaireProps {
  jobId: string
  onNext: () => void
}

export function Zone2Questionnaire({ jobId, onNext }: Zone2QuestionnaireProps) {
  const [selectedMode, setSelectedMode] = useState<ExtractionMode | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { setMode, setExtractedData, setLoading, setError, setStep } = useZone2Actions()
  const { toast } = useToast()

  const handleModeSelect = (mode: ExtractionMode) => {
    setSelectedMode(mode)
    setMode(mode)

    if (mode === ExtractionMode.EXTRACT) {
      setShowUpload(true)
    } else {
      // Manual mode: go directly to validation with empty data
      setExtractedData({
        annualHoursPerPerson: 0,
        hoursSource: 'manual',
        financialYears: [],
        currency: 'EUR',
        confidence: 1
      }, 1)
      setStep('validation')
      onNext()
    }
  }

  const handleUploadComplete = (fileUrls: string[]) => {
    toast({
      title: 'Fichiers prêts',
      description: `${fileUrls.length} fichier(s) uploadé(s) avec succès`,
    })
  }

  const handleStartExtraction = async () => {
    setIsProcessing(true)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée. Veuillez vous reconnecter.')

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/datascanner/jobs/${jobId}/zones/2/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Échec de l\'extraction')
      }

      const result = await response.json()

      setExtractedData(result.data, result.confidence)

      toast({
        title: 'Extraction terminée',
        description: `${result.data.financialYears.length} année(s) détectée(s)`,
      })

      onNext()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(message)
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Historique Financier</h2>
        <p className="text-muted-foreground text-lg">
          Comment souhaitez-vous renseigner les données financières ?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Extract Mode */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className={`cursor-pointer transition-all h-full ${
              selectedMode === ExtractionMode.EXTRACT
                ? 'border-primary ring-2 ring-primary/20'
                : 'hover:border-primary/40'
            }`}
            onClick={() => handleModeSelect(ExtractionMode.EXTRACT)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="default">Recommandé</Badge>
              </div>
              <CardTitle className="mt-4">Extraction Automatique</CardTitle>
              <CardDescription>
                Uploadez vos fichiers P&L / comptes de résultat et l'IA extraira automatiquement les données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Détection CA/Charges multi-années</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>Extraction heures annuelles</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span>Support Excel (P&L, bilan social)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Manual Mode */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className={`cursor-pointer transition-all h-full ${
              selectedMode === ExtractionMode.CALCULATE
                ? 'border-primary ring-2 ring-primary/20'
                : 'hover:border-primary/40'
            }`}
            onClick={() => handleModeSelect(ExtractionMode.CALCULATE)}
          >
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <PenLine className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle className="mt-4">Saisie Manuelle</CardTitle>
              <CardDescription>
                Renseignez manuellement les heures annuelles et l'historique CA/Charges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-blue-500" />
                  <span>Saisie libre des valeurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-blue-500" />
                  <span>Min 2 ans, max 5 ans</span>
                </div>
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-blue-500" />
                  <span>Pas de fichier nécessaire</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upload area */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4"
        >
          <Zone1FileUpload jobId={jobId} onUploadComplete={handleUploadComplete} />

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleStartExtraction}
              disabled={isProcessing}
              className="min-w-[200px]"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Upload className="h-4 w-4" />
                  </motion.div>
                  Extraction en cours...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Lancer l'extraction
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
