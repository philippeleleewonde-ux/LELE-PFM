// ============================================
// ZONE 1 VALIDATION TABLE - Table Éditable
// Permet modification inline des 8 business lines avant validation finale
// ============================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Edit, X, Save, Trash2, Plus } from 'lucide-react'
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
import { useZone1Context, useZone1Actions } from '@/contexts/Zone1Context'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import type { BusinessLine } from '@/types/datascanner-v2'

interface Zone1ValidationTableProps {
  jobId: string
  onComplete: () => void
}

export function Zone1ValidationTable({ jobId, onComplete }: Zone1ValidationTableProps) {
  const { state } = useZone1Context()
  const { setValidatedData, setLoading, setError } = useZone1Actions()
  const { toast } = useToast()

  // Initialiser avec les données regroupées ou extraites
  const initialLines =
    state.regroupementResult?.groupedLines ||
    state.extractedData?.business_lines ||
    []

  const [businessLines, setBusinessLines] = useState<BusinessLine[]>(initialLines)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const handleEdit = (index: number) => {
    setEditingIndex(index)
  }

  const handleSave = (index: number) => {
    setEditingIndex(null)
    toast({
      title: 'Ligne mise à jour',
      description: `La ligne "${businessLines[index].name}" a été modifiée`,
    })
  }

  const handleCancel = (index: number) => {
    // Restaurer les valeurs originales
    setBusinessLines([...initialLines])
    setEditingIndex(null)
  }

  const handleChange = (index: number, field: keyof BusinessLine | string, value: any) => {
    const updated = [...businessLines]

    if (field === 'name' || field === 'category') {
      updated[index] = { ...updated[index], [field]: value }
    } else {
      // Champs numériques (revenue_n, headcount_n, etc.)
      updated[index] = {
        ...updated[index],
        [field]: value === '' ? 0 : Number(value)
      }
    }

    setBusinessLines(updated)
  }

  const handleDelete = (index: number) => {
    if (businessLines.length <= 1) {
      toast({
        title: 'Suppression impossible',
        description: 'Vous devez avoir au moins 1 ligne',
        variant: 'destructive'
      })
      return
    }

    setBusinessLines(businessLines.filter((_, i) => i !== index))
    toast({
      title: 'Ligne supprimée',
      description: `La ligne a été supprimée. Il reste ${businessLines.length - 1} ligne(s)`,
    })
  }

  const handleAddLine = () => {
    if (businessLines.length >= 8) {
      toast({
        title: 'Limite atteinte',
        description: 'Vous ne pouvez pas avoir plus de 8 lignes',
        variant: 'destructive'
      })
      return
    }

    const newLine: BusinessLine = {
      name: `Nouvelle ligne ${businessLines.length + 1}`,
      category: 'Other Activities' as any,
      year: new Date().getFullYear(),
      revenue_n: 0,
      revenue_n_minus_1: 0,
      revenue_n_minus_2: 0,
      revenue_n_minus_3: 0,
      revenue_n_minus_4: 0,
      headcount_n: 0,
      headcount_n_minus_1: 0,
      team_count: 0,
      budget: 0
    }

    setBusinessLines([...businessLines, newLine])
    setEditingIndex(businessLines.length)
  }

  const handleValidate = async () => {
    // Validation: exactement 8 lignes
    if (businessLines.length !== 8) {
      toast({
        title: 'Validation échouée',
        description: `Vous devez avoir exactement 8 lignes (actuellement: ${businessLines.length})`,
        variant: 'destructive'
      })
      return
    }

    // Validation: toutes les lignes ont un nom
    const invalidLines = businessLines.filter(line => !line.name || line.name.trim() === '')
    if (invalidLines.length > 0) {
      toast({
        title: 'Validation échouée',
        description: 'Toutes les lignes doivent avoir un nom',
        variant: 'destructive'
      })
      return
    }

    setIsValidating(true)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée. Veuillez vous reconnecter.')

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/datascanner/jobs/${jobId}/zones/1/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          business_lines: businessLines,
          user_notes: 'Validé depuis l\'interface Zone 1'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Échec de la validation')
      }

      const result = await response.json()

      setValidatedData(businessLines)

      toast({
        title: 'Zone 1 complétée !',
        description: 'Les 8 business lines ont été validées avec succès',
      })

      onComplete()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(message)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsValidating(false)
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '0'
    return value.toLocaleString('fr-FR')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Validation Finale</h2>
        <p className="text-muted-foreground text-lg">
          Vérifiez et modifiez les 8 business lines avant validation
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant={businessLines.length === 8 ? 'default' : 'destructive'}>
            {businessLines.length} / 8 lignes
          </Badge>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Business Lines</CardTitle>
          <CardDescription>
            Cliquez sur "Modifier" pour éditer une ligne, ou ajoutez/supprimez des lignes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead className="min-w-[200px]">Nom</TableHead>
                  <TableHead className="min-w-[150px]">Catégorie</TableHead>
                  <TableHead className="text-right min-w-[120px]">Revenue N (€)</TableHead>
                  <TableHead className="text-right min-w-[120px]">Revenue N-1 (€)</TableHead>
                  <TableHead className="text-right min-w-[100px]">Headcount</TableHead>
                  <TableHead className="text-right min-w-[100px]">Equipes</TableHead>
                  <TableHead className="text-right min-w-[120px]">Budget (k€)</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessLines.map((line, index) => {
                  const isEditing = editingIndex === index

                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={isEditing ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>

                      {/* Name */}
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={line.name}
                            onChange={(e) => handleChange(index, 'name', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span>{line.name}</span>
                        )}
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={line.category}
                            onChange={(e) => handleChange(index, 'category', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <Badge variant="outline">{line.category}</Badge>
                        )}
                      </TableCell>

                      {/* Revenue N */}
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={line.revenue_n || 0}
                            onChange={(e) => handleChange(index, 'revenue_n', e.target.value)}
                            className="h-8 text-right"
                          />
                        ) : (
                          <span className="text-green-600 font-semibold">{formatCurrency(line.revenue_n)}</span>
                        )}
                      </TableCell>

                      {/* Revenue N-1 */}
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={line.revenue_n_minus_1 || 0}
                            onChange={(e) => handleChange(index, 'revenue_n_minus_1', e.target.value)}
                            className="h-8 text-right"
                          />
                        ) : (
                          <span>{formatCurrency(line.revenue_n_minus_1)}</span>
                        )}
                      </TableCell>

                      {/* Headcount */}
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={line.headcount_n || ''}
                            onChange={(e) => handleChange(index, 'headcount_n', e.target.value)}
                            className="h-8 text-right"
                            placeholder="N/A"
                          />
                        ) : (
                          <span>{line.headcount_n || 'N/A'}</span>
                        )}
                      </TableCell>

                      {/* Equipes (Team Count) */}
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={line.team_count || ''}
                            onChange={(e) => handleChange(index, 'team_count', e.target.value)}
                            className="h-8 text-right"
                            placeholder="N/A"
                          />
                        ) : (
                          <span>{line.team_count || 'N/A'}</span>
                        )}
                      </TableCell>

                      {/* Budget (k€) */}
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={line.budget || ''}
                            onChange={(e) => handleChange(index, 'budget', e.target.value)}
                            className="h-8 text-right"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-blue-600 font-semibold">{formatCurrency(line.budget)}</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSave(index)}
                              >
                                <Save className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancel(index)}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(index)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Add Line Button */}
          {businessLines.length < 8 && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={handleAddLine}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une ligne ({businessLines.length}/8)
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
          disabled={businessLines.length !== 8 || isValidating}
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
              Valider Zone 1
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
