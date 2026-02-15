// ============================================
// ZONE 1 REGROUPEMENT PROPOSAL - Proposition Gemini
// Affiche le mapping intelligent N lignes → 8 avec reasoning
// ============================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useZone1Context, useZone1Actions } from '@/contexts/Zone1Context'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import type { BusinessLine } from '@/types/datascanner-v2'

interface Zone1RegroupementProposalProps {
  jobId: string
  onAccept: () => void
  onManualEntry: () => void
}

export function Zone1RegroupementProposal({
  jobId,
  onAccept,
  onManualEntry
}: Zone1RegroupementProposalProps) {
  const { state } = useZone1Context()
  const { setRegroupedData, setLoading, setError } = useZone1Actions()
  const { toast } = useToast()
  const [isRegrouping, setIsRegrouping] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [regrouped, setRegrouped] = useState(false)

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  const handleRegroupWithGemini = async () => {
    setIsRegrouping(true)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée. Veuillez vous reconnecter.')

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/datascanner/jobs/${jobId}/zones/1/regroup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          use_llm: true,
          llm_provider: 'gemini'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Échec du regroupement')
      }

      const result = await response.json()

      setRegroupedData({
        groupedLines: result.data.business_lines,
        mapping: result.data.mapping || {},
        method: result.method,
        confidence: result.confidence
      })

      setRegrouped(true)

      toast({
        title: 'Regroupement réussi',
        description: `Gemini a regroupé ${state.totalDetected} lignes en 8 catégories avec ${Math.round(result.confidence * 100)}% de confiance`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(message)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsRegrouping(false)
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Affichage avant regroupement
  if (!regrouped) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Regroupement Intelligent</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            <span className="font-semibold text-primary">{state.totalDetected} lignes d'activités</span> ont été détectées.
            Gemini 2.5 Flash peut les regrouper intelligemment en 8 catégories standardisées.
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              Regroupement Powered by Gemini 2.5 Flash
            </CardTitle>
            <CardDescription>
              L'IA analysera sémantiquement vos {state.totalDetected} lignes et les regroupera en 8 catégories cohérentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Analyse sémantique des noms de lignes
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Agrégation automatique des métriques
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Justification (reasoning) pour chaque regroupement
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Durée estimée : 10-15 secondes
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleRegroupWithGemini}
            disabled={isRegrouping}
            className="min-w-[200px]"
          >
            {isRegrouping ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                Regroupement en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Regrouper avec Gemini
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onManualEntry}
            disabled={isRegrouping}
          >
            Saisie Manuelle des 8 Titres
          </Button>
        </div>
      </div>
    )
  }

  // Affichage après regroupement (résultat Gemini)
  const regroupementResult = state.regroupementResult
  if (!regroupementResult) return null

  return (
    <div className="space-y-8">
      {/* Header with Confidence */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
            <Check className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Proposition de Regroupement</h2>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-1">
            Confiance: {Math.round(regroupementResult.confidence * 100)}%
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            Méthode: {regroupementResult.method.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Grouped Lines */}
      <div className="space-y-4">
        {regroupementResult.groupedLines.map((line: BusinessLine, index: number) => {
          const isExpanded = expandedGroups.has(line.name)

          // Trouver les lignes originales regroupées
          const originalLines = Object.entries(regroupementResult.mapping || {})
            .filter(([_, mapping]) => mapping.groupedLineName === line.name)
            .map(([originalName, mapping]) => ({
              name: originalName,
              reasoning: mapping.reasoning
            }))

          return (
            <motion.div
              key={line.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{line.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Catégorie: {line.category}
                      </CardDescription>
                    </div>
                    {originalLines.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroup(line.name)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Revenue N</span>
                      </div>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(line.revenue_n)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Revenue N-1</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(line.revenue_n_minus_1)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Headcount</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {line.headcount_n || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Original Lines (expanded) */}
                  <AnimatePresence>
                    {isExpanded && originalLines.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Lignes regroupées ({originalLines.length}):</p>
                          {originalLines.map((original, i) => (
                            <div key={i} className="pl-4 border-l-2 border-primary/30 space-y-1">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <ArrowRight className="h-3 w-3 text-primary" />
                                {original.name}
                              </p>
                              {original.reasoning && (
                                <p className="text-xs text-muted-foreground italic">
                                  {original.reasoning}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={onAccept}
          className="min-w-[200px]"
        >
          <Check className="mr-2 h-4 w-4" />
          Accepter le Regroupement
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={onManualEntry}
        >
          <X className="mr-2 h-4 w-4" />
          Refuser et Saisir Manuellement
        </Button>
      </div>
    </div>
  )
}
