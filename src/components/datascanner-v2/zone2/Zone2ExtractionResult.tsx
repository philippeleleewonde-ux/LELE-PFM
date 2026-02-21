// ============================================
// ZONE 2 EXTRACTION RESULT - Display extracted financial history
// ============================================

import { motion } from 'framer-motion'
import { Clock, TrendingUp, TrendingDown, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { Zone2ExtractedData } from '@/types/datascanner-zone2'

interface Zone2ExtractionResultProps {
  data: Zone2ExtractedData
  confidence: number
  onContinue: () => void
  onRetry: () => void
}

export function Zone2ExtractionResult({ data, confidence, onContinue, onRetry }: Zone2ExtractionResultProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR')
  }

  const confidenceColor = confidence >= 0.8 ? 'text-green-600' : confidence >= 0.5 ? 'text-orange-500' : 'text-red-500'
  const confidenceBg = confidence >= 0.8 ? 'bg-green-100' : confidence >= 0.5 ? 'bg-orange-100' : 'bg-red-100'

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Résultat de l'Extraction</h2>
        <p className="text-muted-foreground text-lg">
          Données financières détectées dans vos fichiers
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Hours */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heures annuelles / personne</p>
                  <p className="text-2xl font-bold">
                    {data.annualHoursPerPerson > 0 ? data.annualHoursPerPerson : 'Non détecté'}
                  </p>
                  <Badge variant={data.hoursSource === 'extracted' ? 'default' : 'secondary'}>
                    {data.hoursSource === 'extracted' ? 'Extrait' : 'À saisir'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Years detected */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Années détectées</p>
                  <p className="text-2xl font-bold">{data.financialYears.length}</p>
                  <p className="text-xs text-muted-foreground">min 2, max 5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Confidence */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${confidenceBg}`}>
                  {confidence < 0.5 && <AlertTriangle className="h-5 w-5 text-red-600" />}
                  {confidence >= 0.5 && confidence < 0.8 && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                  {confidence >= 0.8 && <TrendingUp className="h-5 w-5 text-green-600" />}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confiance</p>
                  <p className={`text-2xl font-bold ${confidenceColor}`}>
                    {Math.round(confidence * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Financial years table */}
      {data.financialYears.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique Financier Détecté</CardTitle>
            <CardDescription>CA et Charges extraits par année (en k€)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Année</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="text-right">CA (k€)</TableHead>
                  <TableHead className="text-right">Charges (k€)</TableHead>
                  <TableHead className="text-right">Résultat (k€)</TableHead>
                  <TableHead className="text-right">Confiance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.financialYears.map((fy, index) => (
                  <motion.tr
                    key={fy.year}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TableCell className="font-medium">{fy.year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{fy.yearLabel}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {formatCurrency(fy.sales)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(fy.spending)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={fy.sales - fy.spending >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(fy.sales - fy.spending)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={fy.confidence >= 0.8 ? 'default' : 'secondary'}
                        className={fy.confidence < 0.8 ? 'bg-orange-100 text-orange-700' : ''}
                      >
                        {Math.round(fy.confidence * 100)}%
                      </Badge>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
