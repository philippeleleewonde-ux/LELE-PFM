// ============================================
// ZONE 3 EXTRACTION RESULT - Display extracted risk data
// Grid layout: Total UL + 6 risk categories with confidence
// ============================================

import { motion } from 'framer-motion'
import { Shield, AlertTriangle, ArrowRight, RotateCcw, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Zone3ExtractedRiskData } from '@/types/datascanner-zone3'

interface Zone3ExtractionResultProps {
  data: Zone3ExtractedRiskData
  confidence: number
  onContinue: () => void
  onRetry: () => void
}

const RISK_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  operationalRisk: { label: 'Risque Opérationnel', icon: '⚙️', color: 'bg-orange-50 border-orange-200' },
  creditRisk: { label: 'Risque de Crédit', icon: '💳', color: 'bg-blue-50 border-blue-200' },
  marketRisk: { label: 'Risque de Marché', icon: '📊', color: 'bg-purple-50 border-purple-200' },
  liquidityRisk: { label: 'Risque de Liquidité', icon: '💧', color: 'bg-cyan-50 border-cyan-200' },
  reputationalRisk: { label: 'Risque de Réputation', icon: '🏢', color: 'bg-amber-50 border-amber-200' },
  strategicRisk: { label: 'Risque Stratégique', icon: '🎯', color: 'bg-red-50 border-red-200' }
}

export function Zone3ExtractionResult({ data, confidence, onContinue, onRetry }: Zone3ExtractionResultProps) {
  const formatNumber = (value: number) => value.toLocaleString('fr-FR')

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Résultat de l'Extraction</h2>
        <p className="text-muted-foreground text-lg">Données de risque détectées dans vos fichiers</p>
      </div>

      {/* Summary: UL + Years + Confidence */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total UL</p>
                  <p className="text-2xl font-bold">{data.totalUL > 0 ? formatNumber(data.totalUL) : 'Non détecté'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Années de collecte</p>
                  <p className="text-2xl font-bold">{data.yearsOfCollection}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${confidence >= 0.8 ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {confidence < 0.8 ? <AlertTriangle className="h-5 w-5 text-orange-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confiance</p>
                  <p className={`text-2xl font-bold ${confidence >= 0.8 ? 'text-green-600' : 'text-orange-500'}`}>
                    {Math.round(confidence * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Risk Categories Grid 2x3 */}
      <Card>
        <CardHeader>
          <CardTitle>6 Catégories de Risque</CardTitle>
          <CardDescription>Valeurs détectées par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.riskCategories).map(([key, cat], index) => {
              const meta = RISK_LABELS[key]
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`${meta.color} ${cat.confidence < 0.8 ? 'ring-2 ring-orange-300' : ''}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg">{meta.icon}</span>
                        <Badge
                          variant={cat.confidence >= 0.8 ? 'default' : 'secondary'}
                          className={cat.confidence < 0.8 ? 'bg-orange-100 text-orange-700' : ''}
                        >
                          {Math.round(cat.confidence * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{meta.label}</p>
                      <p className="text-xl font-bold mt-1">
                        {cat.value > 0 ? formatNumber(cat.value) : 'Non détecté'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Recommencer
        </Button>
        <Button size="lg" onClick={onContinue}>
          Continuer vers la validation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
