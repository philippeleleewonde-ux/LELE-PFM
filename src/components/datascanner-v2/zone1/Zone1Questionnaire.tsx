// ============================================
// ZONE 1 QUESTIONNAIRE - Choix Extract/Calculate
// Design: Cards élégantes avec animations Framer Motion
// ============================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Calculator, ArrowRight, Upload, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useZone1Actions } from '@/contexts/Zone1Context'
import { ExtractionMode } from '@/types/datascanner-v2'
import { useToast } from '@/hooks/use-toast'
import { Zone1FileUpload } from './Zone1FileUpload'
import { supabase } from '@/integrations/supabase/client'

interface Zone1QuestionnaireProps {
  jobId: string
  onNext: () => void
}

export function Zone1Questionnaire({ jobId, onNext }: Zone1QuestionnaireProps) {
  const [selectedMode, setSelectedMode] = useState<ExtractionMode | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { setMode, setExtractedData, setLoading, setError } = useZone1Actions()
  const { toast } = useToast()

  const handleModeSelect = (mode: ExtractionMode) => {
    setSelectedMode(mode)
    setMode(mode)

    // Si mode extraction, afficher l'upload de fichiers
    if (mode === ExtractionMode.EXTRACT) {
      setShowUpload(true)
    } else {
      setShowUpload(false)
    }
  }

  const handleUploadComplete = (fileUrls: string[]) => {
    setUploadedFileUrls(fileUrls)
    toast({
      title: 'Fichiers prêts',
      description: `${fileUrls.length} fichier(s) uploadé(s) avec succès`,
    })
  }

  const handleProceed = async () => {
    if (!selectedMode) {
      toast({
        title: 'Choix requis',
        description: 'Veuillez sélectionner une méthode d\'extraction',
        variant: 'destructive'
      })
      return
    }

    // Si mode extraction, vérifier qu'on a des fichiers
    if (selectedMode === ExtractionMode.EXTRACT && uploadedFileUrls.length === 0) {
      toast({
        title: 'Fichiers requis',
        description: 'Veuillez uploader au moins un fichier Excel/PDF',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    setLoading(true)

    try {
      // Mode Calculate - for now, still using demo mode
      if (selectedMode === ExtractionMode.CALCULATE) {
        await new Promise(resolve => setTimeout(resolve, 2500))

        const mockData = {
          total_lines: 8,
          business_lines: [
            { line_name: 'Ventes de marchandises', revenue_n: 150000, revenue_n_minus_1: 140000, headcount_n: 5 },
            { line_name: 'Production vendue', revenue_n: 300000, revenue_n_minus_1: 280000, headcount_n: 15 },
            { line_name: 'Prestations de services', revenue_n: 200000, revenue_n_minus_1: 190000, headcount_n: 10 },
            { line_name: 'Sous-traitance', revenue_n: 50000, revenue_n_minus_1: 45000, headcount_n: 3 }
          ]
        }

        setExtractedData(mockData, false, mockData.total_lines, 0.95)
        toast({
          title: '⚠️ Mode Démo - Calculate',
          description: `${mockData.total_lines} lignes calculées (simulation)`,
          duration: 5000
        })
        onNext()
        return
      }

      // Mode Extract - Real backend API call
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No active session. Please login again.')
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      // Call backend API
      const response = await fetch(`${API_URL}/api/datascanner/jobs/${jobId}/zones/1/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      setExtractedData(
        result.data,
        result.needs_regrouping,
        result.total_detected,
        result.confidence
      )

      toast({
        title: '✅ Extraction Réussie',
        description: `${result.total_detected} lignes détectées avec ${Math.round(result.confidence * 100)}% de confiance`,
      })

      onNext()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(message)
      console.error('Extraction error:', error)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
      setLoading(false)
    }
  }

  const modes = [
    {
      id: ExtractionMode.EXTRACT,
      title: 'Extraction Directe',
      description: 'Extraire les lignes d\'activités depuis vos documents Excel/PDF',
      icon: FileText,
      badge: 'Recommandé',
      color: 'from-blue-500 to-cyan-500',
      features: [
        'Détection automatique des lignes',
        'Regroupement intelligent avec Gemini',
        'Haute précision (90-95%)'
      ]
    },
    {
      id: ExtractionMode.CALCULATE,
      title: 'Calcul Comptable',
      description: 'Calculer les 8 lignes depuis vos données comptables (Plan Comptable Général)',
      icon: Calculator,
      badge: 'Alternative',
      color: 'from-purple-500 to-pink-500',
      features: [
        'Mapping codes comptables PCG',
        'Agrégation automatique',
        'Résultats en 8 catégories'
      ]
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Zone 1 : Business Lines</h2>
        <p className="text-muted-foreground text-lg">
          Comment souhaitez-vous obtenir vos 8 lignes d'activités ?
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {modes.map((mode, index) => {
          const Icon = mode.icon
          const isSelected = selectedMode === mode.id

          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''
                }`}
                onClick={() => handleModeSelect(mode.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${mode.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {mode.badge && (
                      <Badge variant={mode.badge === 'Recommandé' ? 'default' : 'secondary'}>
                        {mode.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    {mode.title}
                    {mode.id === ExtractionMode.EXTRACT && (
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    )}
                  </CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {mode.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* File Upload (if EXTRACT mode selected) */}
      {showUpload && selectedMode === ExtractionMode.EXTRACT && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Upload de fichiers
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Uploadez vos fichiers Excel/PDF contenant les lignes d'activités à extraire
                </p>
              </div>
            </div>
          </div>

          <Zone1FileUpload
            jobId={jobId}
            onUploadComplete={handleUploadComplete}
            maxFiles={5}
          />
        </motion.div>
      )}

      {/* Action Button - Only show if not in upload mode or if files are uploaded */}
      {(!showUpload || uploadedFileUrls.length > 0 || selectedMode === ExtractionMode.CALCULATE) && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleProceed}
            disabled={
              !selectedMode ||
              isProcessing ||
              (selectedMode === ExtractionMode.EXTRACT && uploadedFileUrls.length === 0)
            }
            className="min-w-[200px]"
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                Extraction en cours...
              </>
            ) : (
              <>
                {selectedMode === ExtractionMode.EXTRACT ? 'Extraire les données' : 'Calculer les données'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
