// ============================================
// ZONE 1 EXTRACTION RESULT - Affichage N Lignes Extraites
// Affiche les lignes détectées avant regroupement Gemini
// ============================================

import { motion } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import type { Zone1Data, BusinessLine } from '@/types/datascanner-v2'

interface Zone1ExtractionResultProps {
  data: Zone1Data
  needsRegrouping: boolean
  confidence: number
  onContinue: () => void
  onRetry?: () => void
}

export function Zone1ExtractionResult({
  data,
  needsRegrouping,
  confidence,
  onContinue,
  onRetry
}: Zone1ExtractionResultProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600'
    if (conf >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'Haute'
    if (conf >= 0.6) return 'Moyenne'
    return 'Faible'
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {/* Total Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lignes Détectées</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_lines}</div>
            <p className="text-xs text-muted-foreground">
              {data.detection_method === 'keyword' ? 'Extraction directe' : 'Calcul comptable'}
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">Somme de toutes les lignes</p>
          </CardContent>
        </Card>

        {/* Confidence Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance</CardTitle>
            <CheckCircle2 className={`h-4 w-4 ${getConfidenceColor(confidence)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConfidenceColor(confidence)}`}>
              {(confidence * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Précision {getConfidenceLabel(confidence)}
            </p>
            <Progress value={confidence * 100} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Alert si regroupement nécessaire */}
      {needsRegrouping && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">
              Regroupement Intelligent Requis
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              {data.total_lines} lignes ont été détectées, mais vous avez besoin de 8 catégories.
              <br />
              <strong>Gemini AI</strong> va regrouper intelligemment vos lignes en 8 business lines cohérentes.
              <br />
              <span className="text-xs">Temps estimé : 10-15 secondes</span>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Table des lignes extraites */}
      <Card>
        <CardHeader>
          <CardTitle>Business Lines Extraites</CardTitle>
          <CardDescription>
            {data.total_lines === 8
              ? 'Les 8 lignes sont déjà au format requis'
              : `${data.total_lines} lignes détectées - Regroupement nécessaire`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.business_lines.map((line: BusinessLine, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge variant="outline" className="flex-shrink-0">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{line.name}</p>
                    {line.category && (
                      <p className="text-xs text-muted-foreground truncate">
                        Catégorie: {line.category}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Revenue */}
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(line.revenue_n)}
                    </p>
                    <p className="text-xs text-muted-foreground">CA N</p>
                  </div>

                  {/* Evolution N-1 */}
                  {line.revenue_n_minus_1 > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {line.revenue_n > line.revenue_n_minus_1 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className="text-xs font-medium">
                          {(((line.revenue_n - line.revenue_n_minus_1) / line.revenue_n_minus_1) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">vs N-1</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Méthode de détection</span>
              <Badge variant="secondary">
                {data.detection_method === 'keyword' ? '🔍 Extraction par mots-clés' : '🧮 Calcul comptable'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source des données</span>
              <span className="font-medium">{data.source_file || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Année fiscale</span>
              <span className="font-medium">{data.fiscal_year || new Date().getFullYear()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Réessayer l'extraction
          </Button>
        )}

        <Button size="lg" onClick={onContinue} className="ml-auto min-w-[200px]">
          {needsRegrouping ? (
            <>
              Lancer le regroupement Gemini
              <Sparkles className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Continuer vers la validation
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
