// ============================================
// ZONE 1 FILE UPLOAD - Upload avec Drag & Drop
// Gère l'upload de fichiers Excel/PDF vers Supabase Storage
// ============================================

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  File
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface UploadedFile {
  id: string
  file: File
  status: 'uploading' | 'completed' | 'error'
  progress: number
  supabaseUrl?: string
  error?: string
}

interface Zone1FileUploadProps {
  jobId: string
  onUploadComplete: (fileUrls: string[]) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
  'text/csv'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function Zone1FileUpload({
  jobId,
  onUploadComplete,
  maxFiles = 5,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES
}: Zone1FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const { toast } = useToast()

  const uploadFileToSupabase = async (file: File, fileId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${jobId}/${Date.now()}_${fileId}.${fileExt}`

    // Simuler la progression pour UX (Supabase ne fournit pas de vrai progress)
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId && f.progress < 90
            ? { ...f, progress: f.progress + 10 }
            : f
        )
      )
    }, 200)

    try {
      const { data, error } = await supabase.storage
        .from('datascanner-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)

      if (error) throw error

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('datascanner-uploads')
        .getPublicUrl(fileName)

      // Déterminer le type de fichier
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      let fileType: 'pdf' | 'excel' | 'csv' = 'excel'
      if (fileExtension === 'pdf') {
        fileType = 'pdf'
      } else if (fileExtension === 'csv') {
        fileType = 'csv'
      }

      // Enregistrer dans la table uploaded_files
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          job_id: jobId,
          filename: file.name,
          storage_path: fileName,
          storage_bucket: 'datascanner-uploads',
          file_size: file.size,
          file_type: fileType,
          mime_type: file.type,
          status: 'pending'
        })

      if (dbError) {
        console.error('❌ DB insert error:', dbError)
        // Non-bloquant, on continue quand même
      }

      return publicUrl
    } catch (error) {
      clearInterval(progressInterval)
      throw error
    }
  }

  const handleFileDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Vérifier la limite de fichiers
      if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
        toast({
          title: 'Limite atteinte',
          description: `Vous ne pouvez uploader que ${maxFiles} fichiers maximum`,
          variant: 'destructive'
        })
        return
      }

      // Créer les entrées de fichiers avec état "uploading"
      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
        file,
        status: 'uploading',
        progress: 0
      }))

      setUploadedFiles(prev => [...prev, ...newFiles])

      // Uploader chaque fichier
      for (const newFile of newFiles) {
        try {
          const supabaseUrl = await uploadFileToSupabase(newFile.file, newFile.id)

          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === newFile.id
                ? { ...f, status: 'completed', progress: 100, supabaseUrl }
                : f
            )
          )

          toast({
            title: 'Upload réussi',
            description: `${newFile.file.name} a été uploadé avec succès`
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'

          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === newFile.id
                ? { ...f, status: 'error', error: errorMessage }
                : f
            )
          )

          toast({
            title: 'Erreur d\'upload',
            description: `${newFile.file.name}: ${errorMessage}`,
            variant: 'destructive'
          })
        }
      }
    },
    [uploadedFiles.length, maxFiles, jobId, toast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    maxFiles,
    disabled: uploadedFiles.length >= maxFiles
  })

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleContinue = () => {
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed')
    const fileUrls = completedFiles
      .map(f => f.supabaseUrl)
      .filter((url): url is string => url !== undefined)

    if (fileUrls.length === 0) {
      toast({
        title: 'Aucun fichier',
        description: 'Veuillez uploader au moins un fichier avant de continuer',
        variant: 'destructive'
      })
      return
    }

    onUploadComplete(fileUrls)
  }

  const allCompleted = uploadedFiles.length > 0 && uploadedFiles.every(f => f.status === 'completed')
  const hasErrors = uploadedFiles.some(f => f.status === 'error')

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center
          transition-all duration-300
          ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
          ${uploadedFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos fichiers'}
            </h3>
            <p className="text-sm text-muted-foreground">
              ou cliquez pour sélectionner des fichiers
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Excel (.xlsx, .xls), PDF ou CSV acceptés</span>
            </div>
            <span>Taille maximale : 10 MB par fichier</span>
            <span>Jusqu'à {maxFiles} fichiers maximum</span>
          </div>
        </motion.div>
      </div>

      {/* Liste des fichiers uploadés */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="font-semibold">Fichiers ({uploadedFiles.length})</h4>

            {uploadedFiles.map(file => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className={`
                  ${file.status === 'completed' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : ''}
                  ${file.status === 'error' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' : ''}
                `}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Icône */}
                    <div className={`
                      flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg
                      ${file.status === 'uploading' ? 'bg-blue-100 dark:bg-blue-950' : ''}
                      ${file.status === 'completed' ? 'bg-green-100 dark:bg-green-950' : ''}
                      ${file.status === 'error' ? 'bg-red-100 dark:bg-red-950' : ''}
                    `}>
                      {file.status === 'uploading' && (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      )}
                      {file.status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    {/* Infos fichier */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-sm">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {/* Progress bar */}
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}

                      {/* Message d'erreur */}
                      {file.status === 'error' && (
                        <p className="mt-1 text-xs text-red-600">
                          {file.error}
                        </p>
                      )}
                    </div>

                    {/* Bouton supprimer */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveFile(file.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerte si erreurs */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreurs détectées</AlertTitle>
          <AlertDescription>
            Certains fichiers n'ont pas pu être uploadés. Vous pouvez les retirer et réessayer.
          </AlertDescription>
        </Alert>
      )}

      {/* Bouton Continuer */}
      {uploadedFiles.length > 0 && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!allCompleted}
            className="min-w-[200px]"
          >
            {allCompleted ? (
              <>
                Continuer avec {uploadedFiles.length} {uploadedFiles.length === 1 ? 'fichier' : 'fichiers'}
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Upload en cours...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
