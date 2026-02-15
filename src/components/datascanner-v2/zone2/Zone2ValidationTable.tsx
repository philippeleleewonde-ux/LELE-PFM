// ============================================
// ZONE 2 VALIDATION TABLE - Editable financial history
// Hours + yearly CA/Charges with add/remove rows
// ============================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useZone2Context, useZone2Actions } from '@/contexts/Zone2Context'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import type { Zone2FinancialYear } from '@/types/datascanner-zone2'

interface Zone2ValidationTableProps {
  jobId: string
  onComplete: () => void
}

export function Zone2ValidationTable({ jobId, onComplete }: Zone2ValidationTableProps) {
  const { state } = useZone2Context()
  const { setValidatedData, setLoading, setError } = useZone2Actions()
  const { toast } = useToast()

  const currentYear = new Date().getFullYear()

  // Initialize from extracted or empty
  const initialYears = state.extractedData?.financialYears?.length
    ? state.extractedData.financialYears
    : [
        { year: currentYear - 1, yearLabel: 'N-1', sales: 0, spending: 0, confidence: 1 },
        { year: currentYear - 2, yearLabel: 'N-2', sales: 0, spending: 0, confidence: 1 }
      ]

  const [annualHours, setAnnualHours] = useState<number>(
    state.extractedData?.annualHoursPerPerson || 0
  )
  const [financialYears, setFinancialYears] = useState<Zone2FinancialYear[]>(initialYears)
  const [isValidating, setIsValidating] = useState(false)

  const handleYearChange = (index: number, field: keyof Zone2FinancialYear, value: any) => {
    const updated = [...financialYears]
    if (field === 'year') {
      const yearNum = Number(value)
      updated[index] = { ...updated[index], year: yearNum, yearLabel: `N-${currentYear - yearNum}` }
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) || 0 }
    }
    setFinancialYears(updated)
  }

  const handleAddYear = () => {
    if (financialYears.length >= 5) {
      toast({ title: 'Limite atteinte', description: 'Maximum 5 années', variant: 'destructive' })
      return
    }
    const lastYear = financialYears.length > 0
      ? Math.min(...financialYears.map(y => y.year)) - 1
      : currentYear - 1
    setFinancialYears([
      ...financialYears,
      { year: lastYear, yearLabel: `N-${currentYear - lastYear}`, sales: 0, spending: 0, confidence: 1 }
    ])
  }

  const handleRemoveYear = (index: number) => {
    if (financialYears.length <= 2) {
      toast({ title: 'Minimum requis', description: 'Vous devez avoir au moins 2 années', variant: 'destructive' })
      return
    }
    setFinancialYears(financialYears.filter((_, i) => i !== index))
  }

  const handleValidate = async () => {
    // Validation rules
    if (annualHours <= 0) {
      toast({ title: 'Heures requises', description: 'Veuillez renseigner les heures annuelles par personne', variant: 'destructive' })
      return
    }
    if (financialYears.length < 2) {
      toast({ title: 'Données insuffisantes', description: 'Minimum 2 années requises', variant: 'destructive' })
      return
    }

    const hasInvalidYears = financialYears.some(y => y.sales <= 0 && y.spending <= 0)
    if (hasInvalidYears) {
      toast({ title: 'Données incomplètes', description: 'Chaque année doit avoir au moins un CA ou des charges', variant: 'destructive' })
      return
    }

    setIsValidating(true)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée. Veuillez vous reconnecter.')

      const validatedData = {
        annualHoursPerPerson: annualHours,
        financialYears,
        currency: 'EUR'
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/datascanner/jobs/${jobId}/zones/2/validate`, {
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
      toast({ title: 'Zone 2 complétée !', description: 'L\'historique financier a été validé' })
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

  const formatCurrency = (value: number) => value.toLocaleString('fr-FR')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Validation - Historique Financier</h2>
        <p className="text-muted-foreground text-lg">
          Vérifiez et modifiez les données avant validation
        </p>
      </div>

      {/* Annual Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Heures Annuelles par Personne</CardTitle>
          <CardDescription>
            Nombre d'heures travaillées par an et par employé (ex: 1607h en France)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 max-w-md">
            <Label htmlFor="annual-hours" className="whitespace-nowrap font-medium">
              Heures / personne / an
            </Label>
            <Input
              id="annual-hours"
              type="number"
              value={annualHours || ''}
              onChange={(e) => setAnnualHours(Number(e.target.value) || 0)}
              placeholder="1607"
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">heures</span>
          </div>
        </CardContent>
      </Card>

      {/* Financial Years Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique CA / Charges</CardTitle>
          <CardDescription>
            Minimum 2 années, maximum 5. Valeurs en milliers (k€)
          </CardDescription>
          <div className="flex items-center gap-2">
            <Badge variant={financialYears.length >= 2 ? 'default' : 'destructive'}>
              {financialYears.length} / 5 années
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead className="min-w-[100px]">Année</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="text-right min-w-[150px]">CA (k€)</TableHead>
                  <TableHead className="text-right min-w-[150px]">Charges (k€)</TableHead>
                  <TableHead className="text-right min-w-[120px]">Résultat (k€)</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialYears.map((fy, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={fy.year}
                        onChange={(e) => handleYearChange(index, 'year', e.target.value)}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{fy.yearLabel}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={fy.sales || ''}
                        onChange={(e) => handleYearChange(index, 'sales', e.target.value)}
                        className="h-8 text-right"
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={fy.spending || ''}
                        onChange={(e) => handleYearChange(index, 'spending', e.target.value)}
                        className="h-8 text-right"
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${fy.sales - fy.spending >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(fy.sales - fy.spending)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveYear(index)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {financialYears.length < 5 && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={handleAddYear}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une année ({financialYears.length}/5)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validate Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleValidate}
          disabled={financialYears.length < 2 || annualHours <= 0 || isValidating}
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
              Valider Zone 2
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
